import type { Response } from "@/core/types";
import apiClient from "@/lib/api-client";
import { domainConfig } from "@/lib/domain-config";
import type {
	IChannelDeepLink,
	IChannelVerificationRequest,
	IChannelVerificationResponse,
	INotificationSetting,
	IUpdateNotificationSetting,
	NotificationChannelType,
} from "./types";

export const notificationSettingsApi = {
	get: async () => {
		const response = await apiClient.get<Response<INotificationSetting>>(
			"/v1/notifications/settings",
		);
		return response.data;
	},
	update: async (data: IUpdateNotificationSetting) => {
		const response = await apiClient.put<Response<INotificationSetting>>(
			"/v1/notifications/settings",
			data,
		);
		return response.data;
	},
	requestChannelVerification: async (data: IChannelVerificationRequest) => {
		const response = await apiClient.post<
			Response<IChannelVerificationResponse>
		>("/v1/notifications/settings/channels/verify", data);
		return response.data;
	},
	getChannelDeepLink: async (channel: NotificationChannelType) => {
		const response = await apiClient.get<Response<IChannelDeepLink>>(
			`/v1/notifications/settings/channels/${channel}/deeplink`,
		);
		return response.data;
	},
	unlinkChannel: async (channel: NotificationChannelType) => {
		const response = await apiClient.delete<Response<INotificationSetting>>(
			`/v1/notifications/settings/channels/${channel}`,
		);
		return response.data;
	},
};

// Public, unauthenticated redirect URL — safe to use as a plain <a href> so mobile web
// opens the channel's app directly instead of round-tripping through JSON first.
export function getChannelDeepLinkRedirectUrl(
	channel: NotificationChannelType,
): string {
	return `${domainConfig.VITE_API_URL}/v1/notifications/settings/channels/${channel}/deeplink/redirect`;
}
