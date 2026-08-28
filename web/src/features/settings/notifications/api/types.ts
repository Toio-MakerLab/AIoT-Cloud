export type NotificationChannel = 'ZALO' | 'WEB_PUSH';

export const NOTIFICATION_CHANNELS: {
  value: NotificationChannel;
  label: string;
  description: string;
}[] = [
  {
    value: 'ZALO',
    label: 'Zalo',
    description: 'Receive device warnings in a Zalo bot chat.',
  },
  {
    value: 'WEB_PUSH',
    label: 'Web Push',
    description: 'Receive device warnings as a browser push notification.',
  },
];

export interface INotificationConfig {
  id: string;
  channel: NotificationChannel;
  isEnabled: boolean;
  messageTemplate: string | null;
  isLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUpsertNotificationConfig {
  messageTemplate?: string | null;
  isEnabled?: boolean;
}

export interface IZaloLinkCode {
  code: string;
  shareUrl: string | null;
}
