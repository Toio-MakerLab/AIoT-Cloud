import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { UnclaimedDeviceDto } from './dtos/unclaimed-device.dto.ts';

/** Devices seen publishing telemetry/status on MQTT topics but not yet registered by any user. */
@Entity({ name: 'unclaimed_devices' })
@UseDto(UnclaimedDeviceDto)
export class UnclaimedDeviceEntity extends AbstractEntity<UnclaimedDeviceDto> {
  @Column({ type: 'varchar', unique: true })
  deviceId!: string;

  @Column({ type: 'varchar' })
  lastTopic!: string;

  @Column({ type: 'text', nullable: true })
  lastPayload!: string | null;

  @Column({ type: 'timestamp' })
  lastSeenAt!: Date;

  /** Set when a user/admin dismisses this device (e.g. noise from another system sharing the broker); hides it from the default listing. */
  @Column({ nullable: true, type: 'timestamp' })
  ignoredAt!: Date | null;
}
