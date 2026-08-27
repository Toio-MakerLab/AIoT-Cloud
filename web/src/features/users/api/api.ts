import apiClient from "@/lib/api-client";
import type {
	ICreateUser,
	IPageDto,
	IResponseCore,
	IUpdateUser,
	IUser,
	IUsersQueryParams,
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

export const usersApi = {
	getUsers: async (params?: IUsersQueryParams) => {
		const response = await apiClient.get<IPageDto<IUser>>("/users", {
			params,
		});
		return response.data;
	},
	getUserById: async (id: string) => {
		const response = await apiClient.get<IResponseCore<IUser>>(`/users/${id}`);
		return unwrap(response.data);
	},
	createUser: async (data: ICreateUser) => {
		const response = await apiClient.post<IResponseCore<IUser>>("/users", data);
		return unwrap(response.data);
	},
	updateUser: async (id: string, data: IUpdateUser) => {
		const response = await apiClient.patch<IResponseCore<IUser>>(
			`/users/${id}`,
			data,
		);
		return unwrap(response.data);
	},
};
