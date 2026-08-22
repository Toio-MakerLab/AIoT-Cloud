import { usePermissionsMap } from "../api/queries";
import type { Permission } from "../api/types";

type Action = "read" | "create" | "update" | "delete";

const ACTION_FIELD: Record<Action, keyof Permission> = {
	read: "canRead",
	create: "canCreate",
	update: "canUpdate",
	delete: "canDelete",
};

// Deny-by-default while permissions are still loading/unauthenticated, since
// AppSidebar triggers the same cached `['account-menu']` query at layout
// mount and every consumer resolves together once that single fetch settles.
export function useCanAccess(
	resource: string,
	action: Action = "read",
): boolean {
	const permissions = usePermissionsMap();
	if (!permissions) return false;
	const permission = permissions[resource];
	return permission ? Boolean(permission[ACTION_FIELD[action]]) : false;
}
