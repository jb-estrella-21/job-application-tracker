import { apiRequest } from '../../lib/api';
import type { LoginResponse, User } from '../../types/auth';

type LoginCredentials = {
  email: string;
  password: string;
};

export function login(credentials: LoginCredentials) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    credentials: 'include',
    skipAuthRecovery: true,
  });
}

export function getCurrentUser(accessToken: string) {
  return apiRequest<{ user: User }>('/auth/me', {
    skipAuthRecovery: true,
  }, accessToken).then((response) => response.user);
}

export function logoutFromServer() {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    credentials: 'include',
    skipAuthRecovery: true,
  });
}
