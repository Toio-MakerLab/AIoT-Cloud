import type { UserRole } from "./schema";

export const userRoles: { label: string; value: UserRole }[] = [
	{ label: "Root", value: "ROOT" },
	{ label: "Admin", value: "ADMIN" },
	{ label: "User", value: "USER" },
	{ label: "Guest", value: "GUEST" },
];

export const roleBadgeClasses = new Map<UserRole, string>([
	["ROOT", "bg-red-100/30 text-red-900 dark:text-red-200 border-red-200"],
	[
		"ADMIN",
		"bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200",
	],
	["USER", "bg-neutral-300/40 border-neutral-300"],
	["GUEST", "bg-slate-100/40 text-slate-700 dark:text-slate-300 border-slate-200"],
]);

export function getUserRoleLabel(role?: UserRole | null): string {
	return userRoles.find((r) => r.value === role)?.label ?? role ?? "-";
}
