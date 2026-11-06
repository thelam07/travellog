import { NavLink } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { usePolling } from '../hooks/usePolling';
import { useNotificationStore } from '../stores/useNotificationStore';

/** F11: chuông thông báo, số chưa đọc tự cập nhật mỗi 30 giây; chỉ thành viên (admin không có thông báo) */
export default function NotificationBell() {
  const { isMember } = useAuth();
  const unread = useNotificationStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  usePolling(fetchUnreadCount, 30000, isMember);

  if (!isMember) return null;
  return (
    <NavLink to="/notifications" className="bell" aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}>
      <span aria-hidden="true">🔔</span>
      {unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  );
}
