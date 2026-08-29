import type { MessageEvent } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import type { Observable } from 'rxjs';
import { defer, from, fromEvent, interval, lastValueFrom, merge } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import type { Repository } from 'typeorm';
import { In, LessThan } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { DeviceActionType } from '../../constants/device-action-type.ts';
import { DevicePushChannel } from '../../constants/device-push-channel.ts';
import { DEVICE_OFFLINE_THRESHOLD_MS, DeviceStatus } from '../../constants/device-status.ts';
import { DeviceTemplateType } from '../../constants/device-template-type.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { KAFKA_COMMAND_TOPIC, KAFKA_TELEMETRY_TOPIC } from '../../constants/kafka-topics.ts';
import { defaultChannelCommandTopic, defaultCommandTopic, defaultStatusTopic, defaultTelemetryTopic } from '../../constants/mqtt-topics.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceTelemetryEntity } from './device-telemetry.entity.ts';
import type { DeviceDto } from './dtos/device.dto.ts';
import type { DeviceConfigDto, UpdateDeviceConfigDto } from './dtos/device-config.dto.ts';
import type { DeviceTelemetryDto } from './dtos/device-telemetry.dto.ts';
import type { DevicesPageOptionsDto } from './dtos/devices-page-options.dto.ts';
import type { RegisterDeviceDto } from './dtos/register-device.dto.ts';
import type { TriggerDeviceActionDto } from './dtos/trigger-device-action.dto.ts';
import type { UnclaimedDeviceDto } from './dtos/unclaimed-device.dto.ts';
import type { DeviceMqttTopics } from './interfaces/device-network-config.interface.ts';
import { KAFKA_COMMAND_CLIENT } from './kafka-command.client.ts';
import { UnclaimedDeviceEntity } from './unclaimed-device.entity.ts';

export interface DeviceTelemetryEvent {
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: Date;
}

export interface DeviceStatusEvent {
  deviceId: string;
  status: DeviceStatus;
  changedAt: Date;
}

export interface RegisterDeviceResult {
  device: DeviceDto;
}

/** How often the SSE stream sends a `ping` event, so proxies/load balancers don't time out an otherwise-idle connection. */
const SSE_HEARTBEAT_MS = 25_000;

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(DeviceEntity)
    private deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(DeviceTemplateEntity)
    private deviceTemplateRepository: Repository<DeviceTemplateEntity>,
    @InjectRepository(DeviceTelemetryEntity)
    private deviceTelemetryRepository: Repository<DeviceTelemetryEntity>,
    @InjectRepository(UnclaimedDeviceEntity)
    private unclaimedDeviceRepository: Repository<UnclaimedDeviceEntity>,
    private eventEmitter: EventEmitter2,
    private apiConfigService: ApiConfigService,
    @Inject(KAFKA_COMMAND_CLIENT) private kafkaCommandClient: ClientProxy,
  ) {}

  @Transactional()
  async registerDevice(userId: Uuid, dto: RegisterDeviceDto): Promise<ResponseCore<RegisterDeviceResult>> {
    const template = await this.deviceTemplateRepository.findOneBy({ id: dto.templateId });

    if (!template) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceTemplateNotFound');
    }

    const existing = await this.deviceRepository.findOneBy({ deviceId: dto.deviceId });

    if (existing) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.deviceAlreadyRegistered');
    }

    const entity = this.deviceRepository.create({
      deviceId: dto.deviceId,
      name: dto.name,
      templateId: dto.templateId,
      userId,
      isActive: dto.isActive ?? true,
    });

    await this.deviceRepository.save(entity);
    entity.template = template;

    await this.unclaimedDeviceRepository.delete({ deviceId: dto.deviceId });

    return ResponseCore.ok({ device: entity.toDto() });
  }

  findByDeviceId(deviceId: string): Promise<DeviceEntity | null> {
    return this.deviceRepository.findOneBy({ deviceId });
  }

  async getBootConfig(deviceId: string): Promise<ResponseCore<DeviceConfigDto>> {
    const device = await this.deviceRepository.findOne({ where: { deviceId }, relations: ['template'] });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const mqttFallback = this.apiConfigService.mqttConfig;

    const mqttBase = device.config?.mqtt ?? {
      broker: mqttFallback.url,
      port: 1883,
      username: mqttFallback.username,
      password: mqttFallback.password,
      topics: {
        telemetry: defaultTelemetryTopic(device.deviceId),
        command: defaultCommandTopic(device.deviceId),
        status: defaultStatusTopic(device.deviceId),
      },
    };

    const mqtt = device.pushChannel === DevicePushChannel.MQTT ? { ...mqttBase, topics: this.buildMqttTopics(device, mqttBase.topics) } : null;

    const kafkaFallback = this.apiConfigService.kafkaConfig;

    const kafka =
      device.pushChannel === DevicePushChannel.KAFKA
        ? (device.config?.kafka ?? {
            brokers: kafkaFallback.brokers,
            topic: KAFKA_TELEMETRY_TOPIC,
            clientId: kafkaFallback.clientId,
            username: kafkaFallback.sasl?.username ?? null,
            password: kafkaFallback.sasl?.password ?? null,
          })
        : null;

    return ResponseCore.ok({
      deviceId: device.deviceId,
      name: device.name,
      apiEndpoint: device.config?.apiEndpoint ?? null,
      pushChannel: device.pushChannel,
      mqtt,
      http: device.pushChannel === DevicePushChannel.HTTP ? (device.config?.http ?? null) : null,
      kafka,
      configVersion: device.configVersion,
    });
  }

  /**
   * Appends per-channel command topics for multi-channel templates (e.g. a relay node) on top
   * of the device's base topics. Channel count/order/labels always follow the template's
   * `actionSchema`, so adding/removing an action on the template automatically resizes the list
   * the ESP32 firmware sees in boot-config, without needing a dedicated "channel count" field.
   * The topic itself keeps whatever value the user configured for that channel key (matched by
   * `key`, not by array position, so reordering actions on the template doesn't scramble
   * existing overrides); channels with no stored override fall back to the auto-derived topic.
   */
  private buildMqttTopics(device: DeviceEntity, baseTopics: DeviceMqttTopics): DeviceMqttTopics {
    const actionSchema = device.template?.actionSchema;

    const isChannelBasedTemplate =
      device.template?.type === DeviceTemplateType.RELAY_NODE || device.template?.type === DeviceTemplateType.RELAY_CURRENT_NODE;

    if (!isChannelBasedTemplate || !actionSchema?.length) {
      return baseTopics;
    }

    const overridesByKey = new Map((baseTopics.channels ?? []).map((channel) => [channel.key, channel.topic]));

    const channels = actionSchema.map((action, index) => ({
      index: index + 1,
      key: action.key,
      label: action.label,
      topic: overridesByKey.get(action.key) || defaultChannelCommandTopic(device.deviceId, index + 1),
    }));

    return { ...baseTopics, channels };
  }

  @Transactional()
  async updateDeviceConfig(userId: Uuid, id: Uuid, dto: UpdateDeviceConfigDto): Promise<ResponseCore<DeviceDto>> {
    const device = await this.deviceRepository.findOneBy({ id, userId });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    device.config = {
      ...device.config,
      ...(dto.apiEndpoint !== undefined && { apiEndpoint: dto.apiEndpoint }),
      ...(dto.mqtt !== undefined && { mqtt: dto.mqtt }),
      ...(dto.http !== undefined && { http: dto.http }),
      ...(dto.kafka !== undefined && { kafka: dto.kafka }),
    };

    if (dto.pushChannel !== undefined) {
      device.pushChannel = dto.pushChannel;
    }

    if (dto.isActive !== undefined) {
      device.isActive = dto.isActive;
    }

    if (dto.warningOverrides !== undefined) {
      device.warningOverrides = dto.warningOverrides;
    }

    device.configVersion += 1;

    await this.deviceRepository.save(device);

    return ResponseCore.ok(device.toDto());
  }

  async triggerDeviceAction(
    userId: Uuid,
    id: Uuid,
    dto: TriggerDeviceActionDto,
  ): Promise<ResponseCore<{ key: string; value: string; topic: string; publishedAt: Date }>> {
    const device = await this.deviceRepository.findOne({ where: { id, userId }, relations: ['template'] });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const actionDef = device.template?.actionSchema?.find((action) => action.key === dto.key);

    if (!actionDef) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.deviceActionNotFound');
    }

    if (actionDef.type === DeviceActionType.TOGGLE && dto.value !== actionDef.onValue && dto.value !== actionDef.offValue) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.deviceActionInvalidValue');
    }

    if (device.pushChannel !== DevicePushChannel.MQTT && device.pushChannel !== DevicePushChannel.KAFKA) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.deviceActionChannelUnsupported');
    }

    // The cloud backend has no route to the device-side MQTT broker (it's private to the
    // local network/gateway), so action delivery always goes out via the shared Kafka
    // command topic. A gateway (or broker bridge) consumes it and relays to the device over
    // its own local MQTT.
    const topic = KAFKA_COMMAND_TOPIC;
    const publishedAt = new Date();

    try {
      await lastValueFrom(this.kafkaCommandClient.emit(topic, { deviceId: device.deviceId, key: dto.key, value: dto.value }));
    } catch (error) {
      this.logger.error(`Failed to publish action ${dto.key}=${dto.value} to ${topic}: ${error instanceof Error ? error.message : String(error)}`);

      return ResponseCore.fail(ErrorCode.INTERNAL_SERVER_ERROR, 'error.deviceActionPublishFailed');
    }

    return ResponseCore.ok({ key: dto.key, value: dto.value, topic, publishedAt });
  }

  @Transactional()
  async getUserDevices(userId: Uuid, pageOptionsDto: DevicesPageOptionsDto): Promise<PageDto<DeviceDto>> {
    const queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.template', 'template')
      .where('device.userId = :userId', { userId })
      .orderBy('device.createdAt', pageOptionsDto.order);

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getDevice(userId: Uuid, id: Uuid): Promise<ResponseCore<DeviceDto>> {
    const entity = await this.deviceRepository.findOne({ where: { id, userId }, relations: ['template'] });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async deleteDevice(userId: Uuid, id: Uuid): Promise<ResponseCore<null>> {
    const entity = await this.deviceRepository.findOneBy({ id, userId });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    await this.deviceRepository.remove(entity);

    return ResponseCore.ok(null);
  }

  async getDeviceTelemetryHistory(userId: Uuid, id: Uuid, limit: number): Promise<ResponseCore<DeviceTelemetryDto[]>> {
    const device = await this.deviceRepository.findOneBy({ id, userId });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const entities = await this.deviceTelemetryRepository.find({
      where: { deviceId: device.id },
      order: { recordedAt: 'DESC' },
      take: limit,
    });

    return ResponseCore.ok(entities.reverse().toDtos());
  }

  async getUserDeviceIds(userId: Uuid): Promise<string[]> {
    const devices = await this.deviceRepository.find({ where: { userId }, select: ['deviceId'] });

    return devices.map((device) => device.deviceId);
  }

  async isOwnedByUser(userId: Uuid, deviceId: string): Promise<boolean> {
    const count = await this.deviceRepository.countBy({ deviceId, userId });

    return count > 0;
  }

  /**
   * Resolves an entity id (what the frontend/dashboard widgets key on) to the device's physical
   * id (what MQTT topics + websocket rooms key on), scoped to devices the user owns. Used by the
   * websocket gateway's `subscribe:device` handler, which receives entity ids from the client.
   */
  async resolveOwnedDeviceByEntityId(userId: Uuid, entityId: string): Promise<Pick<DeviceEntity, 'id' | 'deviceId'> | null> {
    return this.deviceRepository.findOne({ where: { id: entityId, userId }, select: ['id', 'deviceId'] });
  }

  /**
   * Live SSE feed for the dashboard: telemetry + status updates for the given device ids,
   * scoped to devices the user owns. `deviceIds` are entity ids (the same ids the REST device
   * endpoints use), which this resolves to the physical device ids that `device.telemetry` /
   * `device.status` events key on, then maps back to entity ids in the emitted payload.
   */
  streamDeviceEvents(userId: Uuid, deviceIds: string[]): Observable<MessageEvent> {
    return defer(() => from(this.resolveEntityIdByPhysicalDeviceId(userId, deviceIds))).pipe(
      switchMap((entityIdByPhysicalDeviceId) => {
        const telemetry$ = fromEvent<DeviceTelemetryEvent>(this.eventEmitter, 'device.telemetry').pipe(
          filter((event) => entityIdByPhysicalDeviceId.has(event.deviceId)),
          map(
            (event) =>
              ({
                type: 'telemetry',
                data: {
                  deviceId: entityIdByPhysicalDeviceId.get(event.deviceId),
                  payload: event.payload,
                  recordedAt: event.recordedAt,
                },
              }) satisfies MessageEvent,
          ),
        );

        const status$ = fromEvent<DeviceStatusEvent>(this.eventEmitter, 'device.status').pipe(
          filter((event) => entityIdByPhysicalDeviceId.has(event.deviceId)),
          map(
            (event) =>
              ({
                type: 'status',
                data: {
                  deviceId: entityIdByPhysicalDeviceId.get(event.deviceId),
                  status: event.status,
                  changedAt: event.changedAt,
                },
              }) satisfies MessageEvent,
          ),
        );

        const heartbeat$ = interval(SSE_HEARTBEAT_MS).pipe(
          map(() => ({ type: 'ping', data: { now: new Date().toISOString() } }) satisfies MessageEvent),
        );

        return merge(telemetry$, status$, heartbeat$);
      }),
    );
  }

  /** Devices the user owns, restricted to `entityIds` (when given), keyed by their physical device id. */
  private async resolveEntityIdByPhysicalDeviceId(userId: Uuid, entityIds: string[]): Promise<Map<string, string>> {
    if (entityIds.length === 0) {
      return new Map();
    }

    const devices = await this.deviceRepository.find({
      where: { id: In(entityIds), userId },
      select: ['id', 'deviceId'],
    });

    return new Map(devices.map((device) => [device.deviceId, device.id]));
  }

  /** Used by notification warning checks, which need the template's telemetry schema alongside the device. */
  async findByDeviceIdWithTemplate(deviceId: string): Promise<DeviceEntity | null> {
    return this.deviceRepository.findOne({ where: { deviceId }, relations: ['template'] });
  }

  async recordTelemetry(deviceId: string, payload: unknown): Promise<void> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      this.logger.warn(`Ignoring telemetry for unclaimed device ${deviceId}`);
      await this.recordUnclaimedDevice(deviceId, 'telemetry', payload);

      return;
    }

    const recordedAt = new Date();
    const normalizedPayload = (payload && typeof payload === 'object' ? payload : { value: payload }) as Record<string, unknown>;

    const telemetry = this.deviceTelemetryRepository.create({
      deviceId: device.id,
      payload: normalizedPayload,
      recordedAt,
    });

    const wasOffline = device.status !== DeviceStatus.ONLINE;

    await Promise.all([
      this.deviceTelemetryRepository.save(telemetry),
      this.deviceRepository.update(device.id, { lastSeenAt: recordedAt, status: DeviceStatus.ONLINE }),
    ]);

    this.eventEmitter.emit('device.telemetry', {
      deviceId,
      payload: normalizedPayload,
      recordedAt,
    } satisfies DeviceTelemetryEvent);

    if (wasOffline) {
      this.eventEmitter.emit('device.status', {
        deviceId,
        status: DeviceStatus.ONLINE,
        changedAt: recordedAt,
      } satisfies DeviceStatusEvent);
    }
  }

  /** Handles the MQTT status topic: explicit online announcements and LWT-triggered offline messages. */
  async handleDeviceStatusMessage(deviceId: string, payload: unknown): Promise<void> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      this.logger.warn(`Ignoring status for unclaimed device ${deviceId}`);
      await this.recordUnclaimedDevice(deviceId, 'status', payload);

      return;
    }

    const status = this.parseStatusPayload(payload);

    if (!status) {
      this.logger.warn(`Ignoring unrecognized status payload from device ${deviceId}: ${JSON.stringify(payload)}`);

      return;
    }

    const changedAt = new Date();

    if (status === DeviceStatus.ONLINE) {
      await this.deviceRepository.update(device.id, { status, lastSeenAt: changedAt });
    } else {
      await this.deviceRepository.update(device.id, { status });
    }

    if (status !== device.status) {
      this.eventEmitter.emit('device.status', { deviceId, status, changedAt } satisfies DeviceStatusEvent);
    }
  }

  /** Marks devices OFFLINE once they haven't been heard from (telemetry or status) for `DEVICE_OFFLINE_THRESHOLD_MS`. */
  async sweepOfflineDevices(): Promise<void> {
    const cutoff = new Date(Date.now() - DEVICE_OFFLINE_THRESHOLD_MS);

    const staleDevices = await this.deviceRepository.find({
      where: { status: DeviceStatus.ONLINE, lastSeenAt: LessThan(cutoff) },
      select: { id: true, deviceId: true },
    });

    if (staleDevices.length === 0) {
      return;
    }

    const changedAt = new Date();

    await this.deviceRepository.update({ id: In(staleDevices.map((device) => device.id)) }, { status: DeviceStatus.OFFLINE });

    for (const device of staleDevices) {
      this.eventEmitter.emit('device.status', {
        deviceId: device.deviceId,
        status: DeviceStatus.OFFLINE,
        changedAt,
      } satisfies DeviceStatusEvent);
    }
  }

  async listUnclaimedDevices(): Promise<ResponseCore<UnclaimedDeviceDto[]>> {
    const devices = await this.unclaimedDeviceRepository.find({ order: { lastSeenAt: 'DESC' } });

    return ResponseCore.ok(devices.toDtos());
  }

  private async recordUnclaimedDevice(deviceId: string, topic: string, payload: unknown): Promise<void> {
    const lastSeenAt = new Date();
    const lastPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const existing = await this.unclaimedDeviceRepository.findOneBy({ deviceId });

    if (existing) {
      await this.unclaimedDeviceRepository.update(existing.id, { lastTopic: topic, lastPayload, lastSeenAt });

      return;
    }

    const entity = this.unclaimedDeviceRepository.create({ deviceId, lastTopic: topic, lastPayload, lastSeenAt });

    await this.unclaimedDeviceRepository.save(entity);
  }

  private parseStatusPayload(payload: unknown): DeviceStatus | null {
    const raw =
      typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object' && 'status' in payload
          ? (payload as { status: unknown }).status
          : undefined;

    if (typeof raw !== 'string') {
      return null;
    }

    const normalized = raw.trim().toUpperCase();

    return normalized === DeviceStatus.ONLINE || normalized === DeviceStatus.OFFLINE ? (normalized as DeviceStatus) : null;
  }
}
