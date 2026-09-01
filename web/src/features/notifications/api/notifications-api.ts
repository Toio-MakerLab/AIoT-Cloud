import type { Response } from '@/core/types';
import apiClient from '@/lib/api-client';
import type { INotificationMessage, INotificationMessagesQuery, IPageResponse } from './types';

export const notificationsApi = {
  /** GET /api/notifications/messages — the caller's own notification inbox, newest first. */
  getMessages: async (query: INotificationMessagesQuery = {}) => {
    const response = await apiClient.get<IPageResponse<INotificationMessage>>('/notifications/messages', {
      params: query,
    });
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await apiClient.get<Response<{ count: number }>>('/notifications/messages/unread-count');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await apiClient.patch<Response<INotificationMessage>>(`/notifications/messages/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await apiClient.patch<Response<null>>('/notifications/messages/read-all');
    return response.data;
  },
  deleteMessage: async (id: string) => {
    const response = await apiClient.delete<Response<null>>(`/notifications/messages/${id}`);
    return response.data;
  },
};
