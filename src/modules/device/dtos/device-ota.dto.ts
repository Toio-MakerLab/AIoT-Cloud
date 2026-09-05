import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { DeviceOtaStatus } from '../../../constants/device-ota-status.ts';
import { DateFieldOptional, EnumField, NumberFieldOptional, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { DeviceOtaUpdateEntity } from '../device-ota-update.entity.ts';

export class TriggerOtaUpdateDto {
  /** Must be an active `FirmwareEntity` whose `templateId` matches the target device's own template. */
  @StringField()
  firmwareId!: string;
}

/** Response for `POST/GET .../ota` — the device's current (or most recently completed) OTA attempt, mirrored off `DeviceEntity.ota*`. */
export class DeviceOtaStatusDto {
  deviceId!: string;
  status!: DeviceOtaStatus;
  currentVersion!: string | null;
  targetVersion!: string | null;
  firmwareId!: string | null;
  progress!: number | null;
  error!: string | null;
  requestedAt!: Date | null;
  updatedAt!: Date | null;
}

/** One row of `GET .../ota/history`. */
export class DeviceOtaUpdateDto extends AbstractDto {
  @StringField()
  deviceId!: string;

  @StringFieldOptional({ nullable: true })
  firmwareId?: string | null;

  @StringFieldOptional({ nullable: true })
  fromVersion?: string | null;

  @StringField()
  toVersion!: string;

  @EnumField(() => DeviceOtaStatus)
  status!: DeviceOtaStatus;

  @NumberFieldOptional({ nullable: true, int: true })
  progress?: number | null;

  @StringFieldOptional({ nullable: true })
  error?: string | null;

  @DateFieldOptional({ nullable: true })
  requestedAt?: Date | null;

  @DateFieldOptional({ nullable: true })
  startedAt?: Date | null;

  @DateFieldOptional({ nullable: true })
  completedAt?: Date | null;

  constructor(entity: DeviceOtaUpdateEntity) {
    super(entity);
    this.deviceId = entity.deviceId;
    this.firmwareId = entity.firmwareId;
    this.fromVersion = entity.fromVersion;
    this.toVersion = entity.toVersion;
    this.status = entity.status as DeviceOtaStatus;
    this.progress = entity.progress;
    this.error = entity.error;
    this.requestedAt = entity.requestedAt;
    this.startedAt = entity.startedAt;
    this.completedAt = entity.completedAt;
  }
}

/**
 * Response for the device-facing `GET devices/:deviceId/ota/manifest` (see `DeviceProvisioningController`)
 * — a pull-based counterpart to the dashboard's push-based `POST .../ota`: a device/gateway can poll
 * this on its own boot/interval cycle to check for an update instead of waiting on a cloud-initiated
 * push. `fileUrl`/`checksum`/`sizeBytes`/`releaseNotes` are only populated when `updateAvailable` is true.
 */
export class OtaManifestDto {
  deviceId!: string;
  currentVersion!: string | null;
  updateAvailable!: boolean;
  latestVersion!: string | null;
  fileUrl!: string | null;
  checksum!: string | null;
  sizeBytes!: number | null;
  releaseNotes!: string | null;
}
