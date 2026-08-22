import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, deviceApi } from "./api";
import type { ISaveDashboard } from "./types";

export const DASHBOARDS_QUERY_KEY = "dashboards";
export const DEVICES_QUERY_KEY = "dashboard-devices";
export const DEVICE_TELEMETRY_QUERY_KEY = "dashboard-device-telemetry";

export const useDashboardsQuery = () =>
	useQuery({
		queryKey: [DASHBOARDS_QUERY_KEY],
		queryFn: () => dashboardApi.getDashboards(),
	});

export const useDashboardQuery = (id: string | undefined) =>
	useQuery({
		queryKey: [DASHBOARDS_QUERY_KEY, id],
		queryFn: () => dashboardApi.getDashboard(id as string),
		enabled: !!id,
	});

export const useCreateDashboardMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: ISaveDashboard) => dashboardApi.createDashboard(data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DASHBOARDS_QUERY_KEY] }),
	});
};

export const useUpdateDashboardMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ISaveDashboard }) =>
			dashboardApi.updateDashboard(id, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DASHBOARDS_QUERY_KEY] }),
	});
};

export const useDeleteDashboardMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => dashboardApi.deleteDashboard(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DASHBOARDS_QUERY_KEY] }),
	});
};

export const useDashboardDevicesQuery = () =>
	useQuery({
		queryKey: [DEVICES_QUERY_KEY],
		queryFn: () => deviceApi.getDevices(),
	});

export const useDeviceTelemetryHistoryQuery = (deviceId: string | undefined) =>
	useQuery({
		queryKey: [DEVICE_TELEMETRY_QUERY_KEY, deviceId],
		queryFn: () => deviceApi.getDeviceTelemetry(deviceId as string, 100),
		enabled: !!deviceId,
	});
