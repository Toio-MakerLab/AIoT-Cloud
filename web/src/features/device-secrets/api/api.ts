import apiClient from '@/lib/api-client';
import type { ICreateDeviceSecret, ICreatedDeviceSecret, IDeviceSecret, IResponseCore } from './types';
import { SUCCESS_CODE } from './types';

function unwrap<T>(envelope: IResponseCore<T>): T {
  if (envelope.error !== SUCCESS_CODE) {
    throw new Error(envelope.message || 'Something went wrong!');
  }
  return envelope.data as T;
}

export const deviceSecretsApi = {
  getDeviceSecrets: async () => {
    const response = await apiClient.get<IResponseCore<IDeviceSecret[]>>('/device-secrets');
    return unwrap(response.data);
  },
  createDeviceSecret: async (data: ICreateDeviceSecret) => {
    const response = await apiClient.post<IResponseCore<ICreatedDeviceSecret>>('/device-secrets', data);
    return unwrap(response.data);
  },
  revokeDeviceSecret: async (id: string) => {
    const response = await apiClient.post<IResponseCore<IDeviceSecret>>(`/device-secrets/${id}/revoke`);
    return unwrap(response.data);
  },
};
