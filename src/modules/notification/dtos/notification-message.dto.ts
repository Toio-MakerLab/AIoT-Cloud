import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { NotificationChannelType } from '../../../constants/notification-channel-type.ts';
import { NotificationMessageStatus } from '../../../constants/notification-message-status.ts';
import { BooleanField, DateFieldOptional, EnumField, StringField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { NotificationMessageEntity } from '../notification-message.entity.ts';

export class NotificationMessageDto extends AbstractDto {
  @EnumField(() => NotificationChannelType)
  channel!: NotificationChannelType;

  @StringField()
  message!: string;

  @EnumField(() => NotificationMessageStatus)
  status!: NotificationMessageStatus;

  /** Set when `status` is FAILED — the sender's error message, kept for troubleshooting. */
  @StringFieldOptional({ nullable: true })
  error?: string | null;

  /** Entity id of the device that triggered this warning, when known — lets the UI deep-link back to it. */
  @StringFieldOptional({ nullable: true })
  deviceId?: string | null;

  @BooleanField()
  isRead!: boolean;

  @DateFieldOptional({ nullable: true })
  readAt?: Date | null;

  constructor(entity: NotificationMessageEntity) {
    super(entity);
    this.channel = entity.channel;
    this.message = entity.message;
    this.status = entity.status;
    this.error = entity.error;
    this.deviceId = entity.deviceId;
    this.isRead = entity.isRead;
    this.readAt = entity.readAt;
  }
}
