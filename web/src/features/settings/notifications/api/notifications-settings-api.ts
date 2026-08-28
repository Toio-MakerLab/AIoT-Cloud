import type { Response } from '@/core/types';
import apiClient from '@/lib/api-client';
import type { INotificationConfig, IUpsertNotificationConfig, IZaloLinkCode, NotificationChannel } from './types';

export const notificationSettingsApi = {
  getConfigs: async () => {
    const response = await apiClient.get<Response<INotificationConfig[]>>('/notifications/config');
    return response.data;
  },
  upsertConfig: async (channel: NotificationChannel, data: IUpsertNotificationConfig) => {
    const response = await apiClient.patch<Response<INotificationConfig>>(`/notifications/config/${channel}`, data);
    return response.data;
  },
  getZaloLinkCode: async () => {
    const response = await apiClient.get<Response<IZaloLinkCode>>('/notifications/zalo/link-code');
    return response.data;
  },
  registerWebPushToken: async (token: string) => {
    const response = await apiClient.post<Response<INotificationConfig>>('/notifications/web-push/token', { token });
    return response.data;
  },
  unregisterWebPushToken: async (token: string) => {
    const response = await apiClient.delete<Response<INotificationConfig | null>>('/notifications/web-push/token', { data: { token } });
    return response.data;
  },
};
