import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { notificationsApi } from './notifications-api';
import type { INotificationMessagesQuery } from './types';

const NOTIFICATION_MESSAGES_QUERY_KEY = 'notification-messages';
const UNREAD_NOTIFICATION_COUNT_QUERY_KEY = [NOTIFICATION_MESSAGES_QUERY_KEY, 'unread-count'];

// The header bell polls for new alerts on a short cadence; the popover's own message list is
// fetched lazily (only while open, see `enabled` below) so idle tabs stay cheap.
const UNREAD_COUNT_POLL_INTERVAL_MS = 30_000;

export function useUnreadNotificationCountQuery() {
  const accessToken = useAuthStore((state) => state.auth.accessToken);

  return useQuery({
    queryKey: UNREAD_NOTIFICATION_COUNT_QUERY_KEY,
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!accessToken,
    refetchInterval: UNREAD_COUNT_POLL_INTERVAL_MS,
  });
}

export function useNotificationMessagesQuery(query: INotificationMessagesQuery = {}, options?: { enabled?: boolean }) {
  const accessToken = useAuthStore((state) => state.auth.accessToken);

  return useQuery({
    queryKey: [NOTIFICATION_MESSAGES_QUERY_KEY, query],
    queryFn: () => notificationsApi.getMessages(query),
    enabled: !!accessToken && (options?.enabled ?? true),
  });
}

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATION_MESSAGES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATION_COUNT_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATION_MESSAGES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATION_COUNT_QUERY_KEY });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATION_MESSAGES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATION_COUNT_QUERY_KEY });
    },
  });
}
