import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { DevicePushChannel } from '../../constants/device-push-channel.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { UserEntity } from '../user/user.entity.ts';
import { DeviceDto } from './dtos/device.dto.ts';
import type { DeviceNetworkConfig, DeviceWarningOverrides } from './interfaces/device-network-config.interface.ts';

@Entity({ name: 'devices' })
@UseDto(DeviceDto)
export class DeviceEntity extends AbstractEntity<DeviceDto> {
  /** Physical/QR identifier printed on the device — distinct from `id`, and what MQTT topics + websocket rooms key on. */
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  deviceId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  templateId!: string;

  @ManyToOne(() => DeviceTemplateEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'template_id' })
  template?: DeviceTemplateEntity;

  @Index()
  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ nullable: true, type: 'timestamp' })
  lastSeenAt!: Date | null;

  @Column({ nullable: true, type: 'jsonb' })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: DevicePushChannel, default: DevicePushChannel.MQTT })
  pushChannel!: DevicePushChannel;

  @Column({ nullable: true, type: 'jsonb' })
  config!: DeviceNetworkConfig | null;

  @Column({ type: 'int', default: 1 })
  configVersion!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /** Per-field overrides of the template's default warning band; keyed by telemetry field key. */
  @Column({ nullable: true, type: 'jsonb' })
  warningOverrides!: DeviceWarningOverrides | null;
}
