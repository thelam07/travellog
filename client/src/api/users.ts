import { api } from './client';
import type { CursorPage, Profile, User, UserSummary } from '../types';

const path = (username: string) => `/users/${encodeURIComponent(username)}`;

export const usersApi = {
  // (A – E01) Tìm thành viên: khớp đầu một từ của tên hiển thị / username, tối đa 10 (BR23)
  search: (q: string, signal?: AbortSignal) =>
    api.get<UserSummary[]>('/users/search', { params: { q }, signal }).then((r) => r.data),
  profile: (username: string) => api.get<Profile>(path(username)).then((r) => r.data),
  followers: (username: string, cursor?: string | null) =>
    api
      .get<CursorPage<UserSummary>>(`${path(username)}/followers`, { params: { cursor: cursor ?? undefined } })
      .then((r) => r.data),
  following: (username: string, cursor?: string | null) =>
    api
      .get<CursorPage<UserSummary>>(`${path(username)}/following`, { params: { cursor: cursor ?? undefined } })
      .then((r) => r.data),
  updateMe: (body: { displayName?: string; bio?: string }) => api.patch<User>('/users/me', body).then((r) => r.data),
  updateAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.put<User>('/users/me/avatar', form).then((r) => r.data);
  },
  follow: (userId: string) => api.post<{ following: boolean }>('/follows', { userId }).then((r) => r.data),
  unfollow: (userId: string) => api.delete<{ following: boolean }>(`/follows/${userId}`).then((r) => r.data),
};
