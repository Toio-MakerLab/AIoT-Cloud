export interface IProfile {
	id: string;
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	phoneNumber: string;
	status: string;
	role: string;
	createdAt: string;
	updatedAt: string;
}

export interface IUpdateProfile {
	firstName?: string;
	lastName?: string;
	username?: string;
	email?: string;
	phoneNumber?: string;
}
