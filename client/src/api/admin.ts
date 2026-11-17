import { api } from './client';
import type { PagedList, Post, Report, ReportStatus, Role, User } from '../types';

export const adminApi = {
  users: (params: { q?: string; page: number }) =>
    api.get<PagedList<User>>('/admin/users', { params: { q: params.q || undefined, page: params.page } }).then((r) => r.data),
  createUser: (body: { username: string; email: string; password: string; role: Role }) =>
    api.post<User>('/admin/users', body).then((r) => r.data),
  updateUser: (id: string, body: { isLocked?: boolean; role?: Role }) =>
    api.patch<User>(`/admin/users/${id}`, body).then((r) => r.data),
  resetPassword: (id: string, newPassword: string) =>
    api.put<{ ok: boolean }>(`/admin/users/${id}/password`, { newPassword }).then((r) => r.data),
  reports: (params: { status?: ReportStatus; page?: number }) =>
    api.get<PagedList<Report>>('/reports', { params }).then((r) => r.data),
  handleReport: (id: string, body: { status: 'resolved' | 'rejected'; hidePost?: boolean }) =>
    api.patch<{ updated: number }>(`/reports/${id}`, body).then((r) => r.data),
  updatePostStatus: (id: string, body: { status: 'active' | 'hidden' }) =>
    api.patch<Post>(`/admin/posts/${id}`, body).then((r) => r.data),
};
