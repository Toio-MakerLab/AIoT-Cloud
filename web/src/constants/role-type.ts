export const RoleType = {
	ROOT: "ROOT",
	ADMIN: "ADMIN",
	USER: "USER",
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];
