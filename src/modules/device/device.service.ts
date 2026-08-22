import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceTelemetryEntity } from './device-telemetry.entity.ts';
import type { DeviceDto } from './dtos/device.dto.ts';
import type { DeviceTelemetryDto } from './dtos/device-telemetry.dto.ts';
import type { DevicesPageOptionsDto } from './dtos/devices-page-options.dto.ts';
import type { RegisterDeviceDto } from './dtos/register-device.dto.ts';

export interface DeviceTelemetryEvent {
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: Date;
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
  ) {}

  @Transactional()
  async registerDevice(userId: Uuid, dto: RegisterDeviceDto): Promise<ResponseCore<DeviceDto>> {
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
    });

    await this.deviceRepository.save(entity);
    entity.template = template;

    return ResponseCore.ok(entity.toDto());
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
