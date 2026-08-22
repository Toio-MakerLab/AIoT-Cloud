import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { mergeWithStaticFallback } from "@/components/layout/lib/merge-nav-groups";
import { NavGroup } from "@/components/layout/nav-group";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import type {
	NavGroup as NavGroupType,
	NavItem,
} from "@/components/layout/types";
import { useAccountMenuQuery } from "@/features/account/api/queries";
import { mapRemoteNavGroups } from "@/features/account/api/utils";
import { useIsRoot } from "@/features/account/hooks/use-is-root";
import { sidebarData } from "./data/sidebar-data";

// The Roles & Permissions page is root-only (see useIsRoot), so hide its
// static sidebar entry for everyone else instead of letting them click
// into a 403.
const ROOT_ONLY_URLS = new Set(["/settings/roles"]);

function stripRootOnlyItems(items: NavItem[]): NavItem[] {
	const result: NavItem[] = [];
	for (const item of items) {
		if ("items" in item && item.items) {
			const children = stripRootOnlyItems(item.items as NavItem[]);
			if (children.length > 0)
				result.push({ ...item, items: children } as NavItem);
			continue;
		}
		if ("url" in item && item.url && ROOT_ONLY_URLS.has(String(item.url)))
			continue;
		result.push(item);
	}
	return result;
}

function stripRootOnlyGroups(groups: NavGroupType[]): NavGroupType[] {
	return groups
		.map((group) => ({ ...group, items: stripRootOnlyItems(group.items) }))
		.filter((group) => group.items.length > 0);
}

function NavGroupsSkeleton() {
	return (
		<div className="space-y-6 px-2 py-1">
			{Array.from({ length: 3 }).map((_, groupIndex) => (
				<div key={groupIndex} className="space-y-2">
					<Skeleton className="h-3 w-16" />
					{Array.from({ length: 4 }).map((_, itemIndex) => (
						<Skeleton key={itemIndex} className="h-7 w-full" />
					))}
				</div>
			))}
		</div>
	);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data, isPending } = useAccountMenuQuery();
	const isRoot = useIsRoot();

	// Backend-driven menu, scoped to the user's role permissions.
	const dynamicGroups = data ? mapRemoteNavGroups(data.navGroups) : [];
	// Only merge in the static fallback (Dashboard, Settings, etc. that the
	// backend never sends) when the dynamic menu actually has content. An
	// empty/null navGroups means the role has zero permissions, so falling
	// back here would show the full static sidebar to a user who can't
	// access any of it.
	const staticGroups = isRoot
		? sidebarData.navGroups
		: stripRootOnlyGroups(sidebarData.navGroups);
	const navGroups =
		dynamicGroups.length > 0
			? mergeWithStaticFallback(dynamicGroups, staticGroups)
			: dynamicGroups;

	return (
		<Sidebar collapsible="icon" variant="floating" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={sidebarData.teams} />
			</SidebarHeader>
			<SidebarContent>
				{isPending ? (
					<NavGroupsSkeleton />
				) : (
					navGroups.map((props) => <NavGroup key={props.title} {...props} />)
				)}
			</SidebarContent>
			<SidebarFooter>
				{/* <NavUser user={sidebarData.user} /> */}
				<div className="text-muted-foreground text-center text-xs">
					Version {__APP_VERSION__}
				</div>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
