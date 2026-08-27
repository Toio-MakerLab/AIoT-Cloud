// Mirrors backend enums/dtos verbatim — see:
// src/modules/device/dtos/device.dto.ts
// src/modules/device/dtos/register-device.dto.ts
// src/constants/device-status.ts
// src/constants/device-template-type.ts

export const DeviceStatus = {
	ONLINE: "ONLINE",
	OFFLINE: "OFFLINE",
} as const;
export type DeviceStatus = (typeof DeviceStatus)[keyof typeof DeviceStatus];

export const DeviceTemplateType = {
	SENSOR_NODE: "SENSOR_NODE",
	RELAY_NODE: "RELAY_NODE",
	GATEWAY: "GATEWAY",
	OTHER: "OTHER",
} as const;
export type DeviceTemplateType =
	(typeof DeviceTemplateType)[keyof typeof DeviceTemplateType];

export const DevicePushChannel = {
	MQTT: "MQTT",
	HTTP: "HTTP",
	KAFKA: "KAFKA",
} as const;
export type DevicePushChannel =
	(typeof DevicePushChannel)[keyof typeof DevicePushChannel];

export interface IMqttTopics {
	telemetry: string;
	command?: string | null;
	status?: string | null;
}

export interface IMqttConfig {
	broker: string;
	port: number;
	username?: string | null;
	password?: string | null;
	topics: IMqttTopics;
}

export interface IHttpPushConfig {
	url: string;
	headers?: Record<string, string> | null;
}

export interface IKafkaConfig {
	brokers: string;
	topic: string;
	clientId?: string | null;
}

export interface IDeviceNetworkConfig {
	apiEndpoint?: string | null;
	mqtt?: IMqttConfig | null;
	http?: IHttpPushConfig | null;
	kafka?: IKafkaConfig | null;
}

export interface IUpdateDeviceConfig {
	apiEndpoint?: string | null;
	pushChannel?: DevicePushChannel;
	mqtt?: IMqttConfig | null;
	http?: IHttpPushConfig | null;
	kafka?: IKafkaConfig | null;
	isActive?: boolean;
}

export const DeviceActionType = {
	TOGGLE: "TOGGLE",
	BUTTON: "BUTTON",
} as const;
export type DeviceActionType =
	(typeof DeviceActionType)[keyof typeof DeviceActionType];

export interface IDeviceActionFieldDefinition {
	key: string;
	label: string;
	type: DeviceActionType;
	onValue?: string | null;
	offValue?: string | null;
}

/** Minimal shape of the templates this feature consumes (device-templates feature owns the full DTO). */
export interface IDeviceTemplateSummary {
	id: string;
	name: string;
	type: DeviceTemplateType;
	description?: string | null;
	manufacturer?: string | null;
	actionSchema?: IDeviceActionFieldDefinition[] | null;
	icon?: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface IDevice {
	id: string;
	deviceId: string;
	name: string;
	templateId: string;
	template?: IDeviceTemplateSummary;
	userId: string;
	lastSeenAt?: string | null;
	status: DeviceStatus;
	pushChannel: DevicePushChannel;
	config?: IDeviceNetworkConfig | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface IRegisterDeviceResult {
	device: IDevice;
}

export interface IDeviceTelemetry {
	id: string;
	deviceId: string;
	payload: Record<string, unknown>;
	recordedAt: string;
	createdAt: string;
	updatedAt: string;
}

export interface IRegisterDevice {
	deviceId: string;
	templateId: string;
	name: string;
	isActive?: boolean;
}

export interface ITriggerDeviceAction {
	key: string;
	value: string;
}

export interface ITriggerDeviceActionResult {
	key: string;
	value: string;
	topic: string;
	publishedAt: string;
}

export interface IDevicesQuery {
	page?: number;
	take?: number;
	order?: "ASC" | "DESC";
	q?: string;
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

/** src/common/dto/response-core.dto.ts */
export interface IResponseCore<T> {
	error: number;
	data: T | null;
	message: string;
}
