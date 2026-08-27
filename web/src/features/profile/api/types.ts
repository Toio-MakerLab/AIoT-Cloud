export interface IProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateProfile {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
}
