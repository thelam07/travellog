import { useEffect } from 'react';
import { connectSocket } from '../api/socket';
import { useNotificationStore } from '../stores/useNotificationStore';
import type { Notification } from '../types';

/** N03: nhận thông báo mới qua Socket.IO; mở khi đăng nhập là thành viên, đóng khi đăng xuất hoặc đổi token */
export function useNotificationSocket(token: string | null, enabled: boolean) {
  useEffect(() => {
    if (!token || !enabled) return;
    const socket = connectSocket(token);
    const store = useNotificationStore.getState;

    // Kết nối lại sau khi rớt mạng: lấy lại số chưa đọc để bù những gì bị lỡ.
    socket.on('connect', () => store().fetchUnreadCount());
    socket.on('notification', (data: { notification: Notification; unreadCount: number }) => {
      store().receive(data.notification, data.unreadCount);
    });
    // Server chủ động cắt (bị khoá, bị đặt mật khẩu tạm, token hết hạn): gọi API để interceptor xử lý đăng xuất.
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') store().fetchUnreadCount();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, enabled]);
}
