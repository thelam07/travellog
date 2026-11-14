import { NavLink } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const cls = ({ isActive }: { isActive: boolean }) => `nav-item${isActive ? ' active' : ''}`;

/** Thanh điều hướng dưới đáy, chỉ hiện trên điện thoại (CSS ẩn khi màn hình rộng hơn 720px). */
export default function BottomNav() {
  const { user, isMember, isAdmin } = useAuth();
  return (
    <nav className="bottom-nav" aria-label="Điều hướng">
      {isMember && (
        <NavLink to="/" end className={cls}>
          <span aria-hidden="true">🏠</span>
          <span>Bảng tin</span>
        </NavLink>
      )}
      <NavLink to="/explore" className={cls}>
        <span aria-hidden="true">🧭</span>
        <span>Khám phá</span>
      </NavLink>
      {/* B8: thêm nút "Đăng bài" (/posts/new) ở giữa khi có route. */}
      {isMember && (
        <NavLink to="/posts/new" className={cls}>
          <span aria-hidden="true">✏️</span>
          <span>Đăng bài</span>
        </NavLink>
      )}
      {isMember && <NotificationBell label poll={false} />}
      {isAdmin && (
        <NavLink to="/admin" className={cls}>
          <span aria-hidden="true">🛡️</span>
          <span>Quản trị</span>
        </NavLink>
      )}
      {isMember && (
        <NavLink to={`/u/${user!.username}`} className={cls}>
          <span aria-hidden="true">👤</span>
          <span>Cá nhân</span>
        </NavLink>
      )}
      {!user && (
        <>
          <NavLink to="/login" className={cls}>
            <span aria-hidden="true">🔑</span>
            <span>Đăng nhập</span>
          </NavLink>
          <NavLink to="/register" className={cls}>
            <span aria-hidden="true">✍️</span>
            <span>Đăng ký</span>
          </NavLink>
        </>
      )}
    </nav>
  );
}
