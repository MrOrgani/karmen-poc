import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (err: AxiosError) => {
    if (err.response) {
      throw new ApiError(
        err.response.status,
        err.response.status + ' ' + err.response.statusText,
      );
    }
    throw new ApiError(0, 'Backend injoignable (' + err.message + ')');
  },
);

export async function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(path, config);
  return response.data;
}

export async function post<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(path, body, config);
  return response.data;
}
