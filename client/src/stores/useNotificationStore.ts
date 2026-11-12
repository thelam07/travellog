import { create } from 'zustand';
import { notificationsApi } from '../api/notifications';
import { parseError } from '../api/client';
import type { Notification } from '../types';

interface NotificationState {
  unreadCount: number;
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  loading: boolean;
  error: string | null;

  fetchUnreadCount: () => Promise<void>;
  loadFirst: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** N03: thông báo đẩy qua socket; thích / theo dõi lặp lại thì đưa bản cũ lên đầu */
  receive: (n: Notification, unreadCount: number) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

const initial = {
  unreadCount: 0,
  items: [] as Notification[],
  nextCursor: null,
  hasMore: true,
  loading: false,
  error: null,
};

// F11. Chuông và trang thông báo dùng chung store này, nên đánh dấu đã đọc ở trang thì chuông giảm số ngay.
export const useNotificationStore = create<NotificationState>()((set, get) => ({
  ...initial,

  fetchUnreadCount: async () => {
    try {
      const { count } = await notificationsApi.unreadCount();
      set({ unreadCount: count });
    } catch {
      // lỗi mạng tạm thời: giữ số cũ, lần polling sau thử lại
    }
  },

  loadFirst: async () => {
    set({ loading: true, error: null });
    try {
      const page = await notificationsApi.list(null);
      set({ items: page.items, nextCursor: page.nextCursor, hasMore: page.hasMore });
    } catch (err) {
      set({ error: parseError(err).message, hasMore: false });
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { loading, hasMore, nextCursor } = get();
    if (loading || !hasMore || !nextCursor) return;
    set({ loading: true });
    try {
      const page = await notificationsApi.list(nextCursor);
      set((s) => ({ items: [...s.items, ...page.items], nextCursor: page.nextCursor, hasMore: page.hasMore }));
    } catch (err) {
      set({ error: parseError(err).message });
    } finally {
      set({ loading: false });
    }
  },

  receive: (n, unreadCount) =>
    set((s) => ({
      unreadCount,
      // Danh sách chưa tải lần nào thì để trang thông báo tự tải khi mở.
      items: s.items.length || !s.hasMore ? [n, ...s.items.filter((x) => x._id !== n._id)] : s.items,
    })),

  // Optimistic: đổi giao diện trước, API lỗi thì trả lại
  markRead: async (id) => {
    const target = get().items.find((n) => n._id === id);
    if (!target || target.isRead) return;
    set((s) => ({
      items: s.items.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      await notificationsApi.markRead(id);
    } catch {
      set((s) => ({
        items: s.items.map((n) => (n._id === id ? { ...n, isRead: false } : n)),
        unreadCount: s.unreadCount + 1,
      }));
    }
  },

  markAllRead: async () => {
    const before = get();
    set((s) => ({ items: s.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }));
    try {
      await notificationsApi.markAllRead();
    } catch {
      set({ items: before.items, unreadCount: before.unreadCount });
    }
  },

  reset: () => set({ ...initial }),
}));
