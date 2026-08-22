import apiClient from "@/lib/api-client";
import type {
	ICreateDeviceTemplate,
	IDeviceTemplate,
	IDeviceTemplatesQueryParams,
	IPageDto,
	IResponseCore,
	IUpdateDeviceTemplate,
} from "./types";
import { SUCCESS_CODE } from "./types";

// Unwraps a ResponseCore envelope, throwing so react-query treats a
// business-logic failure (HTTP 200 + non-zero `error`) the same as a
// rejected request. Callers surface `error.message` to the user.
function unwrap<T>(envelope: IResponseCore<T>): T {
	if (envelope.error !== SUCCESS_CODE) {
		throw new Error(envelope.message || "Something went wrong!");
	}
	return envelope.data as T;
}

export const deviceTemplatesApi = {
	getDeviceTemplates: async (params?: IDeviceTemplatesQueryParams) => {
		const response = await apiClient.get<IPageDto<IDeviceTemplate>>(
			"/device-templates",
			{ params },
		);
		return response.data;
	},
	getDeviceTemplateById: async (id: string) => {
		const response = await apiClient.get<IResponseCore<IDeviceTemplate>>(
			`/device-templates/${id}`,
		);
		return unwrap(response.data);
	},
	createDeviceTemplate: async (data: ICreateDeviceTemplate) => {
		const response = await apiClient.post<IResponseCore<IDeviceTemplate>>(
			"/device-templates",
			data,
		);
		return unwrap(response.data);
	},
	updateDeviceTemplate: async (id: string, data: IUpdateDeviceTemplate) => {
		const response = await apiClient.put<IResponseCore<IDeviceTemplate>>(
			`/device-templates/${id}`,
			data,
		);
		return unwrap(response.data);
	},
	deleteDeviceTemplate: async (id: string) => {
		const response = await apiClient.delete<IResponseCore<null>>(
			`/device-templates/${id}`,
		);
		return unwrap(response.data);
	},
};
