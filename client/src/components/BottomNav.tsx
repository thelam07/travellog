import { NavLink } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { Compass, House, LogIn, Plus, ShieldCheck, User, UserPlus } from 'lucide-react';

const cls = ({ isActive }: { isActive: boolean }) => `nav-item${isActive ? ' active' : ''}`;

/** Thanh điều hướng dưới đáy, chỉ hiện trên điện thoại (CSS ẩn khi màn hình rộng hơn 720px). */
export default function BottomNav() {
  const { user, isMember, isAdmin } = useAuth();
  return (
    <nav className="bottom-nav" aria-label="Điều hướng">
      {isMember && (
        <NavLink to="/" end className={cls}>
          <span aria-hidden="true"><House size={22} /></span>
          <span>Bảng tin</span>
        </NavLink>
      )}
      <NavLink to="/explore" className={cls}>
        <span aria-hidden="true"><Compass size={22} /></span>
        <span>Khám phá</span>
      </NavLink>
      {/* Nút "Đăng bài" ở giữa, nổi bật bằng vòng tròn màu chủ đạo (nav-primary). */}
      {isMember && (
        <NavLink to="/posts/new" className={(s) => `${cls(s)} nav-primary`}>
          <span aria-hidden="true"><Plus size={22} strokeWidth={2.5} /></span>
          <span>Đăng bài</span>
        </NavLink>
      )}
      {isMember && <NotificationBell label poll={false} />}
      {isAdmin && (
        <NavLink to="/admin" className={cls}>
          <span aria-hidden="true"><ShieldCheck size={22} /></span>
          <span>Quản trị</span>
        </NavLink>
      )}
      {isMember && (
        <NavLink to={`/u/${user!.username}`} className={cls}>
          <span aria-hidden="true"><User size={22} /></span>
          <span>Cá nhân</span>
        </NavLink>
      )}
      {!user && (
        <>
          <NavLink to="/login" className={cls}>
            <span aria-hidden="true"><LogIn size={22} /></span>
            <span>Đăng nhập</span>
          </NavLink>
          <NavLink to="/register" className={cls}>
            <span aria-hidden="true"><UserPlus size={22} /></span>
            <span>Đăng ký</span>
          </NavLink>
        </>
      )}
    </nav>
  );
}
