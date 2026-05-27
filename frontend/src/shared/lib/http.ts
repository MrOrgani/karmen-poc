export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api' + path, init);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error';
    throw new ApiError(0, 'Backend injoignable (' + reason + ')');
  }
  if (!response.ok) {
    throw new ApiError(response.status, response.status + ' ' + response.statusText);
  }
  return (await response.json()) as T;
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
