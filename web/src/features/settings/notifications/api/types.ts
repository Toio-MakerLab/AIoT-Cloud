export type NotificationChannel = 'ZALO';

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
