import type { UserRole } from './schema';

export function getUserRoles(t: (key: string) => string): { label: string; value: UserRole }[] {
  return [
    { label: t('roles.root'), value: 'ROOT' },
    { label: t('roles.admin'), value: 'ADMIN' },
    { label: t('roles.user'), value: 'USER' },
    { label: t('roles.guest'), value: 'GUEST' },
  ];
}

export const roleBadgeClasses = new Map<UserRole, string>([
  ['ROOT', 'bg-red-100/30 text-red-900 dark:text-red-200 border-red-200'],
  ['ADMIN', 'bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200'],
  ['USER', 'bg-neutral-300/40 border-neutral-300'],
  ['GUEST', 'bg-slate-100/40 text-slate-700 dark:text-slate-300 border-slate-200'],
]);

export function getUserRoleLabel(role: UserRole | undefined | null, t: (key: string) => string): string {
  return getUserRoles(t).find((r) => r.value === role)?.label ?? role ?? '-';
}
