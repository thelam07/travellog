import { api } from './client';
import type { CursorPage, Notification } from '../types';

export const notificationsApi = {
  list: (cursor?: string | null) =>
    api.get<CursorPage<Notification>>('/notifications', { params: cursor ? { cursor } : {} }).then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => api.patch<Notification>(`/notifications/${id}`).then((r) => r.data),
  markAllRead: () => api.patch<{ updated: number }>('/notifications').then((r) => r.data),
};
