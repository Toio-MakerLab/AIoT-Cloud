export interface IFactory {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateFactory {
  name: string;
  address?: string;
  description?: string;
}

export type IUpdateFactory = Partial<ICreateFactory>;

export interface IFactoriesQueryParams {
  page?: number;
  take?: number;
  order?: 'ASC' | 'DESC';
  q?: string;
}

// Mirrors backend `ResponseCore<T>` (src/common/dto/response-core.dto.ts):
// { error: ErrorCode, data: T | null, message: string }. Business failures on
// this API come back as HTTP 200 with a non-zero `error` code, so callers
// must check it.
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
