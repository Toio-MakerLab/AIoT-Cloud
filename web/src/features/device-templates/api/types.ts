export const DEVICE_TEMPLATE_TYPES = [
	"SENSOR_NODE",
	"RELAY_NODE",
	"GATEWAY",
	"OTHER",
] as const;

export type DeviceTemplateTypeValue = (typeof DEVICE_TEMPLATE_TYPES)[number];

export interface ITelemetryFieldDefinition {
	key: string;
	label: string;
	unit?: string;
}

export interface IDeviceTemplate {
	id: string;
	name: string;
	type: DeviceTemplateTypeValue;
	description?: string | null;
	manufacturer?: string | null;
	telemetrySchema?: ITelemetryFieldDefinition[] | null;
	icon?: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ICreateDeviceTemplate {
	name: string;
	type: DeviceTemplateTypeValue;
	description?: string;
	manufacturer?: string;
	telemetrySchema?: ITelemetryFieldDefinition[];
	icon?: string;
	isActive?: boolean;
}

export type IUpdateDeviceTemplate = Partial<ICreateDeviceTemplate>;

export interface IDeviceTemplatesQueryParams {
	page?: number;
	take?: number;
	order?: "ASC" | "DESC";
	q?: string;
}

// Mirrors backend `ResponseCore<T>` (src/common/dto/response-core.dto.ts):
// { error: ErrorCode, data: T | null, message: string }. Unlike the legacy
// backend the `users` feature talks to, business failures on this API come
// back as HTTP 200 with a non-zero `error` code, so callers must check it.
export interface IResponseCore<T> {
	error: number;
	data: T | null;
	message: string;
}

export const SUCCESS_CODE = 0;

export interface IPageMeta {
	page: number;
	take: number;
	itemCount: number;
	pageCount: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}

export interface IPageDto<T> {
	data: T[];
	meta: IPageMeta;
}
