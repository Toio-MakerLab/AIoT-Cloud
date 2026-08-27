import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';
import type { ICreateUser, IUpdateUser, IUsersQueryParams } from './types';

export const USERS_QUERY_KEY = 'users';

export const useUsersQuery = (params?: IUsersQueryParams) =>
  useQuery({
    queryKey: [USERS_QUERY_KEY, params],
    queryFn: () => usersApi.getUsers(params),
  });

export const useUserQuery = (id: string) =>
  useQuery({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id,
  });

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateUser) => usersApi.createUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateUser }) => usersApi.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
  });
};
