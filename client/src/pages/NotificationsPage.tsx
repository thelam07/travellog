import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import UserInitial from '../components/UserInitial';
import { useNotificationStore } from '../stores/useNotificationStore';
import type { Notification } from '../types';
import { timeAgo } from '../utils/format';

function describe(n: Notification): string {
  switch (n.type) {
    case 'like':
      return `đã thích bài viết “${n.post?.title ?? 'của bạn'}”`;
    case 'comment':
      return `đã bình luận về bài viết “${n.post?.title ?? 'của bạn'}”`;
    case 'follow':
      return 'đã bắt đầu theo dõi bạn';
  }
}

// F11. Bấm một thông báo: đánh dấu đã đọc rồi mở trang cá nhân (theo dõi) hoặc bài viết (thích, bình luận).
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { items, loading, hasMore, error, unreadCount, loadFirst, loadMore, markRead, markAllRead, fetchUnreadCount } =
    useNotificationStore();

  useEffect(() => {
    void loadFirst();
    void fetchUnreadCount();
  }, [loadFirst, fetchUnreadCount]);

  // Đang mở trang mà polling của chuông thấy số chưa đọc tăng → tải lại danh sách để khớp với chuông
  const prevUnread = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevUnread.current) void loadFirst();
    prevUnread.current = unreadCount;
  }, [unreadCount, loadFirst]);

  const open = (n: Notification) => {
    void markRead(n._id);
    if (n.type === 'follow' || !n.post) navigate(`/u/${n.actor.username}`);
    else navigate(`/posts/${n.post._id}${n.type === 'comment' ? '#comments' : ''}`);
  };

  return (
    <div className="narrow">
      <div className="page-head">
        <h1>Thông báo</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={markAllRead}
          disabled={unreadCount === 0 && items.every((n) => n.isRead)}
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">Chưa có thông báo. Khi có người thích, bình luận hay theo dõi bạn, thông báo sẽ hiện ở đây.</p>
      )}
      {items.length > 0 && (
        <ul className="notification-list card">
          {items.map((n) => (
            <li key={n._id} className={n.isRead ? 'read' : 'unread'}>
              <button type="button" onClick={() => open(n)}>
                <UserInitial user={n.actor} size={40} />
                <span className="notification-text">
                  <span>
                    <strong>{n.actor.displayName || n.actor.username}</strong> {describe(n)}
                  </span>
                  <span className="muted small">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.isRead && <span className="dot" aria-label="Chưa đọc" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && <p className="muted">Đang tải…</p>}
      {hasMore && !loading && items.length > 0 && (
        <button type="button" className="btn btn-ghost" onClick={loadMore}>
          Xem thông báo cũ hơn
        </button>
      )}
    </div>
  );
}
