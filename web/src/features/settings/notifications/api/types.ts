export type NotificationChannel = 'ZALO' | 'WEB_PUSH';

// Labels come from the `settings` i18n namespace, so callers build the channel list via
// `getNotificationChannels(t)` instead of importing a static array.
export function getNotificationChannels(t: (key: string) => string): {
  value: NotificationChannel;
  label: string;
  description: string;
}[] {
  return [
    {
      value: 'ZALO',
      label: 'Zalo',
      description: t('notifications.form.zaloDescription'),
    },
    {
      value: 'WEB_PUSH',
      label: t('notifications.form.webPushLabel'),
      description: t('notifications.form.webPushDescription'),
    },
  ];
}

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
