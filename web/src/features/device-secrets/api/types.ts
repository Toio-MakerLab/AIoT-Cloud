export interface IDeviceSecret {
	id: string;
	label?: string | null;
	createdByUserId: string;
	revokedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ICreateDeviceSecret {
	label?: string;
}

export interface ICreatedDeviceSecret {
	deviceSecret: IDeviceSecret;
	plaintext: string;
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
