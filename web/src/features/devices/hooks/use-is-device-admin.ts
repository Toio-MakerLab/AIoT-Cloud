import { RoleType } from '@/constants/role-type';
import { useAuthStore } from '@/stores/authStore';

// Mutating device routes (register/delete/update-config/trigger-action) are
// ADMIN/ROOT only on the backend (see device.controller.ts @Auth
// decorators) — USER accounts get read-only access. Gate on role directly
// rather than useCanAccess/usePermissionsMap, which call a
// `GET /v1/account/menu` endpoint that doesn't exist for this backend —
// same shape as useIsDeviceTemplateAdmin.
export function useIsDeviceAdmin(): boolean {
  const role = useAuthStore((state) => state.auth.user?.role);
  return role === RoleType.ADMIN || role === RoleType.ROOT;
}
