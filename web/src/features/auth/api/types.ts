export type AuthUser = {
	email?: string;
	exp?: number;
	sub?: string;
	picture?: string;
	updatedAt?: number;
	username?: string;
	createdAt?: number;
	emailVerified?: boolean;
	fullName: string;
	roles?: string[];
	role?: string;
};

// Define the response type (adjust based on your actual API)
export type LoginResponse = {
	accessToken: string;
	refreshToken: string;
	user: AuthUser;
};

// Ensure this matches your generic schema if possible, or just strict input type
export type LoginInput = {
	username: string;
	password: string;
};
