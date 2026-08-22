import Cookies from "js-cookie";
import { create } from "zustand";
import type { AuthUser } from "@/features/auth/api/types";

// encoded key: 'shadcn-auth-token'
export const ACCESS_TOKEN = "c2hhZGNuLWF1dGgtdG9rZW4=";
export const REFRESH_TOKEN = "c2hhZ1231LWF1dGgtdG9rZW4=";

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
	const initToken = cookieState ? cookieState : "";
	return {
		auth: {
			user: null,
			setUser: (user) =>
				set((state) => ({ ...state, auth: { ...state.auth, user } })),
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
					return { ...state, auth: { ...state.auth, accessToken: "" } };
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
							accessToken: "",
							refreshToken: "",
						},
					};
				}),
			isLoading: false,
			setIsLoading: (isLoading) =>
				set((state) => ({ ...state, auth: { ...state.auth, isLoading } })),
			isAuthenticated: () => {
				const token = get().auth.accessToken;
				return !!token && token.length > 0;
			},
		},
	};
});

// export const useAuth = () => useAuthStore((state) => state.auth)
