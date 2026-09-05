import apiClient from '@/lib/api-client';
import type {
  ICreateDeviceTemplate,
  ICreateFirmware,
  IDeviceTemplate,
  IDeviceTemplatesQueryParams,
  IFirmware,
  IPageDto,
  IResponseCore,
  IUpdateDeviceTemplate,
  IUpdateFirmware,
} from './types';
import { SUCCESS_CODE } from './types';

// Unwraps a ResponseCore envelope, throwing so react-query treats a
// business-logic failure (HTTP 200 + non-zero `error`) the same as a
// rejected request. Callers surface `error.message` to the user.
function unwrap<T>(envelope: IResponseCore<T>): T {
  if (envelope.error !== SUCCESS_CODE) {
    throw new Error(envelope.message || 'Something went wrong!');
  }
  return envelope.data as T;
}

export const deviceTemplatesApi = {
  getDeviceTemplates: async (params?: IDeviceTemplatesQueryParams) => {
    const response = await apiClient.get<IPageDto<IDeviceTemplate>>('/device-templates', { params });
    return response.data;
  },
  getDeviceTemplateById: async (id: string) => {
    const response = await apiClient.get<IResponseCore<IDeviceTemplate>>(`/device-templates/${id}`);
    return unwrap(response.data);
  },
  createDeviceTemplate: async (data: ICreateDeviceTemplate) => {
    const response = await apiClient.post<IResponseCore<IDeviceTemplate>>('/device-templates', data);
    return unwrap(response.data);
  },
  updateDeviceTemplate: async (id: string, data: IUpdateDeviceTemplate) => {
    const response = await apiClient.put<IResponseCore<IDeviceTemplate>>(`/device-templates/${id}`, data);
    return unwrap(response.data);
  },
  deleteDeviceTemplate: async (id: string) => {
    const response = await apiClient.delete<IResponseCore<null>>(`/device-templates/${id}`);
    return unwrap(response.data);
  },
  getFirmwares: async (templateId: string) => {
    const response = await apiClient.get<IResponseCore<IFirmware[]>>('/firmwares', { params: { templateId } });
    return unwrap(response.data);
  },
  /** Registers a build already hosted elsewhere — see `uploadFirmware` for the multipart `.bin` upload variant. */
  createFirmware: async (data: ICreateFirmware) => {
    const response = await apiClient.post<IResponseCore<IFirmware>>('/firmwares', data);
    return unwrap(response.data);
  },
  uploadFirmware: async (templateId: string, version: string, file: File, releaseNotes?: string) => {
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('version', version);
    if (releaseNotes) formData.append('releaseNotes', releaseNotes);
    formData.append('file', file);

    const response = await apiClient.post<IResponseCore<IFirmware>>('/firmwares/upload', formData);
    return unwrap(response.data);
  },
  updateFirmware: async (id: string, data: IUpdateFirmware) => {
    const response = await apiClient.put<IResponseCore<IFirmware>>(`/firmwares/${id}`, data);
    return unwrap(response.data);
  },
  deleteFirmware: async (id: string) => {
    const response = await apiClient.delete<IResponseCore<null>>(`/firmwares/${id}`);
    return unwrap(response.data);
  },
};
