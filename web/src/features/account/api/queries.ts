import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { accountApi } from "./account-menu-api";
import type { Permission } from "./types";
import { flattenPermissions } from "./utils";

export const ACCOUNT_MENU_QUERY_KEY = ["account-menu"] as const;

export const useAccountMenuQuery = () => {
	const accessToken = useAuthStore((state) => state.auth.accessToken);

	return useQuery({
		queryKey: ACCOUNT_MENU_QUERY_KEY,
		queryFn: accountApi.getMenu,
		select: (res) => res.data,
		enabled: !!accessToken,
		staleTime: 5 * 60 * 1000,
	});
};

export const usePermissionsMap = (): Record<string, Permission> | undefined => {
	const { data } = useAccountMenuQuery();
	return useMemo(
		() => (data ? flattenPermissions(data.navGroups) : undefined),
		[data],
	);
};
