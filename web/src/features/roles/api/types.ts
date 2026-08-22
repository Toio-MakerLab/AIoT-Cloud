import type { Permission } from "@/features/account/api/types";

export interface IRole {
	name: string;
	description?: string;
}

export interface IRolePermissions {
	role: string;
	permissions: Permission[];
}

export interface IUpdateRolePermissions {
	permissions: Permission[];
}
