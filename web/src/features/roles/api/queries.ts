import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from './api';
import type { IUpdateRolePermissions } from './types';

export const ROLES_QUERY_KEY = 'roles';
export const ROLE_PERMISSIONS_QUERY_KEY = 'role-permissions';

export const useRolesQuery = () =>
  useQuery({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: () => rolesApi.getRoles(),
  });

export const useRolePermissionsQuery = (role: string) =>
  useQuery({
    queryKey: [ROLE_PERMISSIONS_QUERY_KEY, role],
    queryFn: () => rolesApi.getRolePermissions(role),
    enabled: !!role,
  });

export const useUpdateRolePermissionsMutation = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IUpdateRolePermissions) => rolesApi.updateRolePermissions(role, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [ROLE_PERMISSIONS_QUERY_KEY, role],
      }),
  });
};
