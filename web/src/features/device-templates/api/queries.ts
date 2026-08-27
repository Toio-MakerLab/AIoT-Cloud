import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deviceTemplatesApi } from './api';
import type { ICreateDeviceTemplate, IDeviceTemplatesQueryParams, IUpdateDeviceTemplate } from './types';

export const DEVICE_TEMPLATES_QUERY_KEY = 'device-templates';

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
