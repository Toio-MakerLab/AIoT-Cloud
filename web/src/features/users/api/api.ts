import type { Response } from "@/core/types"
import apiClient from "@/lib/api-client"
import type {
  IAssignUserRole,
  ICreateUser,
  IInviteUser,
  IRevokeUserRole,
  IUpdateUser,
  IUser,
} from "./types"

export const usersApi = {
  getUsers: async () => {
    const response = await apiClient.get<Response<IUser[]>>("/v1/account")
    return response.data
  },
  getUserById: async (userId: string) => {
    const response = await apiClient.get<Response<IUser>>(`/v1/account/${userId}`)
    return response.data
  },
  createUser: async (data: ICreateUser) => {
    const response = await apiClient.post<Response<IUser>>("/v1/account", data)
    return response.data
  },
  updateUser: async (userId: string, data: IUpdateUser) => {
    const response = await apiClient.put<Response<IUser>>(`/v1/account/${userId}`, data)
    return response.data
  },
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete<Response<void>>(`/v1/account/${userId}`)
    return response.data
  },
  inviteUser: async (data: IInviteUser) => {
    const response = await apiClient.post<Response<void>>("/v1/account/invite", data)
    return response.data
  },
  getUserRoles: async (userId: string) => {
    const response = await apiClient.get<Response<string[]>>(
      `/v1/permissions/${userId}/roles`
    )
    return response.data
  },
  assignRole: async (data: IAssignUserRole) => {
    const response = await apiClient.post<Response<void>>(
      "/v1/permissions/assign-role",
      data
    )
    return response.data
  },
  revokeRole: async (data: IRevokeUserRole) => {
    const response = await apiClient.post<Response<void>>(
      "/v1/permissions/revoke-role",
      data
    )
    return response.data
  },
}
