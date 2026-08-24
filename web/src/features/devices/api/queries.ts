import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { devicesApi } from "./api";
import type {
	IDevicesQuery,
	IRegisterDevice,
	ITriggerDeviceAction,
	IUpdateDeviceConfig,
} from "./types";

export const DEVICES_QUERY_KEY = "devices";
export const DEVICE_TEMPLATES_QUERY_KEY = "device-templates";
export const DEVICE_TELEMETRY_QUERY_KEY = "device-telemetry";

export const useDevicesQuery = (query: IDevicesQuery = {}) =>
	useQuery({
		queryKey: [DEVICES_QUERY_KEY, query],
		queryFn: () => devicesApi.getDevices(query),
	});

export const useDeviceQuery = (id: string) =>
	useQuery({
		queryKey: [DEVICES_QUERY_KEY, id],
		queryFn: () => devicesApi.getDeviceById(id),
		enabled: !!id,
	});

export const useDeviceTelemetryQuery = (id: string, limit = 100) =>
	useQuery({
		queryKey: [DEVICE_TELEMETRY_QUERY_KEY, id, limit],
		queryFn: () => devicesApi.getDeviceTelemetry(id, limit),
		enabled: !!id,
	});

export const useDeviceTemplatesQuery = () =>
	useQuery({
		queryKey: [DEVICE_TEMPLATES_QUERY_KEY],
		queryFn: () => devicesApi.getDeviceTemplates(),
	});

export const useRegisterDeviceMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: IRegisterDevice) => devicesApi.registerDevice(data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] }),
	});
};

export const useDeleteDeviceMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => devicesApi.deleteDevice(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] }),
	});
};

export const useUpdateDeviceConfigMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: IUpdateDeviceConfig }) =>
			devicesApi.updateDeviceConfig(id, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] }),
	});
};

export const useTriggerDeviceActionMutation = (id: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: ITriggerDeviceAction) =>
			devicesApi.triggerDeviceAction(id, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY, id] }),
	});
};

export const useRegenerateDeviceSecretMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => devicesApi.regenerateDeviceSecret(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] }),
	});
};
