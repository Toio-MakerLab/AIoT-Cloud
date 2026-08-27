import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deviceSecretsApi } from './api';
import type { ICreateDeviceSecret } from './types';

export const DEVICE_SECRETS_QUERY_KEY = 'device-secrets';

export const useDeviceSecretsQuery = () =>
  useQuery({
    queryKey: [DEVICE_SECRETS_QUERY_KEY],
    queryFn: () => deviceSecretsApi.getDeviceSecrets(),
  });

export const useCreateDeviceSecretMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateDeviceSecret) => deviceSecretsApi.createDeviceSecret(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICE_SECRETS_QUERY_KEY] }),
  });
};

export const useRevokeDeviceSecretMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deviceSecretsApi.revokeDeviceSecret(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [DEVICE_SECRETS_QUERY_KEY] }),
  });
};
