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

/** Minimal shape of the templates this feature consumes (device-templates feature owns the full DTO). */
export interface IDeviceTemplateSummary {
	id: string;
	name: string;
	type: DeviceTemplateType;
	description?: string | null;
	manufacturer?: string | null;
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
	createdAt: string;
	updatedAt: string;
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
