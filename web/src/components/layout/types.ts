import type { LinkProps } from '@tanstack/react-router';
import type { Permission } from '@/features/account/api/types';

export type { Permission };

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface BaseNavItem {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  permission?: Permission;
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'];
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarData {
  user: User;
  navGroups: NavGroup[];
}

export type { NavCollapsible, NavGroup, NavItem, NavLink, SidebarData };
