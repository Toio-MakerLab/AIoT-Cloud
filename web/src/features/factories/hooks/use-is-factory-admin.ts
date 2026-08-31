import { RoleType } from '@/constants/role-type';
import { useAuthStore } from '@/stores/authStore';

// The factories module is admin/root-only end to end on the backend, reads
// included (see factory.controller.ts @Auth decorators) — gate directly on
// role, same shape as `useIsDeviceTemplateAdmin`.
export function useIsFactoryAdmin(): boolean {
  const role = useAuthStore((state) => state.auth.user?.role);
  return role === RoleType.ADMIN || role === RoleType.ROOT;
}
