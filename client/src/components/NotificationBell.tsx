import { NavLink } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { usePolling } from '../hooks/usePolling';
import { useNotificationStore } from '../stores/useNotificationStore';

/**
 * F11: chuông thông báo; chỉ thành viên (admin không có thông báo). Thông báo mới tới ngay qua Socket.IO (N03),
 * polling 30 giây để dự phòng khi socket rớt.
 * Header và BottomNav cùng hiện chuông, đọc chung một store: chỉ header gọi API và mở socket, BottomNav đặt poll={false}.
 */
export default function NotificationBell({ label = false, poll = true }: { label?: boolean; poll?: boolean }) {
  const { isMember, token } = useAuth();
  const unread = useNotificationStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  usePolling(fetchUnreadCount, 30000, isMember && poll);
  useNotificationSocket(token, isMember && poll);

  if (!isMember) return null;
  return (
    <NavLink
      to="/notifications"
      className={label ? 'bell nav-item' : 'bell'}
      aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
    >
      <span className="bell-icon" aria-hidden="true">
        🔔
        {unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
      </span>
      {label && <span>Thông báo</span>}
    </NavLink>
  );
}
