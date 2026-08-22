export interface IUser {
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

export interface ICreateUser {
	firstName: string;
	lastName: string;
	username: string;
	email?: string;
	phoneNumber?: string;
	password: string;
	role: string;
}

export interface IUpdateUser {
	firstName?: string;
	lastName?: string;
	username?: string;
	email?: string;
	phoneNumber?: string;
	password?: string;
	role?: string;
	status?: string;
}

export interface IInviteUser {
	email: string;
	role: string;
	desc?: string;
}

export interface IAssignUserRole {
	userId: string;
	role: string;
}

export interface IRevokeUserRole {
	userId: string;
	role: string;
}
