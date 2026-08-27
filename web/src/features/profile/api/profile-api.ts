import type { Response } from '@/core/types';
import apiClient from '@/lib/api-client';
import type { IProfile, IUpdateProfile } from './types';

export const profileApi = {
  getMe: async () => {
    const response = await apiClient.get<IProfile>('/v1/auth/me');
    return response.data;
  },
  // NOTE: no backend endpoint exists yet for these — kept so the
  // (pre-existing, unrelated) settings/account dialogs still compile.
  updateMe: async (data: IUpdateProfile) => {
    const response = await apiClient.put<Response<IProfile>>('/v1/account/me', data);
    return response.data;
  },
  deleteMe: async () => {
    const response = await apiClient.delete<Response<void>>('/v1/account/me');
    return response.data;
  },
};
