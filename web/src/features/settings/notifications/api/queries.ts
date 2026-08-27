import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { notificationSettingsApi } from './notifications-settings-api';
import type { IUpsertNotificationConfig, NotificationChannel } from './types';

const NOTIFICATION_CONFIGS_QUERY_KEY = ['notification-configs'];

export function useNotificationConfigsQuery(options?: { refetchInterval?: number | false }) {
  const accessToken = useAuthStore((state) => state.auth.accessToken);

  return useQuery({
    queryKey: NOTIFICATION_CONFIGS_QUERY_KEY,
    queryFn: () => notificationSettingsApi.getConfigs(),
    enabled: !!accessToken,
    staleTime: 60 * 1000,
    refetchInterval: options?.refetchInterval,
  });
}

export function useUpsertNotificationConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channel, data }: { channel: NotificationChannel; data: IUpsertNotificationConfig }) =>
      notificationSettingsApi.upsertConfig(channel, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_CONFIGS_QUERY_KEY,
      });
    },
  });
}

export function useZaloLinkCodeMutation() {
  return useMutation({
    mutationFn: () => notificationSettingsApi.getZaloLinkCode(),
  });
}
