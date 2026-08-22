import type { Response } from "@/core/types";
import apiClient from "@/lib/api-client";
import type { AuthUser, LoginInput, LoginResponse } from "./types";

export type { AuthUser } from "./types";

export const authApi = {
	login: async (data: LoginInput) => {
		data.password = data.password!;
		const response = await apiClient.post<Response<LoginResponse>>(
			"/v1/auth/login",
			data,
		);
		return response.data;
	},

	// Get current user info
	me: async () => {
		const response = await apiClient.get<Response<AuthUser>>("/v1/me");
		return response.data;
	},

	// Logout user
	logout: async () => {
		const response = await apiClient.post<Response<null>>("/auth/logout");
		return response.data;
	},
};
