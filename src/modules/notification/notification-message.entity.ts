import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../common/abstract.entity.ts';
import { NotificationChannelType } from '../../constants/notification-channel-type.ts';
import { NotificationMessageStatus } from '../../constants/notification-message-status.ts';
import { UseDto } from '../../decorators/use-dto.decorator.ts';
import { UserEntity } from '../user/user.entity.ts';
import { NotificationMessageDto } from './dtos/notification-message.dto.ts';

/**
 * One row per channel a warning was actually fanned out to (see `NotificationService.sendWarning`)
 * — the persisted history behind a notification inbox/bell, independent of whether the underlying
 * `NotificationConfigEntity` is later edited, unlinked, or deleted.
 */
@Entity({ name: 'notification_messages' })
@UseDto(NotificationMessageDto)
export class NotificationMessageEntity extends AbstractEntity<NotificationMessageDto> {
  @Index()
  @Column({ type: 'varchar' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'enum', enum: NotificationChannelType })
  channel!: NotificationChannelType;

  /** The rendered text actually handed to the channel sender (after template substitution). */
  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'enum', enum: NotificationMessageStatus })
  status!: NotificationMessageStatus;

  /** Set when `status` is FAILED — the sender's error message, kept for troubleshooting. */
  @Column({ nullable: true, type: 'text' })
  error!: string | null;

  /** Entity id of the device that triggered this warning, when known — lets the UI deep-link back to it. */
  @Index()
  @Column({ nullable: true, type: 'varchar' })
  deviceId!: string | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  readAt!: Date | null;
}
