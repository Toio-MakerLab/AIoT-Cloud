import type { MessageEvent } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import type { Observable } from 'rxjs';
import { defer, from, fromEvent, interval, merge } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import type { Repository } from 'typeorm';
import { In, LessThan } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { AccessScope } from '../../common/access-scope.util.ts';
import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { decodeBase64, encodeBase64 } from '../../common/utils.ts';
import { DeviceActionType } from '../../constants/device-action-type.ts';
import { DevicePushChannel } from '../../constants/device-push-channel.ts';
import { DEVICE_OFFLINE_THRESHOLD_MS, DeviceStatus } from '../../constants/device-status.ts';
import { DeviceTemplateType } from '../../constants/device-template-type.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { KAFKA_COMMAND_TOPIC, KAFKA_DEVICE_EVENTS_TOPIC, KAFKA_STATUS_TOPIC, KAFKA_TELEMETRY_TOPIC } from '../../constants/kafka-topics.ts';
import { defaultChannelCommandTopic, defaultCommandTopic, defaultStatusTopic, defaultTelemetryTopic } from '../../constants/mqtt-topics.ts';
import { NotificationChannelType } from '../../constants/notification-channel-type.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { KafkaProducerService } from '../kafka/kafka-producer.service.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceTelemetryEntity } from './device-telemetry.entity.ts';
import type { DeviceDto } from './dtos/device.dto.ts';
import type { DeviceConfigDto, UpdateDeviceConfigDto } from './dtos/device-config.dto.ts';
import type { DeviceTelemetryDto } from './dtos/device-telemetry.dto.ts';
import type { DevicesPageOptionsDto } from './dtos/devices-page-options.dto.ts';
import type { RegisterDeviceDto } from './dtos/register-device.dto.ts';
import type { TriggerDeviceActionDto } from './dtos/trigger-device-action.dto.ts';
import type { UnclaimedDeviceDto } from './dtos/unclaimed-device.dto.ts';
import type { DeviceKafkaConfig, DeviceMqttTopics } from './interfaces/device-network-config.interface.ts';
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

export interface DeviceChannelStateEvent {
  deviceId: string;
  channelStates: Record<string, string>;
  changedAt: Date;
}

export interface DeviceAlertEvent {
  deviceId: string;
  message: string;
  channels?: NotificationChannelType[];
  occurredAt: Date;
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
    private kafkaProducerService: KafkaProducerService,
  ) {}

  /** `factoryId` is copied from the registering user's own `UserEntity.factoryId`, so the device
   * follows its owner's factory and becomes readable by the whole factory, not just its owner. */
  @Transactional()
  async registerDevice(userId: string, factoryId: string | null, dto: RegisterDeviceDto): Promise<ResponseCore<RegisterDeviceResult>> {
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
      factoryId,
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

    // `device.config.mqtt.password` is stored base64-encoded (see updateDeviceConfig); the
    // env-sourced fallback below is already plaintext, so only decode the stored branch.
    const mqttBase = device.config?.mqtt
      ? { ...device.config.mqtt, password: device.config.mqtt.password }
      : {
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

    const kafka = device.pushChannel === DevicePushChannel.KAFKA ? await this.resolveKafkaConfig(device) : null;

    return ResponseCore.ok({
      deviceId: device.deviceId,
      name: device.name,
      type: device.template?.type ?? DeviceTemplateType.OTHER,
      apiEndpoint: device.config?.apiEndpoint ?? null,
      pushChannel: device.pushChannel,
      mqtt,
      http: device.pushChannel === DevicePushChannel.HTTP ? (device.config?.http ?? null) : null,
      kafka,
      configVersion: device.configVersion,
      offlineAlert: device.offlineAlert ?? null,
      alertRules: device.alertRules ?? null,
      failsafe: device.failsafe ?? null,
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

  /**
   * Resolves (and, on first boot, registers) the Kafka config handed to a device on the KAFKA
   * push channel. A GATEWAY sits between many local devices and the cloud, so unlike a single
   * device it needs the full set of uplink topics (telemetry/status/events) plus the shared
   * downlink command topic — not just telemetry. It also gets its own dedicated producer
   * `clientId`, generated once and persisted to `device.config.kafka`, so every message the
   * gateway sends to Kafka is attributable to that specific gateway instead of every gateway
   * sharing the platform's single default clientId.
   */
  private async resolveKafkaConfig(device: DeviceEntity): Promise<DeviceKafkaConfig> {
    if (device.config?.kafka) {
      return { ...device.config.kafka, password: decodeBase64(device.config.kafka.password) };
    }

    const kafkaFallback = this.apiConfigService.kafkaConfig;
    const isGateway = device.template?.type === DeviceTemplateType.GATEWAY;

    const kafka: DeviceKafkaConfig = {
      brokers: kafkaFallback.brokers,
      topics: isGateway ? [KAFKA_TELEMETRY_TOPIC, KAFKA_STATUS_TOPIC, KAFKA_DEVICE_EVENTS_TOPIC] : [KAFKA_TELEMETRY_TOPIC],
      // Only gateways consume this — they relay cloud -> device commands to whatever they bridge
      // locally (see docs/gateway-kafka-integration.md). Standalone (non-gateway) Kafka devices
      // have nothing to relay to, so they're never told about it.
      commandTopic: isGateway ? KAFKA_COMMAND_TOPIC : null,
      clientId: isGateway ? `${kafkaFallback.clientId}-gw-${device.deviceId}` : kafkaFallback.clientId,
      username: kafkaFallback.sasl?.username ?? null,
      password: kafkaFallback.sasl?.password ?? null,
    };

    device.config = { ...device.config, kafka: { ...kafka, password: encodeBase64(kafka.password) } };
    await this.deviceRepository.save(device);

    return kafka;
  }

  @Transactional()
  async updateDeviceConfig(userId: string, id: string, dto: UpdateDeviceConfigDto): Promise<ResponseCore<DeviceDto>> {
    const device = await this.deviceRepository.findOneBy({ id, userId });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    // Broker passwords are stored base64-encoded rather than plaintext — decoded back out
    // wherever they're actually needed (getBootConfig, for the device itself; DeviceDto, for the
    // admin dashboard's edit form).
    const mqtt = dto.mqtt !== undefined && dto.mqtt !== null ? { ...dto.mqtt, password: dto.mqtt.password } : dto.mqtt;
    const kafka = dto.kafka !== undefined && dto.kafka !== null ? { ...dto.kafka, password: encodeBase64(dto.kafka.password) } : dto.kafka;

    device.config = {
      ...device.config,
      ...(dto.apiEndpoint !== undefined && { apiEndpoint: dto.apiEndpoint }),
      ...(dto.mqtt !== undefined && { mqtt }),
      ...(dto.http !== undefined && { http: dto.http }),
      ...(dto.kafka !== undefined && { kafka }),
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

    if (dto.offlineAlert !== undefined) {
      device.offlineAlert = dto.offlineAlert;
    }

    if (dto.alertRules !== undefined) {
      device.alertRules = dto.alertRules;
    }

    if (dto.failsafe !== undefined) {
      device.failsafe = dto.failsafe;
    }

    device.configVersion += 1;

    await this.deviceRepository.save(device);

    return ResponseCore.ok(device.toDto());
  }

  async triggerDeviceAction(
    userId: string,
    id: string,
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

    // The device's own downlink topic for this specific action/channel, used by whatever
    // gateway/bridge relays the message onto the device's local MQTT — the per-channel topic
    // (`config.mqtt.topics.channels[].topic`) if the template defines one for this key, else
    // falling back to the device's general MQTT command topic. Carried in the outbound payload
    // so the gateway relays to the right place without re-deriving it from a cached boot-config.
    const channelTopic = device.config?.mqtt?.topics?.channels?.find((channel) => channel.key === dto.key)?.topic;
    const deviceMqttTopic = channelTopic ?? device.config?.mqtt?.topics?.command ?? undefined;

    // The actual Kafka topic the command is published on. A gateway (or any device configured
    // directly on the KAFKA push channel) gets its own dedicated commandTopic — accept whatever
    // is configured on the device instead of always hardcoding the shared bus, so a gateway can
    // be pointed at its own topic (e.g. "device.gateway.command"). Falls back to the shared bus
    // topic for devices with no Kafka config of their own (e.g. MQTT-only relay nodes, which are
    // bridged by a separate gateway device that IS listening on the shared bus).
    const kafkaTopic = device.config?.kafka?.commandTopic ?? KAFKA_COMMAND_TOPIC;
    const publishedAt = new Date();

    try {
      await this.kafkaProducerService.send(
        kafkaTopic,
        { deviceId: device.deviceId, key: dto.key, value: dto.value, topic: deviceMqttTopic },
        device.deviceId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish action ${dto.key}=${dto.value} to ${kafkaTopic}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return ResponseCore.fail(ErrorCode.INTERNAL_SERVER_ERROR, 'error.deviceActionPublishFailed');
    }

    return ResponseCore.ok({ key: dto.key, value: dto.value, topic: kafkaTopic, publishedAt });
  }

  /** `scope: null` means unrestricted (GUEST) — every device system-wide, not just the caller's own. */
  @Transactional()
  async getUserDevices(scope: AccessScope, pageOptionsDto: DevicesPageOptionsDto): Promise<PageDto<DeviceDto>> {
    const queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.template', 'template')
      .orderBy('device.createdAt', pageOptionsDto.order);

    if (scope && 'factoryId' in scope) {
      queryBuilder.where('device.factoryId = :factoryId', { factoryId: scope.factoryId });
    } else if (scope) {
      queryBuilder.where('device.userId = :userId', { userId: scope.userId });
    }

    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  /** `scope: null` means unrestricted (GUEST) — can look up any device, not just the caller's own. */
  async getDevice(scope: AccessScope, id: string): Promise<ResponseCore<DeviceDto>> {
    const entity = await this.deviceRepository.findOne({ where: scope ? { id, ...scope } : { id }, relations: ['template'] });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    return ResponseCore.ok(entity.toDto());
  }

  @Transactional()
  async deleteDevice(userId: string, id: string): Promise<ResponseCore<null>> {
    const entity = await this.deviceRepository.findOneBy({ id, userId });

    if (!entity) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    await this.deviceRepository.remove(entity);

    return ResponseCore.ok(null);
  }

  /** `scope: null` means unrestricted (GUEST) — can read telemetry history for any device. */
  async getDeviceTelemetryHistory(scope: AccessScope, id: string, limit: number): Promise<ResponseCore<DeviceTelemetryDto[]>> {
    const device = await this.deviceRepository.findOneBy(scope ? { id, ...scope } : { id });

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

  async getUserDeviceIds(userId: string): Promise<string[]> {
    const devices = await this.deviceRepository.find({ where: { userId }, select: ['deviceId'] });

    return devices.map((device) => device.deviceId);
  }

  async isOwnedByUser(userId: string, deviceId: string): Promise<boolean> {
    const count = await this.deviceRepository.countBy({ deviceId, userId });

    return count > 0;
  }

  /**
   * Resolves an entity id (what the frontend/dashboard widgets key on) to the device's physical
   * id (what MQTT topics + websocket rooms key on), scoped to devices the caller can access
   * (`scope: null` means unrestricted — GUEST can subscribe to any device). Used by the
   * websocket gateway's `subscribe:device` handler, which receives entity ids from the client.
   */
  async resolveOwnedDeviceByEntityId(scope: AccessScope, entityId: string): Promise<Pick<DeviceEntity, 'id' | 'deviceId'> | null> {
    return this.deviceRepository.findOne({ where: scope ? { id: entityId, ...scope } : { id: entityId }, select: ['id', 'deviceId'] });
  }

  /**
   * Live SSE feed for the dashboard: telemetry + status updates for the given device ids,
   * scoped to devices the caller can access (`scope: null` means unrestricted — GUEST sees every
   * device). `deviceIds` are entity ids (the same ids the REST device endpoints use), which this
   * resolves to the physical device ids that `device.telemetry` / `device.status` events key on,
   * then maps back to entity ids in the emitted payload.
   */
  streamDeviceEvents(scope: AccessScope, deviceIds: string[]): Observable<MessageEvent> {
    return defer(() => from(this.resolveEntityIdByPhysicalDeviceId(scope, deviceIds))).pipe(
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

  /**
   * Devices the caller can access, restricted to `entityIds` (when given), keyed by their
   * physical device id. `scope: null` means unrestricted (GUEST) — any device matching `entityIds`.
   */
  private async resolveEntityIdByPhysicalDeviceId(scope: AccessScope, entityIds: string[]): Promise<Map<string, string>> {
    if (entityIds.length === 0) {
      return new Map();
    }

    const devices = await this.deviceRepository.find({
      where: scope ? { id: In(entityIds), ...scope } : { id: In(entityIds) },
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

  /**
   * Handles the gateway's raw device-event envelope (`devices.events`): a `key=value` snapshot of
   * an actuator/channel's applied state (e.g. after relaying a `devices.commands` message down to
   * the device), rather than a full telemetry payload. Merged into the device's persisted
   * `channelStates` and broadcast to the dashboard as a `device.channelState` event.
   */
  async handleDeviceChannelEvent(deviceId: string, sourceTopic: string, message: unknown): Promise<void> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      this.logger.warn(`Ignoring device event for unclaimed device ${deviceId}`);
      await this.recordUnclaimedDevice(deviceId, sourceTopic, message);

      return;
    }

    const parsed = this.parseChannelStateMessage(message);

    if (!parsed) {
      this.logger.warn(`Ignoring unrecognized device event message from ${deviceId} on ${sourceTopic}: ${JSON.stringify(message)}`);

      return;
    }

    const changedAt = new Date();
    const channelStates = { ...(device.channelStates ?? {}), [parsed.key]: parsed.value };
    const wasOffline = device.status !== DeviceStatus.ONLINE;

    await this.deviceRepository.update(device.id, { channelStates, lastSeenAt: changedAt, status: DeviceStatus.ONLINE });

    this.eventEmitter.emit('device.channelState', { deviceId, channelStates, changedAt } satisfies DeviceChannelStateEvent);

    if (wasOffline) {
      this.eventEmitter.emit('device.status', { deviceId, status: DeviceStatus.ONLINE, changedAt } satisfies DeviceStatusEvent);
    }
  }

  /**
   * Handles `devices.cloud.alert`: an alert the device/gateway itself already decided to raise
   * (hardware fault, tamper, a threshold check done in firmware, etc.), as opposed to the
   * threshold breaches `DeviceWarningListener` derives itself from `device.telemetry`. Doesn't
   * touch device state — just forwards the message to the owner's notification channels via the
   * `device.alert` domain event.
   */
  async handleDeviceAlert(deviceId: string, payload: unknown): Promise<void> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      this.logger.warn(`Ignoring alert for unclaimed device ${deviceId}`);
      await this.recordUnclaimedDevice(deviceId, 'alert', payload);

      return;
    }

    const parsed = this.parseAlertPayload(payload);

    if (!parsed) {
      this.logger.warn(`Ignoring unrecognized alert payload from device ${deviceId}: ${JSON.stringify(payload)}`);

      return;
    }

    this.eventEmitter.emit('device.alert', {
      deviceId,
      message: `[Alert] ${device.name}: ${parsed.message}`,
      channels: parsed.channels,
      occurredAt: new Date(),
    } satisfies DeviceAlertEvent);
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

  /** Parses a raw `"relay1=OFF"`-style device-event message into its channel key/value. */
  private parseChannelStateMessage(message: unknown): { key: string; value: string } | null {
    if (typeof message !== 'string') {
      return null;
    }

    const separatorIndex = message.indexOf('=');

    if (separatorIndex <= 0) {
      return null;
    }

    const key = message.slice(0, separatorIndex).trim();
    const value = message.slice(separatorIndex + 1).trim();

    return key && value ? { key, value } : null;
  }

  /** Parses `devices.cloud.alert`'s `{ message, channels? }` payload. */
  private parseAlertPayload(payload: unknown): { message: string; channels?: NotificationChannelType[] } | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const { message, channels } = payload as { message?: unknown; channels?: unknown };

    if (typeof message !== 'string' || !message.trim()) {
      return null;
    }

    const validChannels = Array.isArray(channels)
      ? channels.filter(
          (channel): channel is NotificationChannelType =>
            typeof channel === 'string' && Object.values(NotificationChannelType).includes(channel as NotificationChannelType),
        )
      : undefined;

    return { message: message.trim(), channels: validChannels && validChannels.length > 0 ? validChannels : undefined };
  }
}
