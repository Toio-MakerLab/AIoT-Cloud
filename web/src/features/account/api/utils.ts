import type { LinkProps } from '@tanstack/react-router';
import { resolveIcon } from '@/components/layout/icon-registry';
import type { NavGroup, NavItem } from '@/components/layout/types';
import type { IAccountMenuNavGroup, IAccountMenuNavItem, Permission } from './types';

// The backend's menu entries use resource-key-style URLs (e.g. "/cms/posts",
// "/messages", "/users") that don't match this app's actual route paths
// (e.g. "/posts", "/chats", "/users"). `permission.resource` is the more
// stable identifier, so prefer aliasing off of it; fall back to stripping a
// leading "/cms" segment from `url`, then to the raw `url` as a last resort.
const RESOURCE_ROUTE_ALIASES: Record<string, string> = {
  'cms/posts': '/posts',
  'cms/categories': '/categories',
  'cms/tags': '/posts/tags',
  'cms/tasks': '/tasks',
  'cms/notes': '/notes',
  'cms/quizzes': '/quizzes',
  'cms/drawings': '/drawings',
  'cms/timetables': '/timetables',
  'cms/menus': '/settings/roles',
  messages: '/chats',
  users: '/users',
};

function resolveNavUrl(item: IAccountMenuNavItem): string {
  const resource = item.permission?.resource;
  if (resource && RESOURCE_ROUTE_ALIASES[resource]) {
    return RESOURCE_ROUTE_ALIASES[resource];
  }
  if (item.url?.startsWith('/cms/')) {
    return item.url.slice('/cms'.length);
  }
  return item.url ?? '';
}

function mapRemoteNavItem(item: IAccountMenuNavItem): NavItem {
  const icon = resolveIcon(item.icon);

  if (item.items && item.items.length > 0) {
    return {
      title: item.title,
      icon,
      items: item.items.map((child) => ({
        title: child.title,
        // Backend-driven URLs can't be statically verified against the router's
        // typed route list, so this cast is the one intentional escape hatch.
        url: resolveNavUrl(child) as LinkProps['to'],
        icon: resolveIcon(child.icon),
        permission: child.permission,
      })),
    };
  }

  return {
    title: item.title,
    icon,
    permission: item.permission,
    url: resolveNavUrl(item) as LinkProps['to'],
  };
}

export function mapRemoteNavGroups(groups: IAccountMenuNavGroup[] | null | undefined): NavGroup[] {
  if (!groups) return [];
  return groups.map((group) => ({
    title: group.title,
    items: group.items.map(mapRemoteNavItem),
  }));
}

// Walks the raw backend nav tree (not the mapped frontend NavGroup) and
// collects every leaf's `permission`, keyed by its `resource`. Feature pages
// use this to look up "can I create/update/delete on this resource" without
// caring where (or whether) the resource appears in the sidebar.
export function flattenPermissions(navGroups: IAccountMenuNavGroup[] | null | undefined): Record<string, Permission> {
  const map: Record<string, Permission> = {};
  if (!navGroups) return map;

  function visit(items: IAccountMenuNavItem[]) {
    for (const item of items) {
      if (item.items && item.items.length > 0) {
        visit(item.items);
        continue;
      }
      if (item.permission) {
        map[item.permission.resource] = item.permission;
      }
    }
  }

  navGroups.forEach((group) => {
    visit(group.items);
  });
  return map;
}
