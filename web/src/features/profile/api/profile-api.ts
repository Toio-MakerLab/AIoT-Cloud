import type { Response } from "@/core/types";
import apiClient from "@/lib/api-client";
import type { IProfile, IUpdateProfile } from "./types";

export const profileApi = {
	getMe: async () => {
		const response = await apiClient.get<Response<IProfile>>("/v1/account/me");
		return response.data;
	},
	updateMe: async (data: IUpdateProfile) => {
		const response = await apiClient.put<Response<IProfile>>(
			"/v1/account/me",
			data,
		);
		return response.data;
	},
	deleteMe: async () => {
		const response = await apiClient.delete<Response<void>>("/v1/account/me");
		return response.data;
	},
};
