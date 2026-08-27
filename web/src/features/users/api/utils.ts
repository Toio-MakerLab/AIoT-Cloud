import type { User } from "../data/schema";
import type { IUser } from "./types";

export function mapIUserToUser(user: IUser): User {
	return {
		...user,
		createdAt: new Date(user.createdAt),
		updatedAt: new Date(user.updatedAt),
	};
}
