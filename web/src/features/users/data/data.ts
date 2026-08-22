import {
	IconChartBar,
	IconShieldLock,
	IconUser,
	IconUserQuestion,
	IconUserShield,
	IconUsersGroup,
} from "@tabler/icons-react";
import type { UserStatus } from "./schema";

export const callTypes = new Map<UserStatus, string>([
	["active", "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"],
	["inactive", "bg-neutral-300/40 border-neutral-300"],
	["invited", "bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300"],
	[
		"suspended",
		"bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10",
	],
]);

// Values match domain.Role* constants exactly (backend/internal/core/domain/enum.go).
export const userTypes = [
	{
		label: "Admin",
		value: "admin",
		icon: IconUserShield,
	},
	{
		label: "Staff",
		value: "staff",
		icon: IconUsersGroup,
	},
	{
		label: "Analyst",
		value: "anylytics",
		icon: IconChartBar,
	},
	{
		label: "Guest",
		value: "guest",
		icon: IconUserQuestion,
	},
	{
		label: "User",
		value: "user",
		icon: IconUser,
	},
] as const;

// The root role is only ever assignable by a caller who is themself root
// (enforced server-side too — see AssignRole/CreateAccount/UpdateAccount),
// so it's kept out of `userTypes` and added in explicitly where needed.
const rootUserType = { label: "Root", value: "root", icon: IconShieldLock };

export function getAssignableRoleTypes(includeRoot: boolean) {
	return includeRoot ? [rootUserType, ...userTypes] : userTypes;
}
