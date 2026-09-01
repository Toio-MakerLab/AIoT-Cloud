import apiClient from '@/lib/api-client';
import type {
  IDevice,
  IDevicesQuery,
  IDeviceTelemetry,
  IDeviceTemplateSummary,
  IPageResponse,
  IPushConfigSyncResult,
  IRegisterDevice,
  IRegisterDeviceResult,
  IResponseCore,
  ITriggerDeviceAction,
  ITriggerDeviceActionResult,
  IUnclaimedDevice,
  IUpdateDeviceConfig,
} from './types';

export const devicesApi = {
  /** GET /api/devices — backend scopes the list to the caller's own devices. */
  getDevices: async (query: IDevicesQuery = {}) => {
    const response = await apiClient.get<IPageResponse<IDevice>>('/devices', {
      params: query,
    });
    return response.data;
  },
  getDeviceById: async (id: string) => {
    const response = await apiClient.get<IResponseCore<IDevice>>(`/devices/${id}`);
    return response.data;
  },
  registerDevice: async (data: IRegisterDevice) => {
    const response = await apiClient.post<IResponseCore<IRegisterDeviceResult>>('/devices/register', data);
    return response.data;
  },
  getUnclaimedDevices: async () => {
    const response = await apiClient.get<IResponseCore<IUnclaimedDevice[]>>('/devices/unclaimed');
    return response.data;
  },
  deleteDevice: async (id: string) => {
    const response = await apiClient.delete<IResponseCore<null>>(`/devices/${id}`);
    return response.data;
  },
  updateDeviceConfig: async (id: string, data: IUpdateDeviceConfig) => {
    const response = await apiClient.patch<IResponseCore<IDevice>>(`/devices/${id}/config`, data);
    return response.data;
  },
  /** Nudges the device to re-fetch its boot-config now, e.g. right after saving new gateway automation rules. */
  pushConfigSync: async (id: string) => {
    const response = await apiClient.post<IResponseCore<IPushConfigSyncResult>>(`/devices/${id}/config/push`);
    return response.data;
  },
  triggerDeviceAction: async (id: string, data: ITriggerDeviceAction) => {
    const response = await apiClient.post<IResponseCore<ITriggerDeviceActionResult>>(`/devices/${id}/actions`, data);
    return response.data;
  },
  /** Powers TelemetryHistoryPanel on the device detail page — not consumed on the list page. */
  getDeviceTelemetry: async (id: string, options: { limit?: number; from?: Date; to?: Date } = {}) => {
    const { limit = 100, from, to } = options;
    const response = await apiClient.get<IResponseCore<IDeviceTelemetry[]>>(`/devices/${id}/telemetry`, {
      params: { limit, from: from?.toISOString(), to: to?.toISOString() },
    });
    return response.data;
  },
  /**
   * Self-contained fetch for the "choose a template" step — deliberately not
   * imported from features/device-templates (features stay self-contained,
   * matching the features/users pattern of not cross-importing other features).
   */
  getDeviceTemplates: async (take = 100) => {
    const response = await apiClient.get<IPageResponse<IDeviceTemplateSummary>>('/device-templates', { params: { take } });
    return response.data;
  },
};
