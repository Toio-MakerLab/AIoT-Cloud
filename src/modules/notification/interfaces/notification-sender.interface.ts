import type { NotificationChannelType } from '../../../constants/notification-channel-type.ts';
import type { NotificationConfigEntity } from '../notification-config.entity.ts';

export interface NotificationSender {
  readonly channel: NotificationChannelType;
  send(config: NotificationConfigEntity, message: string): Promise<void>;
}

export const NOTIFICATION_SENDERS = Symbol('NOTIFICATION_SENDERS');
