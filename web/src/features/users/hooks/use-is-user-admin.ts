import { RoleType } from '@/constants/role-type';
import { useAuthStore } from '@/stores/authStore';

// User management endpoints (GET/POST/PATCH /users) are ADMIN/ROOT only on
// the backend (see user.controller.ts). Gate on role directly rather than
// useCanAccess/usePermissionsMap, which call a `GET /v1/account/menu`
// endpoint that doesn't exist for this backend — same shape as
// useIsDeviceTemplateAdmin.
export function useIsUserAdmin(): boolean {
  const role = useAuthStore((state) => state.auth.user?.role);
  return role === RoleType.ADMIN || role === RoleType.ROOT;
}
