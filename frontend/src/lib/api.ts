import {
  getAccessToken,
  refreshAccessToken,
} from '../features/auth/session';

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API request failed: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type ApiRequestOptions = RequestInit & {
  skipAuthRecovery?: boolean;
};

async function sendRequest(
  path: string,
  options: ApiRequestOptions,
  accessToken?: string,
) {
  const requestOptions = Object.fromEntries(
    Object.entries(options).filter(([key]) => key !== 'skipAuthRecovery'),
  ) as RequestInit;
  const headers = new Headers(requestOptions.headers);

  headers.set('Content-Type', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers,
  });
  const data = await response.json().catch(() => null);

  return { response, data };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  accessToken?: string,
): Promise<T> {
  const requestToken = accessToken ?? getAccessToken() ?? undefined;
  const { response, data } = await sendRequest(path, options, requestToken);

  if (
    response.status === 401
    && requestToken
    && !options.skipAuthRecovery
  ) {
    const latestAccessToken = getAccessToken();
    const refreshedAccessToken = latestAccessToken && latestAccessToken !== requestToken
      ? latestAccessToken
      : await refreshAccessToken();

    if (refreshedAccessToken) {
      const retry = await sendRequest(path, options, refreshedAccessToken);

      if (!retry.response.ok) {
        throw new ApiError(retry.response.status, retry.data);
      }

      return retry.data as T;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}
