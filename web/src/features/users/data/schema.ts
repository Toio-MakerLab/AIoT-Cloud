import { z } from "zod";

export const userStatusSchema = z.union([
	z.literal("active"),
	z.literal("inactive"),
	z.literal("invited"),
	z.literal("suspended"),
]);
export type UserStatus = z.infer<typeof userStatusSchema>;

// Values match domain.Role* constants exactly (backend/internal/core/domain/enum.go) —
// Casbin's g(userID, role) match is case-sensitive, so these must stay lowercase.
export const userRoleSchema = z.union([
	z.literal("root"),
	z.literal("admin"),
	z.literal("staff"),
	z.literal("anylytics"),
	z.literal("guest"),
	z.literal("user"),
]);

const userSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	username: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
	status: userStatusSchema,
	role: userRoleSchema,
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const userListSchema = z.array(userSchema);
