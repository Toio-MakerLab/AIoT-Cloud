import type { Response } from "@/core/types";
import { apiClient } from "@/lib/api-client";
import type {
	IDashboard,
	IDevice,
	IDeviceTelemetry,
	IPageDto,
	ISaveDashboard,
	ITriggerDeviceAction,
} from "./types";

export const dashboardApi = {
	// GET /api/dashboards returns a plain array (NOT wrapped in ResponseCore, NOT paginated).
	getDashboards: async (): Promise<IDashboard[]> => {
		const res = await apiClient.get<IDashboard[]>("/dashboards");
		return res.data;
	},

	getDashboard: async (id: string): Promise<IDashboard> => {
		const res = await apiClient.get<Response<IDashboard>>(`/dashboards/${id}`);
		return res.data.data;
	},

	createDashboard: async (data: ISaveDashboard): Promise<IDashboard> => {
		const res = await apiClient.post<Response<IDashboard>>("/dashboards", data);
		return res.data.data;
	},

	updateDashboard: async (
		id: string,
		data: ISaveDashboard,
	): Promise<IDashboard> => {
		const res = await apiClient.put<Response<IDashboard>>(
			`/dashboards/${id}`,
			data,
		);
		return res.data.data;
	},

	deleteDashboard: async (id: string): Promise<void> => {
		await apiClient.delete<Response<null>>(`/dashboards/${id}`);
	},
};

export const deviceApi = {
	getDevices: async (): Promise<IDevice[]> => {
		const res = await apiClient.get<IPageDto<IDevice>>("/devices", {
			params: { take: 100 },
		});
		return res.data.data;
	},

	getDeviceTelemetry: async (
		deviceId: string,
		limit = 100,
	): Promise<IDeviceTelemetry[]> => {
		const res = await apiClient.get<Response<IDeviceTelemetry[]>>(
			`/devices/${deviceId}/telemetry`,
			{ params: { limit } },
		);
		return res.data.data;
	},

	triggerDeviceAction: async (
		deviceId: string,
		data: ITriggerDeviceAction,
	): Promise<void> => {
		await apiClient.post<Response<unknown>>(
			`/devices/${deviceId}/actions`,
			data,
		);
	},
};
