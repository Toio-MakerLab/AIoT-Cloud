// Mirrors backend enums/dtos verbatim — see:
// src/modules/notification/dtos/notification-message.dto.ts
// src/modules/notification/dtos/notification-messages-page-options.dto.ts
// src/constants/notification-message-status.ts

/** Minimal mirror of settings/notifications' NotificationChannel — this feature keeps its own copy per the existing "minimal shape" convention. */
export type NotificationChannel = 'ZALO' | 'WEB_PUSH';

export type NotificationMessageStatus = 'SENT' | 'FAILED';

/** One row per channel a warning was actually sent to — backs the header bell's notification inbox. */
export interface INotificationMessage {
  id: string;
  channel: NotificationChannel;
  message: string;
  status: NotificationMessageStatus;
  error?: string | null;
  /** Entity id of the device that triggered this warning, when known. */
  deviceId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationMessagesQuery {
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
  channel?: NotificationChannel;
  isRead?: boolean;
}

/** src/common/dto/page-meta.dto.ts */
export interface IPageMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** src/common/dto/page.dto.ts */
export interface IPageResponse<T> {
  data: T[];
  meta: IPageMeta;
}
