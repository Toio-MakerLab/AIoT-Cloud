import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { RoleType } from "@/constants/role-type";
import Users from "@/features/users";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/_authenticated/users/")({
	component: UsersPage,
});

// User management is an admin-only page (mutating routes are ADMIN/ROOT
// only on the backend). GET routes technically allow any authenticated
// role, but this route is meant purely as the admin management UI, so
// non-admins are blocked from the whole page rather than shown a
// read-only table.
function UsersPage() {
	const role = useAuthStore((state) => state.auth.user?.role);
	const isAdmin = role === RoleType.ADMIN || role === RoleType.ROOT;

	if (!isAdmin) {
		return (
			<>
				<Header fixed>
					<Search />
					<div className="ml-auto flex items-center space-x-4">
						<ThemeSwitch />
						<ProfileDropdown />
					</div>
				</Header>
				<Main>
					<div className="flex h-full flex-col items-center justify-center gap-2 text-center">
						<h2 className="text-2xl font-bold tracking-tight">Access denied</h2>
						<p className="text-muted-foreground">
							You don't have access to this page.
						</p>
					</div>
				</Main>
			</>
		);
	}

	return <Users />;
}
