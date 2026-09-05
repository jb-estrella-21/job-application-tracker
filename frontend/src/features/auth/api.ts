import { apiRequest } from '../../lib/api';
import type { LoginResponse } from '../../types/auth';

type LoginCredentials = {
  email: string;
  password: string;
};

export function login(credentials: LoginCredentials) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}