import { api } from './client';
import type { AuthResponse, User } from '../types';

export interface Credentials {
  email: string;
  password: string;
}

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: Credentials) => api.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  adminLogin: (body: Credentials) => api.post<AuthResponse>('/auth/admin/login', body).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch<{ token: string }>('/auth/password', body).then((r) => r.data),
};
