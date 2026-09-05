import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from './api';
import type { IDevicesQuery, IRegisterDevice, ITriggerDeviceAction, ITriggerOtaUpdate, IUpdateDeviceConfig, IUpdateDeviceLifecycle } from './types';

export const DEVICES_QUERY_KEY = 'devices';
export const DEVICE_TEMPLATES_QUERY_KEY = 'device-templates';
export const DEVICE_TELEMETRY_QUERY_KEY = 'device-telemetry';
export const UNCLAIMED_DEVICES_QUERY_KEY = 'unclaimed-devices';
export const DEVICE_LIFECYCLE_QUERY_KEY = 'device-lifecycle';
export const DEVICE_OTA_STATUS_QUERY_KEY = 'device-ota-status';
export const DEVICE_OTA_HISTORY_QUERY_KEY = 'device-ota-history';
export const DEVICE_FIRMWARES_QUERY_KEY = 'device-firmwares';

// Devices are swept to OFFLINE server-side every 10s once idle past the 1-minute
// threshold; poll at the same cadence so the online/offline badge stays current.
const DEVICE_STATUS_POLL_INTERVAL_MS = 10_000;

// Polled a bit faster than the plain device-status sweep so a DOWNLOADING/INSTALLING progress
// bar visibly moves without needing the websocket `otaStatus` event to be wired up everywhere yet.
const OTA_STATUS_POLL_INTERVAL_MS = 5_000;

export const useDevicesQuery = (query: IDevicesQuery = {}) =>
  useQuery({
    queryKey: [DEVICES_QUERY_KEY, query],
    queryFn: () => devicesApi.getDevices(query),
    refetchInterval: DEVICE_STATUS_POLL_INTERVAL_MS,
  });

export const useDeviceQuery = (id: string) =>
  useQuery({
    queryKey: [DEVICES_QUERY_KEY, id],
    queryFn: () => devicesApi.getDeviceById(id),
    enabled: !!id,
    refetchInterval: DEVICE_STATUS_POLL_INTERVAL_MS,
  });

export const useDeviceTelemetryQuery = (id: string, range: { limit?: number; from?: Date; to?: Date } = {}) =>
  useQuery({
    // ISO strings (not the Date objects themselves) in the key so equal instants compare equal
    // instead of busting the cache every render.
    queryKey: [DEVICE_TELEMETRY_QUERY_KEY, id, range.limit, range.from?.toISOString(), range.to?.toISOString()],
    queryFn: () => devicesApi.getDeviceTelemetry(id, range),
    enabled: !!id,
  });

export const useDeviceTemplatesQuery = () =>
  useQuery({
    queryKey: [DEVICE_TEMPLATES_QUERY_KEY],
    queryFn: () => devicesApi.getDeviceTemplates(),
  });

export const useUnclaimedDevicesQuery = () =>
  useQuery({
    queryKey: [UNCLAIMED_DEVICES_QUERY_KEY],
    queryFn: () => devicesApi.getUnclaimedDevices(),
    refetchInterval: DEVICE_STATUS_POLL_INTERVAL_MS,
  });

export const useRegisterDeviceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IRegisterDevice) => devicesApi.registerDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [UNCLAIMED_DEVICES_QUERY_KEY],
      });
    },
  });
};

export const useDeleteDeviceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.deleteDevice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] }),
  });
};

export const useUpdateDeviceConfigMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateDeviceConfig }) => devicesApi.updateDeviceConfig(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY] }),
  });
};

export const useTriggerDeviceActionMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ITriggerDeviceAction) => devicesApi.triggerDeviceAction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICES_QUERY_KEY, id] }),
  });
};

export const usePushConfigSyncMutation = (id: string) => useMutation({ mutationFn: () => devicesApi.pushConfigSync(id) });

/** Not polled — only refetched on mount/invalidation, since assessment only changes meaningfully day to day. */
export const useDeviceLifecycleQuery = (id: string) =>
  useQuery({
    queryKey: [DEVICE_LIFECYCLE_QUERY_KEY, id],
    queryFn: () => devicesApi.getDeviceLifecycle(id),
    enabled: !!id,
  });

export const useUpdateDeviceLifecycleMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IUpdateDeviceLifecycle) => devicesApi.updateDeviceLifecycle(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICE_LIFECYCLE_QUERY_KEY, id] }),
  });
};

export const useDecommissionDeviceMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => devicesApi.decommissionDevice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICE_LIFECYCLE_QUERY_KEY, id] }),
  });
};

/** Polled while an update can plausibly be in flight; DeviceOtaPanel narrows the interval further based on the current status. */
export const useDeviceOtaStatusQuery = (id: string, options: { refetchInterval?: number } = {}) =>
  useQuery({
    queryKey: [DEVICE_OTA_STATUS_QUERY_KEY, id],
    queryFn: () => devicesApi.getDeviceOtaStatus(id),
    enabled: !!id,
    refetchInterval: options.refetchInterval ?? OTA_STATUS_POLL_INTERVAL_MS,
  });

export const useDeviceOtaHistoryQuery = (id: string) =>
  useQuery({
    queryKey: [DEVICE_OTA_HISTORY_QUERY_KEY, id],
    queryFn: () => devicesApi.getDeviceOtaHistory(id),
    enabled: !!id,
  });

export const useFirmwaresForTemplateQuery = (templateId?: string) =>
  useQuery({
    queryKey: [DEVICE_FIRMWARES_QUERY_KEY, templateId],
    queryFn: () => devicesApi.getFirmwaresForTemplate(templateId as string),
    enabled: !!templateId,
  });

export const useTriggerOtaUpdateMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ITriggerOtaUpdate) => devicesApi.triggerOtaUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEVICE_OTA_STATUS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [DEVICE_OTA_HISTORY_QUERY_KEY, id] });
    },
  });
};
