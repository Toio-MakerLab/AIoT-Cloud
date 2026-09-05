import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deviceTemplatesApi } from './api';
import type { ICreateDeviceTemplate, ICreateFirmware, IDeviceTemplatesQueryParams, IUpdateDeviceTemplate, IUpdateFirmware } from './types';

export const DEVICE_TEMPLATES_QUERY_KEY = 'device-templates';
export const FIRMWARES_QUERY_KEY = 'firmwares';

export const useDeviceTemplatesQuery = (params?: IDeviceTemplatesQueryParams) =>
  useQuery({
    queryKey: [DEVICE_TEMPLATES_QUERY_KEY, params],
    queryFn: () => deviceTemplatesApi.getDeviceTemplates(params),
  });

export const useDeviceTemplateQuery = (id: string) =>
  useQuery({
    queryKey: [DEVICE_TEMPLATES_QUERY_KEY, id],
    queryFn: () => deviceTemplatesApi.getDeviceTemplateById(id),
    enabled: !!id,
  });

export const useCreateDeviceTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateDeviceTemplate) => deviceTemplatesApi.createDeviceTemplate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICE_TEMPLATES_QUERY_KEY] }),
  });
};

export const useUpdateDeviceTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateDeviceTemplate }) => deviceTemplatesApi.updateDeviceTemplate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICE_TEMPLATES_QUERY_KEY] }),
  });
};

export const useDeleteDeviceTemplateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deviceTemplatesApi.deleteDeviceTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICE_TEMPLATES_QUERY_KEY] }),
  });
};

export const useFirmwaresQuery = (templateId: string) =>
  useQuery({
    queryKey: [FIRMWARES_QUERY_KEY, templateId],
    queryFn: () => deviceTemplatesApi.getFirmwares(templateId),
    enabled: !!templateId,
  });

export const useCreateFirmwareMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateFirmware) => deviceTemplatesApi.createFirmware(data),
    onSuccess: (firmware) => queryClient.invalidateQueries({ queryKey: [FIRMWARES_QUERY_KEY, firmware.templateId] }),
  });
};

export const useUploadFirmwareMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, version, file, releaseNotes }: { templateId: string; version: string; file: File; releaseNotes?: string }) =>
      deviceTemplatesApi.uploadFirmware(templateId, version, file, releaseNotes),
    onSuccess: (firmware) => queryClient.invalidateQueries({ queryKey: [FIRMWARES_QUERY_KEY, firmware.templateId] }),
  });
};

export const useUpdateFirmwareMutation = (templateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateFirmware }) => deviceTemplatesApi.updateFirmware(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FIRMWARES_QUERY_KEY, templateId] }),
  });
};

export const useDeleteFirmwareMutation = (templateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deviceTemplatesApi.deleteFirmware(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FIRMWARES_QUERY_KEY, templateId] }),
  });
};
