export type NotificationChannelType =
	| "email"
	| "sms"
	| "slack_bot"
	| "zalo_bot"
	| "push"
	| "webhook";

export const VERIFIABLE_NOTIFICATION_CHANNELS: NotificationChannelType[] = [
	"zalo_bot",
];

export const NOTIFICATION_CHANNELS: {
	value: NotificationChannelType;
	label: string;
	description: string;
}[] = [
	// {
	// 	value: "email",
	// 	label: "Email",
	// 	description: "Receive notifications at an email address.",
	// },
	// {
	// 	value: "sms",
	// 	label: "SMS",
	// 	description: "Receive notifications via text message.",
	// },
	// {
	// 	value: "slack_bot",
	// 	label: "Slack",
	// 	description: "Receive notifications from our Slack bot.",
	// },
	{
		value: "zalo_bot",
		label: "Zalo",
		description: "Receive notifications from our Zalo bot.",
	},
	// {
	// 	value: "push",
	// 	label: "Push",
	// 	description: "Receive push notifications on your devices.",
	// },
	// {
	// 	value: "webhook",
	// 	label: "Webhook",
	// 	description: "Receive notifications at a custom webhook URL.",
	// },
];

export interface INotificationChannel {
	channel: NotificationChannelType;
	enabled: boolean;
	token: string;
}

export interface INotificationSetting {
	id: string;
	userId: string;
	channels: INotificationChannel[];
	createdAt: string;
	updatedAt: string;
}

export interface IUpdateNotificationSetting {
	channels: INotificationChannel[];
}

export interface IChannelVerificationRequest {
	channel: NotificationChannelType;
}

export interface IChannelVerificationResponse {
	channel: NotificationChannelType;
	code: string;
	message: string;
	expiresAt: string;
}

export interface IChannelDeepLink {
	channel: NotificationChannelType;
	deepLink: string;
}
