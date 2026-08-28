/** Zalo Bot chat id this config sends to; captured off the linking webhook message. */
export interface ZaloChannelConfig {
  userExtendId: string;
}

/** FCM registration tokens (one per browser/device) this config sends web push notifications to. */
export interface WebPushChannelConfig {
  fcmTokens: string[];
}

export type NotificationChannelConfig = ZaloChannelConfig | WebPushChannelConfig;
