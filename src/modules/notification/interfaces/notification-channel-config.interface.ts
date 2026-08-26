/** Zalo Bot chat id this config sends to; captured off the linking webhook message. */
export interface ZaloChannelConfig {
  userExtendId: string;
}

export type NotificationChannelConfig = ZaloChannelConfig;
