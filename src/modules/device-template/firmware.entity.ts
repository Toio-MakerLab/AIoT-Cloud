import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DeviceTemplateEntity } from './device-template.entity.ts';
import { FirmwareDto } from './dtos/firmware.dto.ts';

/**
 * A published firmware build for a specific device template — the catalog `DeviceOtaService`
 * picks from when a user triggers an update on one of that template's devices (see
 * `DeviceOtaService.triggerUpdate`). The binary itself is never stored/proxied by this backend —
 * `fileUrl` points at wherever it's actually hosted (S3/CDN/GitHub release/etc.), matching how
 * ESP32-style OTA works: the cloud only hands the device a URL + checksum, the device downloads
 * and flashes it directly.
 */
@Entity({ name: 'firmwares' })
@UseDto(FirmwareDto)
export class FirmwareEntity extends AbstractEntity<FirmwareDto> {
  @Index()
  @Column({ type: 'varchar' })
  templateId!: string;

  @ManyToOne(() => DeviceTemplateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template?: DeviceTemplateEntity;

  /** Free-form version string (e.g. "1.4.2") — compared to `DeviceEntity.firmwareVersion` only for display, never parsed/ordered. */
  @Column({ type: 'varchar' })
  version!: string;

  /** Where the device/gateway downloads the binary from — hosted externally, not by this backend. */
  @Column({ type: 'varchar' })
  fileUrl!: string;

  /** SHA-256 hex digest of the binary, for the device to verify after download; optional but strongly recommended. */
  @Column({ nullable: true, type: 'varchar' })
  checksum!: string | null;

  @Column({ nullable: true, type: 'int' })
  sizeBytes!: number | null;

  @Column({ nullable: true, type: 'varchar' })
  releaseNotes!: string | null;

  /** Only an active build can be targeted by `DeviceOtaService.triggerUpdate` — lets a bad build be pulled without deleting its history. */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Index()
  @Column({ type: 'varchar' })
  createdBy!: string;
}
