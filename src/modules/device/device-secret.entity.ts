import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DeviceSecretDto } from './dtos/device-secret.dto.ts';

/** Shared secrets accepted on the `x-device-secret` header — any non-revoked row is valid, so several can be active at once for rotation. */
@Entity({ name: 'device_secrets' })
@UseDto(DeviceSecretDto)
export class DeviceSecretEntity extends AbstractEntity<DeviceSecretDto> {
  @Column({ type: 'varchar', nullable: true })
  label!: string | null;

  /** SHA-256 hex digest; the plaintext is only ever returned once, at creation. */
  @Column({ type: 'varchar', unique: true })
  secretHash!: string;

  @Column({ type: 'varchar' })
  createdByUserId!: string;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt!: Date | null;
}
