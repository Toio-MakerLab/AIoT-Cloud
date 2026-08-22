import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "./api";
import type { ICreateUser, IInviteUser, IUpdateUser } from "./types";

export const USERS_QUERY_KEY = "users";
export const USER_ROLES_QUERY_KEY = "user-roles";

export const useUsersQuery = () =>
	useQuery({
		queryKey: [USERS_QUERY_KEY],
		queryFn: () => usersApi.getUsers(),
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
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
	});
};

export const useUpdateUserMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: IUpdateUser }) =>
			usersApi.updateUser(id, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
	});
};

export const useDeleteUserMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => usersApi.deleteUser(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
	});
};

export const useInviteUserMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: IInviteUser) => usersApi.inviteUser(data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] }),
	});
};

export const useUserRolesQuery = (userId: string) =>
	useQuery({
		queryKey: [USER_ROLES_QUERY_KEY, userId],
		queryFn: () => usersApi.getUserRoles(userId),
		enabled: !!userId,
	});

export const useAssignUserRoleMutation = (userId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (role: string) => usersApi.assignRole({ userId, role }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: [USER_ROLES_QUERY_KEY, userId],
			}),
	});
};

export const useRevokeUserRoleMutation = (userId: string) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (role: string) => usersApi.revokeRole({ userId, role }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: [USER_ROLES_QUERY_KEY, userId],
			}),
	});
};
