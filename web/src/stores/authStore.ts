import Cookies from 'js-cookie';
import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/api/types';

// encoded key: 'shadcn-auth-token'
export const ACCESS_TOKEN = 'c2hhZGNuLWF1dGgtdG9rZW4=';
export const REFRESH_TOKEN = 'c2hhZ1231LWF1dGgtdG9rZW4=';

// The auth store isn't persisted, so `user` (and its `role`) is lost on every
// page reload even though the access token cookie survives. Decode the JWT's
// own claims to rehydrate a minimal user until a real profile fetch runs —
// same claims (`userId`, `role`) the backend's JwtStrategy trusts from the
// signature-verified token, so this is safe for client-side display/gating.
function decodeUserFromToken(token: string): AuthUser | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as { userId?: string; role?: string };
    if (!claims.userId) return null;

    return { id: claims.userId, role: claims.role };
  } catch {
    return null;
  }
}

interface AuthState {
  auth: {
    user: AuthUser | null;
    setUser: (user: AuthUser | null) => void;
    accessToken: string;
    setAccessToken: (accessToken: string) => void;
    setRefreshToken: (refreshToken: string) => void;
    resetAccessToken: () => void;
    reset: () => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    isAuthenticated: () => boolean;
  };
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = Cookies.get(ACCESS_TOKEN);
  const initToken = cookieState ? cookieState : '';
  return {
    auth: {
      user: initToken ? decodeUserFromToken(initToken) : null,
      setUser: (user) => set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          Cookies.set(ACCESS_TOKEN, accessToken);
          return { ...state, auth: { ...state.auth, accessToken } };
        }),
      setRefreshToken: (refreshToken) =>
        set((state) => {
          Cookies.set(REFRESH_TOKEN, refreshToken);
          return { ...state, auth: { ...state.auth, refreshToken } };
        }),
      resetAccessToken: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN);
          return { ...state, auth: { ...state.auth, accessToken: '' } };
        }),
      reset: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN);
          Cookies.remove(REFRESH_TOKEN);
          return {
            ...state,
            auth: {
              ...state.auth,
              user: null,
              accessToken: '',
              refreshToken: '',
            },
          };
        }),
      isLoading: false,
      setIsLoading: (isLoading) => set((state) => ({ ...state, auth: { ...state.auth, isLoading } })),
      isAuthenticated: () => {
        const token = get().auth.accessToken;
        return !!token && token.length > 0;
      },
    },
  };
});

// export const useAuth = () => useAuthStore((state) => state.auth)
