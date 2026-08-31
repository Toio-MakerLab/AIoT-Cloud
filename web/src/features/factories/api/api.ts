import apiClient from '@/lib/api-client';
import type { ICreateFactory, IFactoriesQueryParams, IFactory, IPageDto, IResponseCore, IUpdateFactory } from './types';
import { SUCCESS_CODE } from './types';

// Unwraps a ResponseCore envelope, throwing so react-query treats a
// business-logic failure (HTTP 200 + non-zero `error`) the same as a
// rejected request. Callers surface `error.message` to the user.
function unwrap<T>(envelope: IResponseCore<T>): T {
  if (envelope.error !== SUCCESS_CODE) {
    throw new Error(envelope.message || 'Something went wrong!');
  }
  return envelope.data as T;
}

export const factoriesApi = {
  getFactories: async (params?: IFactoriesQueryParams) => {
    const response = await apiClient.get<IPageDto<IFactory>>('/factories', { params });
    return response.data;
  },
  getFactoryById: async (id: string) => {
    const response = await apiClient.get<IResponseCore<IFactory>>(`/factories/${id}`);
    return unwrap(response.data);
  },
  getMyFactory: async () => {
    const response = await apiClient.get<IResponseCore<IFactory | null>>('/factories/mine');
    return unwrap(response.data);
  },
  createFactory: async (data: ICreateFactory) => {
    const response = await apiClient.post<IResponseCore<IFactory>>('/factories', data);
    return unwrap(response.data);
  },
  updateFactory: async (id: string, data: IUpdateFactory) => {
    const response = await apiClient.put<IResponseCore<IFactory>>(`/factories/${id}`, data);
    return unwrap(response.data);
  },
  deleteFactory: async (id: string) => {
    const response = await apiClient.delete<IResponseCore<null>>(`/factories/${id}`);
    return unwrap(response.data);
  },
};
