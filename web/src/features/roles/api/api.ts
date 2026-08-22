import type { Response } from "@/core/types";
import apiClient from "@/lib/api-client";
import type { IRole, IRolePermissions, IUpdateRolePermissions } from "./types";

export const rolesApi = {
	getRoles: async () => {
		const response =
			await apiClient.get<Response<IRole[]>>("/v1/account/roles");
		return response.data;
	},
	getRolePermissions: async (role: string) => {
		const response = await apiClient.get<Response<IRolePermissions>>(
			`/v1/account/roles/${role}/permissions`,
		);
		return response.data;
	},
	updateRolePermissions: async (role: string, data: IUpdateRolePermissions) => {
		const response = await apiClient.put<Response<IRolePermissions>>(
			`/v1/account/roles/${role}/permissions`,
			data,
		);
		return response.data;
	},
};
