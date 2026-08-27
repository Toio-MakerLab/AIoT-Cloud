import type { UserRole } from '../data/schema';

export interface IUser {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateUser {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
}

export type IUpdateUser = Partial<Omit<ICreateUser, 'username'>> & {
  username?: string;
  isActive?: boolean;
};

export interface IUsersQueryParams {
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
  q?: string;
}

// Mirrors backend `ResponseCore<T>` (src/common/dto/response-core.dto.ts):
// { error: ErrorCode, data: T | null, message: string }. Business failures
// come back as HTTP 200 with a non-zero `error` code, so callers must check it.
export interface IResponseCore<T> {
  error: number;
  data: T | null;
  message: string;
}

export const SUCCESS_CODE = 0;

export interface IPageMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface IPageDto<T> {
  data: T[];
  meta: IPageMeta;
}
