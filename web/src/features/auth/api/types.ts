export type AuthUser = {
	id?: string;
	email?: string | null;
	username?: string;
	firstName?: string | null;
	lastName?: string | null;
	phone?: string | null;
	avatar?: string | null;
	role?: string;
	isActive?: boolean;
	isEmailVerified?: boolean;
	// Derived client-side from firstName/lastName/avatar for display.
	fullName?: string;
	picture?: string | null;
};

export type LoginResponse = {
	user: AuthUser;
	token: {
		accessToken: string;
		expiresIn: number;
	};
};

export type LoginInput = {
	usernameOrEmail: string;
	password: string;
};

export type RegisterInput = {
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
};

export type VerifyEmailInput = {
	email: string;
	token: string;
};

export type ResendVerificationInput = {
	email: string;
};
