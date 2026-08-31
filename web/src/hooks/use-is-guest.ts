import { RoleType } from '@/constants/role-type';
import { useAuthStore } from '@/stores/authStore';

// GUEST is a read-only account tier: it can view its own devices and dashboards but must not be
// able to trigger any write action (register/edit/delete devices, trigger device actions, edit
// config, or create/edit/delete/rearrange dashboards). This hook is the single place UI gating
// for that restriction reads from — mirrors the useIsRoot/useIsUserAdmin pattern.
export function useIsGuest(): boolean {
  const role = useAuthStore((state) => state.auth.user?.role);
  return role === RoleType.GUEST;
}
