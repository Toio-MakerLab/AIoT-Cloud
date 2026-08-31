import { FactorySwitcher } from '@/components/layout/factory-switcher';
import { NavGroup } from '@/components/layout/nav-group';
import type { NavGroup as NavGroupType, NavItem } from '@/components/layout/types';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { RoleType } from '@/constants/role-type';
import { useIsRoot } from '@/features/account/hooks/use-is-root';
import { useAuthStore } from '@/stores/authStore';
import { sidebarData } from './data/sidebar-data';

// The Roles & Permissions page is root-only (see useIsRoot), so hide its
// static sidebar entry for everyone else instead of letting them click
// into a 403.
const ROOT_ONLY_URLS = new Set(['/settings/roles']);
// Device Templates, Users, and Factories management are admin/root-only (see
// each route's own guard).
const ADMIN_ONLY_URLS = new Set(['/device-templates', '/users', '/factories']);
// Guests get read-only, system-wide (not just their own) access to the Dashboard and Devices
// pages, plus their own account/notification settings (see the backend's
// DashboardController/DeviceController/NotificationController @Auth guards) — every other page
// is hidden.
const GUEST_ALLOWED_URLS = new Set(['/', '/devices', '/profile']);

function stripRootOnlyItems(items: NavItem[], isAdmin: boolean, isGuest: boolean): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if ('items' in item && item.items) {
      const children = stripRootOnlyItems(item.items as NavItem[], isAdmin, isGuest);
      if (children.length > 0) result.push({ ...item, items: children } as NavItem);
      continue;
    }
    if ('url' in item && item.url && ROOT_ONLY_URLS.has(String(item.url))) continue;
    if ('url' in item && item.url && !isAdmin && ADMIN_ONLY_URLS.has(String(item.url))) continue;
    if (isGuest && (!('url' in item) || !item.url || !GUEST_ALLOWED_URLS.has(String(item.url)))) continue;
    result.push(item);
  }
  return result;
}

function stripRootOnlyGroups(groups: NavGroupType[], isAdmin: boolean, isGuest: boolean): NavGroupType[] {
  return groups
    .map((group) => ({
      ...group,
      items: stripRootOnlyItems(group.items, isAdmin, isGuest),
    }))
    .filter((group) => group.items.length > 0);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isRoot = useIsRoot();
  const role = useAuthStore((state) => state.auth.user?.role);
  const isAdmin = isRoot || role === RoleType.ADMIN;
  const isGuest = role === RoleType.GUEST;

  // Menu is defined statically and gated by role — `/v1/account/menu`
  // isn't implemented by this backend, so there's no dynamic menu to merge.
  const navGroups = stripRootOnlyGroups(sidebarData.navGroups, isAdmin, isGuest);

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <FactorySwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser user={sidebarData.user} /> */}
        <div className="text-muted-foreground text-center text-xs">Version {__APP_VERSION__}</div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
