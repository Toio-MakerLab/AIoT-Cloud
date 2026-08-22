import type { Response } from "@/core/types";
import apiClient from "@/lib/api-client";
import type { IAccountMenuData } from "./types";

export const accountApi = {
	getMenu: async () => {
		const response =
			await apiClient.get<Response<IAccountMenuData>>("/v1/account/menu");
		return response.data;
	},
};
