import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { factoriesApi } from './api';
import type { ICreateFactory, IFactoriesQueryParams, IUpdateFactory } from './types';

export const FACTORIES_QUERY_KEY = 'factories';
export const MY_FACTORY_QUERY_KEY = 'factories-mine';

export const useFactoriesQuery = (params?: IFactoriesQueryParams) =>
  useQuery({
    queryKey: [FACTORIES_QUERY_KEY, params],
    queryFn: () => factoriesApi.getFactories(params),
  });

export const useFactoryQuery = (id: string) =>
  useQuery({
    queryKey: [FACTORIES_QUERY_KEY, id],
    queryFn: () => factoriesApi.getFactoryById(id),
    enabled: !!id,
  });

// USER/ADMIN/ROOT only (see `GET /factories/mine` on the backend) — GUEST
// accounts aren't tied to a factory, so this is disabled for them.
export const useMyFactoryQuery = (enabled: boolean) =>
  useQuery({
    queryKey: [MY_FACTORY_QUERY_KEY],
    queryFn: () => factoriesApi.getMyFactory(),
    enabled,
  });

export const useCreateFactoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateFactory) => factoriesApi.createFactory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FACTORIES_QUERY_KEY] }),
  });
};

export const useUpdateFactoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateFactory }) => factoriesApi.updateFactory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FACTORIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_FACTORY_QUERY_KEY] });
    },
  });
};

export const useDeleteFactoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => factoriesApi.deleteFactory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FACTORIES_QUERY_KEY] }),
  });
};
