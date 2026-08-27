import { RoleType } from '@/constants/role-type';
import { useAuthStore } from '@/stores/authStore';

// Mutating device-template routes are ADMIN/ROOT only on the backend (see
// device-template.controller.ts). The task explicitly avoids
// useCanAccess/usePermissionsMap here since they call a `GET /v1/account/menu`
// endpoint that doesn't exist for this backend — gate on role directly
// instead, same shape as `useIsRoot` (see features/account/hooks/use-is-root.ts).
export function useIsDeviceTemplateAdmin(): boolean {
  const role = useAuthStore((state) => state.auth.user?.role);
  return role === RoleType.ADMIN || role === RoleType.ROOT;
}
