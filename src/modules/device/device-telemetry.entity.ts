import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DeviceEntity } from './device.entity.ts';
import { DeviceTelemetryDto } from './dtos/device-telemetry.dto.ts';

@Entity({ name: 'device_telemetry' })
@UseDto(DeviceTelemetryDto)
export class DeviceTelemetryEntity extends AbstractEntity<DeviceTelemetryDto> {
  @Index()
  @Column({ type: 'varchar' })
  deviceId!: string;

  @ManyToOne(() => DeviceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device?: DeviceEntity;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Index()
  @Column({ type: 'timestamp' })
  recordedAt!: Date;
}
