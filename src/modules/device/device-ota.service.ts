import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AccessScope } from '../../common/access-scope.util.ts';
import { ResponseCore } from '../../common/dto/response-core.dto.ts';
import { DeviceOtaStatus, OTA_IN_PROGRESS_STATUSES } from '../../constants/device-ota-status.ts';
import { DevicePushChannel } from '../../constants/device-push-channel.ts';
import { ErrorCode } from '../../constants/error-code.ts';
import { KAFKA_GATEWAY_COMMANDS_TOPIC } from '../../constants/kafka-topics.ts';
import { defaultOtaTopic } from '../../constants/mqtt-topics.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { FirmwareService } from '../device-template/firmware.service.ts';
import { KafkaProducerService } from '../kafka/kafka-producer.service.ts';
import { MqttProducerService } from '../mqtt/mqtt-producer.service.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceOtaUpdateEntity } from './device-ota-update.entity.ts';
import type { DeviceOtaStatusDto, DeviceOtaUpdateDto, OtaManifestDto, TriggerOtaUpdateDto } from './dtos/device-ota.dto.ts';

/** Uplink OTA progress/result report — same envelope on the MQTT `ota/status` topic and the Kafka `KAFKA_OTA_STATUS_TOPIC`. */
export interface OtaStatusReportPayload {
  status?: string;
  version?: string;
  progress?: number;
  error?: string;
}

export interface DeviceOtaStatusEvent {
  deviceId: string;
  status: DeviceOtaStatus;
  version?: string | null;
  progress?: number | null;
  error?: string | null;
  changedAt: Date;
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseOtaStatus(raw: string | undefined): DeviceOtaStatus | null {
  const normalized = raw?.trim().toUpperCase();

  return normalized && (Object.values(DeviceOtaStatus) as string[]).includes(normalized) ? (normalized as DeviceOtaStatus) : null;
}

/**
 * Drives OTA (over-the-air) firmware updates for a device: dispatches an update from the catalog
 * `FirmwareService` owns (cloud -> device, via MQTT/Kafka, mirroring `DeviceService.triggerDeviceAction`'s
 * push-channel branching), and applies the device's own progress/result reports back
 * (device -> cloud, via `handleOtaStatusReport`). `DeviceEntity.ota*` always reflects the current/most
 * recent attempt; `DeviceOtaUpdateEntity` keeps the full history, same relationship as `channelStates`
 * is to `DeviceTelemetryEntity`. See also `getManifest` for the pull-based counterpart a device can poll
 * on its own instead of waiting for a cloud-initiated push.
 */
@Injectable()
export class DeviceOtaService {
  private readonly logger = new Logger(DeviceOtaService.name);

  constructor(
    @InjectRepository(DeviceEntity)
    private deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(DeviceOtaUpdateEntity)
    private deviceOtaUpdateRepository: Repository<DeviceOtaUpdateEntity>,
    private firmwareService: FirmwareService,
    private apiConfigService: ApiConfigService,
    private kafkaProducerService: KafkaProducerService,
    private mqttProducerService: MqttProducerService,
    private eventEmitter: EventEmitter2,
  ) {}

  async triggerUpdate(userId: string, id: string, dto: TriggerOtaUpdateDto): Promise<ResponseCore<DeviceOtaStatusDto>> {
    const device = await this.deviceRepository.findOneBy({ id, userId });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const firmware = await this.firmwareService.findEntityById(dto.firmwareId);

    if (!firmware) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.firmwareNotFound');
    }

    if (firmware.templateId !== device.templateId) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.firmwareTemplateMismatch');
    }

    if (!firmware.isActive) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.firmwareInactive');
    }

    if (device.pushChannel !== DevicePushChannel.MQTT && device.pushChannel !== DevicePushChannel.KAFKA) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.deviceActionChannelUnsupported');
    }

    if (OTA_IN_PROGRESS_STATUSES.includes(device.otaStatus as DeviceOtaStatus)) {
      return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.deviceOtaAlreadyInProgress');
    }

    const requestedAt = new Date();
    const payload = {
      deviceId: device.deviceId,
      version: firmware.version,
      url: firmware.fileUrl,
      checksum: firmware.checksum,
      size: firmware.sizeBytes,
    };

    try {
      if (device.pushChannel === DevicePushChannel.KAFKA) {
        await this.kafkaProducerService.send(KAFKA_GATEWAY_COMMANDS_TOPIC, { ...payload, type: 'ota_update' }, device.deviceId);
      } else {
        if (!this.apiConfigService.mqttEnabled) {
          return ResponseCore.fail(ErrorCode.BAD_REQUEST, 'error.mqttDisabled');
        }

        const otaTopic = device.config?.mqtt?.topics?.ota ?? defaultOtaTopic(device.deviceId);
        await this.mqttProducerService.publish(otaTopic, payload);
      }
    } catch (error) {
      this.logger.error(
        `Failed to publish OTA update ${firmware.version} to device ${device.deviceId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return ResponseCore.fail(ErrorCode.INTERNAL_SERVER_ERROR, 'error.deviceOtaPublishFailed');
    }

    device.otaStatus = DeviceOtaStatus.PENDING;
    device.otaFirmwareId = firmware.id;
    device.otaTargetVersion = firmware.version;
    device.otaProgress = 0;
    device.otaError = null;
    device.otaRequestedAt = requestedAt;
    device.otaUpdatedAt = requestedAt;
    await this.deviceRepository.save(device);

    const history = this.deviceOtaUpdateRepository.create({
      deviceId: device.id,
      firmwareId: firmware.id,
      fromVersion: device.firmwareVersion,
      toVersion: firmware.version,
      status: DeviceOtaStatus.PENDING,
      progress: 0,
      requestedAt,
    });
    await this.deviceOtaUpdateRepository.save(history);

    this.eventEmitter.emit('device.otaStatus', {
      deviceId: device.deviceId,
      status: DeviceOtaStatus.PENDING,
      version: firmware.version,
      progress: 0,
      changedAt: requestedAt,
    } satisfies DeviceOtaStatusEvent);

    return ResponseCore.ok(this.toStatusDto(device));
  }

  /** `scope: null` means unrestricted (GUEST) — can read any device's OTA status. */
  async getStatus(scope: AccessScope, id: string): Promise<ResponseCore<DeviceOtaStatusDto>> {
    const device = await this.deviceRepository.findOne({ where: scope ? { id, ...scope } : { id } });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    return ResponseCore.ok(this.toStatusDto(device));
  }

  /** `scope: null` means unrestricted (GUEST) — can read any device's OTA history. */
  async getHistory(scope: AccessScope, id: string): Promise<ResponseCore<DeviceOtaUpdateDto[]>> {
    const device = await this.deviceRepository.findOne({ where: scope ? { id, ...scope } : { id } });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const entities = await this.deviceOtaUpdateRepository.find({
      where: { deviceId: device.id },
      order: { requestedAt: 'DESC' },
      take: 50,
    });

    return ResponseCore.ok(entities.toDtos());
  }

  /**
   * Pull-based "is there an update for me" check a device/gateway can poll on its own boot/interval
   * cycle — `id` here is the device's physical `deviceId`, matched the same way `getBootConfig` is,
   * since this is called by the device itself (see `DeviceProvisioningController`), not the dashboard.
   */
  async getManifest(deviceId: string): Promise<ResponseCore<OtaManifestDto>> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      return ResponseCore.fail(ErrorCode.NOT_FOUND, 'error.deviceNotFound');
    }

    const firmware = await this.firmwareService.findLatestActiveForTemplate(device.templateId);
    const updateAvailable = !!firmware && firmware.version !== device.firmwareVersion;

    return ResponseCore.ok({
      deviceId: device.deviceId,
      currentVersion: device.firmwareVersion,
      updateAvailable,
      latestVersion: firmware?.version ?? null,
      fileUrl: updateAvailable ? (firmware?.fileUrl ?? null) : null,
      checksum: updateAvailable ? (firmware?.checksum ?? null) : null,
      sizeBytes: updateAvailable ? (firmware?.sizeBytes ?? null) : null,
      releaseNotes: updateAvailable ? (firmware?.releaseNotes ?? null) : null,
    });
  }

  /**
   * Applies a device's own OTA progress/result report — the uplink counterpart of `triggerUpdate`,
   * consumed from either the MQTT `devices/{deviceId}/ota/status` topic or the Kafka
   * `KAFKA_OTA_STATUS_TOPIC`. Unrecognized `status` values are logged and ignored rather than
   * erroring, the same defensive stance `handleDeviceStatusMessage` takes for status payloads.
   */
  async handleOtaStatusReport(deviceId: string, payload: OtaStatusReportPayload): Promise<void> {
    const device = await this.deviceRepository.findOneBy({ deviceId });

    if (!device) {
      this.logger.warn(`Ignoring OTA status report for unclaimed device ${deviceId}`);

      return;
    }

    const status = parseOtaStatus(payload.status);

    if (!status) {
      this.logger.warn(`Ignoring unrecognized OTA status report from device ${deviceId}: ${JSON.stringify(payload)}`);

      return;
    }

    const changedAt = new Date();
    const progress = payload.progress !== undefined ? clampProgress(payload.progress) : device.otaProgress;

    device.otaStatus = status;
    device.otaUpdatedAt = changedAt;
    device.otaProgress = status === DeviceOtaStatus.SUCCESS ? 100 : progress;

    if (status === DeviceOtaStatus.SUCCESS) {
      device.firmwareVersion = payload.version ?? device.firmwareVersion;
      device.otaError = null;
    } else if (status === DeviceOtaStatus.FAILED) {
      device.otaError = payload.error ?? 'Unknown error';
    }

    await this.deviceRepository.save(device);

    const latest = await this.deviceOtaUpdateRepository.findOne({ where: { deviceId: device.id }, order: { requestedAt: 'DESC' } });

    if (latest && !latest.completedAt) {
      latest.status = status;
      latest.progress = device.otaProgress;

      if (!latest.startedAt && (status === DeviceOtaStatus.DOWNLOADING || status === DeviceOtaStatus.INSTALLING)) {
        latest.startedAt = changedAt;
      }

      if (status === DeviceOtaStatus.SUCCESS || status === DeviceOtaStatus.FAILED) {
        latest.completedAt = changedAt;
        latest.error = status === DeviceOtaStatus.FAILED ? device.otaError : null;
      }

      await this.deviceOtaUpdateRepository.save(latest);
    }

    this.eventEmitter.emit('device.otaStatus', {
      deviceId,
      status,
      version: payload.version ?? device.firmwareVersion,
      progress: device.otaProgress,
      error: device.otaError,
      changedAt,
    } satisfies DeviceOtaStatusEvent);
  }

  private toStatusDto(device: DeviceEntity): DeviceOtaStatusDto {
    return {
      deviceId: device.deviceId,
      status: device.otaStatus as DeviceOtaStatus,
      currentVersion: device.firmwareVersion,
      targetVersion: device.otaTargetVersion,
      firmwareId: device.otaFirmwareId,
      progress: device.otaProgress,
      error: device.otaError,
      requestedAt: device.otaRequestedAt,
      updatedAt: device.otaUpdatedAt,
    };
  }
}
