import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { notificationSettingsApi } from "./notifications-settings-api";
import type {
	IChannelVerificationRequest,
	IUpdateNotificationSetting,
	NotificationChannelType,
} from "./types";

export const NOTIFICATION_SETTING_QUERY_KEY = [
	"notification-settings",
	"me",
] as const;

export const useNotificationSettingQuery = () => {
	const accessToken = useAuthStore((state) => state.auth.accessToken);

	return useQuery({
		queryKey: NOTIFICATION_SETTING_QUERY_KEY,
		queryFn: notificationSettingsApi.get,
		select: (res) => res.data,
		enabled: !!accessToken,
		staleTime: 60 * 1000,
	});
};

export const useUpdateNotificationSettingMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: IUpdateNotificationSetting) =>
			notificationSettingsApi.update(data),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: NOTIFICATION_SETTING_QUERY_KEY,
			}),
	});
};

export const useRequestChannelVerificationMutation = () => {
	return useMutation({
		mutationFn: (data: IChannelVerificationRequest) =>
			notificationSettingsApi.requestChannelVerification(data),
	});
};

export const useChannelDeepLinkQuery = (
	channel: NotificationChannelType,
	enabled: boolean,
) => {
	return useQuery({
		queryKey: [...NOTIFICATION_SETTING_QUERY_KEY, "deeplink", channel],
		queryFn: () => notificationSettingsApi.getChannelDeepLink(channel),
		select: (res) => res.data,
		enabled,
		staleTime: 5 * 60 * 1000,
	});
};

export const useUnlinkChannelMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (channel: NotificationChannelType) =>
			notificationSettingsApi.unlinkChannel(channel),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: NOTIFICATION_SETTING_QUERY_KEY,
			}),
	});
};
