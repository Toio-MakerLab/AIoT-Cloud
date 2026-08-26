import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { NotificationChannelType } from '../../constants/notification-channel-type.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { UserEntity } from '../user/user.entity.ts';
import { NotificationConfigDto } from './dtos/notification-config.dto.ts';
import type { NotificationChannelConfig } from './interfaces/notification-channel-config.interface.ts';

@Entity({ name: 'notification_configs' })
@Unique(['userId', 'channel'])
@UseDto(NotificationConfigDto)
export class NotificationConfigEntity extends AbstractEntity<NotificationConfigDto> {
  @Index()
  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'enum', enum: NotificationChannelType })
  channel!: NotificationChannelType;

  /** Channel-specific addressing, e.g. `{ userExtendId }` for Zalo — set by the linking webhook/callback. */
  @Column({ nullable: true, type: 'jsonb' })
  config!: NotificationChannelConfig | null;

  /** Text sent for a warning; supports `{{deviceName}}`, `{{field}}`, `{{value}}`, `{{min}}`, `{{max}}` placeholders. */
  @Column({ nullable: true, type: 'text' })
  messageTemplate!: string | null;

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean;
}
