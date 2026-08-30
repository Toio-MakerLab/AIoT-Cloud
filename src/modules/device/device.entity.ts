import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { DevicePushChannel } from '../../constants/device-push-channel.ts';
import { DeviceStatus } from '../../constants/device-status.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { DeviceTemplateEntity } from '../device-template/device-template.entity.ts';
import { UserEntity } from '../user/user.entity.ts';
import { DeviceDto } from './dtos/device.dto.ts';
import type {
  DeviceAlertRule,
  DeviceFailsafeConfig,
  DeviceNetworkConfig,
  DeviceOfflineAlertConfig,
  DeviceWarningOverrides,
} from './interfaces/device-network-config.interface.ts';

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

  /** Persisted online/offline state; set on telemetry/status-topic traffic and swept to OFFLINE by DeviceStatusScheduler. */
  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status!: DeviceStatus;

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

  /** Latest applied per-channel actuator state (e.g. `{ relay1: "OFF" }`), merged in from `devices.events` messages. */
  @Column({ nullable: true, type: 'json' })
  channelStates!: Record<string, string> | null;

  /** Notify-on-offline rule — mainly for GATEWAY devices, which have no telemetrySchema of their own to gate warnings on. */
  @Column({ nullable: true, type: 'jsonb' })
  offlineAlert!: DeviceOfflineAlertConfig | null;

  /** Local automation rules a gateway evaluates and acts on itself — shipped via boot-config and cached on-device. */
  @Column({ nullable: true, type: 'jsonb' })
  alertRules!: DeviceAlertRule[] | null;

  /** Safe state a gateway falls back to on its own when it loses the cloud. */
  @Column({ nullable: true, type: 'jsonb' })
  failsafe!: DeviceFailsafeConfig | null;
}
