import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { profileApi } from './profile-api';
import type { IUpdateProfile } from './types';

export const PROFILE_QUERY_KEY = ['profile', 'me'] as const;

export const useProfileQuery = () => {
  const accessToken = useAuthStore((state) => state.auth.accessToken);

  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileApi.getMe,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IUpdateProfile) => profileApi.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
  });
};

export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileApi.deleteMe(),
    onSuccess: () => queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY }),
  });
};
