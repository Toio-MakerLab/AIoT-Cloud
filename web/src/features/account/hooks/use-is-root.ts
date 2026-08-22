import { RoleType } from "@/constants/role-type";
import { useAuthStore } from "@/stores/authStore";

// The Roles & Permissions page manages every role's access, including its
// own gate — a non-root role could grant itself access via the permission
// matrix. Restricting it to the 'root' account sidesteps that and matches
// backend expectations (Casbin's root role is exempt from permission checks).
export function useIsRoot(): boolean {
	const role = useAuthStore((state) => state.auth.user?.role);
	return role === RoleType.ROOT;
}
