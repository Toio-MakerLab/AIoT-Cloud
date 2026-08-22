import apiClient from "@/lib/api-client";
import type {
	IDevice,
	IDeviceTelemetry,
	IDeviceTemplateSummary,
	IDevicesQuery,
	IPageResponse,
	IRegisterDevice,
	IResponseCore,
} from "./types";

export const devicesApi = {
	/** GET /api/devices — backend scopes the list to the caller's own devices. */
	getDevices: async (query: IDevicesQuery = {}) => {
		const response = await apiClient.get<IPageResponse<IDevice>>(
			"/devices",
			{ params: query },
		);
		return response.data;
	},
	getDeviceById: async (id: string) => {
		const response = await apiClient.get<IResponseCore<IDevice>>(
			`/devices/${id}`,
		);
		return response.data;
	},
	registerDevice: async (data: IRegisterDevice) => {
		const response = await apiClient.post<IResponseCore<IDevice>>(
			"/devices/register",
			data,
		);
		return response.data;
	},
	deleteDevice: async (id: string) => {
		const response = await apiClient.delete<IResponseCore<null>>(
			`/devices/${id}`,
		);
		return response.data;
	},
	/** Wired up for reuse by the dashboard feature; not consumed on the list page. */
	getDeviceTelemetry: async (id: string, limit = 100) => {
		const response = await apiClient.get<IResponseCore<IDeviceTelemetry[]>>(
			`/devices/${id}/telemetry`,
			{ params: { limit } },
		);
		return response.data;
	},
	/**
	 * Self-contained fetch for the "choose a template" step — deliberately not
	 * imported from features/device-templates (features stay self-contained,
	 * matching the features/users pattern of not cross-importing other features).
	 */
	getDeviceTemplates: async (take = 100) => {
		const response = await apiClient.get<IPageResponse<IDeviceTemplateSummary>>(
			"/device-templates",
			{ params: { take } },
		);
		return response.data;
	},
};
