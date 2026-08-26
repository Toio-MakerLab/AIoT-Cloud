import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { NotificationChannelType } from '../../../constants/notification-channel-type.ts';
import { BooleanField, EnumField, StringFieldOptional } from '../../../decorators/field.decorators.ts';
import type { NotificationConfigEntity } from '../notification-config.entity.ts';

export class NotificationConfigDto extends AbstractDto {
  @EnumField(() => NotificationChannelType)
  channel!: NotificationChannelType;

  @BooleanField()
  isEnabled!: boolean;

  @StringFieldOptional({ nullable: true })
  messageTemplate?: string | null;

  /** Whether this channel has completed its linking flow (e.g. Zalo follow/OAuth) and can receive sends. */
  @BooleanField()
  isLinked!: boolean;

  constructor(entity: NotificationConfigEntity) {
    super(entity);
    this.channel = entity.channel;
    this.isEnabled = entity.isEnabled;
    this.messageTemplate = entity.messageTemplate;
    this.isLinked = Boolean(entity.config);
  }
}
