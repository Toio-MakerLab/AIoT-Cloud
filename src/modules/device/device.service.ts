import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { DevicePushChannel } from '../../constants/device-push-channel.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { KAFKA_TELEMETRY_TOPIC } from '../../constants/kafka-topics.ts';
import { defaultCommandTopic, defaultStatusTopic, defaultTelemetryTopic } from '../../constants/mqtt-topics.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceTelemetryEntity } from './device-telemetry.entity.ts';
import type { DeviceDto } from './dtos/device.dto.ts';
import type { DeviceConfigDto, UpdateDeviceConfigDto } from './dtos/device-config.dto.ts';
import type { DeviceTelemetryDto } from './dtos/device-telemetry.dto.ts';
import type { DevicesPageOptionsDto } from './dtos/devices-page-options.dto.ts';
import type { RegisterDeviceDto } from './dtos/register-device.dto.ts';

export interface DeviceTelemetryEvent {
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: Date;
}

export interface RegisterDeviceResult {
  device: DeviceDto;
  deviceSecret: string;
}

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
    private eventEmitter: EventEmitter2,
    private apiConfigService: ApiConfigService,
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

    const { plaintext, hash } = this.generateDeviceSecret();

    const entity = this.deviceRepository.create({
      deviceId: dto.deviceId,
      name: dto.name,
      templateId: dto.templateId,
      userId,
      deviceSecretHash: hash,
      secretIssuedAt: new Date(),
    });

    await this.deviceRepository.save(entity);
    entity.template = template;

    return ResponseCore.ok({ device: entity.toDto(), deviceSecret: plaintext });
  }

  private generateDeviceSecret(): { plaintext: string; hash: string } {
    const plaintext = randomBytes(32).toString('hex');

    return { plaintext, hash: this.hashSecret(plaintext) };
  }

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  async verifyDeviceSecret(deviceId: string, secret: string): Promise<DeviceEntity | null> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device?.deviceSecretHash) {
      return null;
    }

    const providedHash = Buffer.from(this.hashSecret(secret));
    const storedHash = Buffer.from(device.deviceSecretHash);

    if (providedHash.length !== storedHash.length || !timingSafeEqual(providedHash, storedHash)) {
      return null;
    }

    return device;
  }

  async getBootConfig(deviceId: string): Promise<ResponseCore<DeviceConfigDto>> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const mqttFallback = this.apiConfigService.mqttConfig;

    const mqtt =
      device.pushChannel === DevicePushChannel.MQTT
        ? (device.config?.mqtt ?? {
            broker: mqttFallback.url,
            port: 1883,
            username: mqttFallback.username,
            password: mqttFallback.password,
            topics: {
              telemetry: defaultTelemetryTopic(device.deviceId),
              command: defaultCommandTopic(device.deviceId),
              status: defaultStatusTopic(device.deviceId),
            },
          })
        : null;

    const kafkaFallback = this.apiConfigService.kafkaConfig;

    const kafka =
      device.pushChannel === DevicePushChannel.KAFKA
        ? (device.config?.kafka ?? {
            brokers: kafkaFallback.brokers,
            topic: KAFKA_TELEMETRY_TOPIC,
            clientId: kafkaFallback.clientId,
          })
        : null;

    return ResponseCore.ok({
      deviceId: device.deviceId,
      apiEndpoint: device.config?.apiEndpoint ?? null,
      pushChannel: device.pushChannel,
      mqtt,
      http: device.pushChannel === DevicePushChannel.HTTP ? (device.config?.http ?? null) : null,
      kafka,
      configVersion: device.configVersion,
    });
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

    device.configVersion += 1;

    await this.deviceRepository.save(device);

    return ResponseCore.ok(device.toDto());
  }

  @Transactional()
  async regenerateDeviceSecret(userId: Uuid, id: Uuid): Promise<ResponseCore<{ deviceSecret: string }>> {
    const device = await this.deviceRepository.findOneBy({ id, userId });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const { plaintext, hash } = this.generateDeviceSecret();

    device.deviceSecretHash = hash;
    device.secretIssuedAt = new Date();
    await this.deviceRepository.save(device);

    return ResponseCore.ok({ deviceSecret: plaintext });
  }

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

  async recordTelemetry(deviceId: string, payload: unknown): Promise<void> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      this.logger.warn(`Ignoring telemetry for unclaimed device ${deviceId}`);

      return;
    }

    const recordedAt = new Date();
    const normalizedPayload = (payload && typeof payload === 'object' ? payload : { value: payload }) as Record<string, unknown>;

    const telemetry = this.deviceTelemetryRepository.create({
      deviceId: device.id,
      payload: normalizedPayload,
      recordedAt,
    });

    await Promise.all([this.deviceTelemetryRepository.save(telemetry), this.deviceRepository.update(device.id, { lastSeenAt: recordedAt })]);

    this.eventEmitter.emit('device.telemetry', {
      deviceId,
      payload: normalizedPayload,
      recordedAt,
    } satisfies DeviceTelemetryEvent);
  }
}
