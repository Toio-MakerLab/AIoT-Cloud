import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { FirmwareEntity } from '../device-template/firmware.entity.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceOtaUpdateDto } from './dtos/device-ota.dto.ts';

/**
 * One OTA update attempt on one device — the audit-trail counterpart of the cached `ota` fields
 * on `DeviceEntity` (which only ever reflect the current/most recent attempt), same relationship
 * as `DeviceTelemetryEntity` is to a device's live telemetry. Created by `DeviceOtaService.triggerUpdate`,
 * updated in place (never a new row) by `handleOtaStatusReport` as progress reports come in.
 */
@Entity({ name: 'device_ota_updates' })
@UseDto(DeviceOtaUpdateDto)
export class DeviceOtaUpdateEntity extends AbstractEntity<DeviceOtaUpdateDto> {
  @Index()
  @Column({ type: 'varchar' })
  deviceId!: string;

  @ManyToOne(() => DeviceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device?: DeviceEntity;

  /** `null` once the firmware row it targeted is deleted — the attempt's own record is kept regardless. */
  @Column({ nullable: true, type: 'varchar' })
  firmwareId!: string | null;

  @ManyToOne(() => FirmwareEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'firmware_id' })
  firmware?: FirmwareEntity | null;

  @Column({ nullable: true, type: 'varchar' })
  fromVersion!: string | null;

  @Column({ type: 'varchar' })
  toVersion!: string;

  /** Plain varchar, same reasoning as `DeviceEntity.otaStatus` — see DeviceOtaStatus. */
  @Column({ type: 'varchar' })
  status!: string;

  @Column({ nullable: true, type: 'int' })
  progress!: number | null;

  @Column({ nullable: true, type: 'varchar' })
  error!: string | null;

  @Column({ type: 'timestamp' })
  requestedAt!: Date;

  @Column({ nullable: true, type: 'timestamp' })
  startedAt!: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  completedAt!: Date | null;
}
