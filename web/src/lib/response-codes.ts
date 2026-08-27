import { AxiosError } from 'axios';
import type { Response } from '@/core/types';

/**
 * Mirrors the backend's response "case code" enum (see backend `ErrorCode*`
 * constants). Each code identifies a specific backend scenario — not
 * necessarily a bug — and is always returned alongside an HTTP error status.
 * Keep this in sync when the backend adds/changes codes.
 */
export const ResponseCode = {
  EmailExists: -498,
  EmailNotExists: -499,
  FullName: -493,
  Role: -492,
  TenantID: -491,
  Password: -497,
  TokenNotFound: -496,
  UserInactive: -495,
  InsufficientPermission: -494,

  UserStatusNotFound: -482,
  UserNotFound: -481,
  ProductNotFound: -480,
  InventoryNotFound: -479,
  OrderNotFound: -478,

  NotificationNotFound: -467,
  NotificationSettingNotFound: -466,
  ChannelVerificationInvalid: -465,

  PayloadBadRequest: -400,
  UnAuthorization: -401,
  Forbidden: -403,
  InternalServerError: -500,
  TooManyRequests: -429,
  InvalidCredentials: -413,
} as const;

export type ResponseCodeValue = (typeof ResponseCode)[keyof typeof ResponseCode];

export const RESPONSE_CODE_MESSAGES: Record<ResponseCodeValue, string> = {
  [ResponseCode.EmailExists]: 'This email is already in use.',
  [ResponseCode.EmailNotExists]: 'No account found with this email.',
  [ResponseCode.FullName]: 'Full name is invalid.',
  [ResponseCode.Role]: 'Invalid role.',
  [ResponseCode.TenantID]: 'Invalid tenant.',
  [ResponseCode.Password]: 'Password is invalid.',
  [ResponseCode.TokenNotFound]: 'Session expired. Please sign in again.',
  [ResponseCode.UserInactive]: 'This account has been deactivated.',
  [ResponseCode.InsufficientPermission]: "You don't have permission to perform this action.",

  [ResponseCode.UserStatusNotFound]: 'User status not found.',
  [ResponseCode.UserNotFound]: 'User not found.',
  [ResponseCode.ProductNotFound]: 'Product not found.',
  [ResponseCode.InventoryNotFound]: 'Inventory not found.',
  [ResponseCode.OrderNotFound]: 'Order not found.',

  [ResponseCode.NotificationNotFound]: 'Notification not found.',
  [ResponseCode.NotificationSettingNotFound]: 'Notification setting not found.',
  [ResponseCode.ChannelVerificationInvalid]: 'Verification code is invalid or has expired. Please request a new one.',

  [ResponseCode.PayloadBadRequest]: 'Invalid request. Please check your input.',
  [ResponseCode.UnAuthorization]: 'Session expired!',
  [ResponseCode.Forbidden]: 'You do not have permission to access this resource.',
  [ResponseCode.InternalServerError]: 'Internal Server Error!',
  [ResponseCode.TooManyRequests]: 'Too many requests. Please slow down and try again.',
  [ResponseCode.InvalidCredentials]: 'Invalid email or password.',
};

/** Extracts the backend case code from an Axios error response, if present. */
export function getResponseCode(error: unknown): ResponseCodeValue | undefined {
  if (!(error instanceof AxiosError)) return undefined;
  const data = error.response?.data as Response<unknown> | undefined;
  return data?.error as ResponseCodeValue | undefined;
}

/**
 * Resolves a user-facing message for an error: mapped case-code message first,
 * then the backend-provided message, then a generic fallback.
 */
export function getResponseMessage(error: unknown, fallback = 'Something went wrong!'): string {
  const code = getResponseCode(error);
  if (code !== undefined && code in RESPONSE_CODE_MESSAGES) {
    return RESPONSE_CODE_MESSAGES[code];
  }
  if (error instanceof AxiosError && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
}
