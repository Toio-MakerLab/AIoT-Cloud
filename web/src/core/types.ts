export type Response<T> = {
	data: T;
	message: string;
	errorCode: number;
};
