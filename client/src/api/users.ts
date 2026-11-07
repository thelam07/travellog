import { api } from './client';
import type { CursorPage, Profile, User, UserSummary } from '../types';

const path = (username: string) => `/users/${encodeURIComponent(username)}`;

export const usersApi = {
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
  follow: (userId: string) => api.post<{ following: boolean }>('/follows', { userId }).then((r) => r.data),
  unfollow: (userId: string) => api.delete<{ following: boolean }>(`/follows/${userId}`).then((r) => r.data),
};
