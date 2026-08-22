import { type User, userRoleSchema, userStatusSchema } from "../data/schema";
import type { IUser } from "./types";

export function mapIUserToUser(u: IUser): User {
	return {
		id: u.id,
		firstName: u.firstName,
		lastName: u.lastName,
		username: u.username,
		email: u.email,
		phoneNumber: u.phoneNumber,
		status: userStatusSchema.parse(u.status),
		// Legacy rows can still have uppercase role values from before the
		// lowercase domain.Role* migration; normalize before validating.
		role: userRoleSchema.parse(u.role.toLowerCase()),
		createdAt: new Date(u.createdAt),
		updatedAt: new Date(u.updatedAt),
	};
}
