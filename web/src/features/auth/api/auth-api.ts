import type { Response } from "@/core/types";
import apiClient from "@/lib/api-client";
import type {
	AuthUser,
	LoginInput,
	LoginResponse,
	RegisterInput,
	ResendVerificationInput,
	VerifyEmailInput,
} from "./types";

export type { AuthUser } from "./types";

export const authApi = {
	login: async (data: LoginInput) => {
		const response = await apiClient.post<Response<LoginResponse>>(
			"/auth/login",
			data,
		);
		return response.data;
	},

	register: async (data: RegisterInput) => {
		const response = await apiClient.post<Response<AuthUser>>(
			"/auth/register",
			data,
		);
		return response.data;
	},

	verifyEmail: async (data: VerifyEmailInput) => {
		const response = await apiClient.post<Response<null>>(
			"/auth/verify-email",
			data,
		);
		return response.data;
	},

	resendVerification: async (data: ResendVerificationInput) => {
		const response = await apiClient.post<Response<null>>(
			"/auth/resend-verification",
			data,
		);
		return response.data;
	},

	// Get current user info
	me: async () => {
		const response = await apiClient.get<AuthUser>("/v1/auth/me");
		return response.data;
	},
};
