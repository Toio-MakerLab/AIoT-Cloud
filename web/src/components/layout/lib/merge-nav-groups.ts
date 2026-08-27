import type { NavGroup, NavItem } from '@/components/layout/types';

function collectUrls(items: NavItem[], acc: Set<string>) {
  for (const item of items) {
    if ('url' in item && item.url) acc.add(String(item.url));
    if ('items' in item && item.items) collectUrls(item.items as NavItem[], acc);
  }
}

function filterUncovered(items: NavItem[], covered: Set<string>): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if ('items' in item && item.items) {
      const children = filterUncovered(item.items as NavItem[], covered);
      if (children.length > 0) {
        result.push({ ...item, items: children } as NavItem);
      }
      continue;
    }
    if ('url' in item && item.url && !covered.has(String(item.url))) {
      result.push(item);
    }
  }
  return result;
}

// The backend only returns menu entries it knows about (CMS-managed content
// pages), so it's typically a subset of the app's full navigation (it won't
// include Dashboard, Settings, Warehouse, or Help Center). Rather than
// replacing the sidebar outright and losing access to those pages, keep any
// static nav item whose route isn't already covered by the dynamic response.
export function mergeWithStaticFallback(dynamicGroups: NavGroup[], staticGroups: NavGroup[]): NavGroup[] {
  const covered = new Set<string>();
  dynamicGroups.forEach((group) => {
    collectUrls(group.items, covered);
  });

  const extraGroups: NavGroup[] = [];
  for (const group of staticGroups) {
    const items = filterUncovered(group.items, covered);
    if (items.length > 0) {
      extraGroups.push({ title: group.title, items });
    }
  }

  return [...dynamicGroups, ...extraGroups];
}
