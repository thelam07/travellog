import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Avatar } from '../components/Avatar';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { ChartColumn, Compass, Flag, Plane, Users } from 'lucide-react';

// Khung trang quản trị (giống bản mẫu): menu bên trái có icon; thanh trên cùng có tên admin,
// nút giao diện sáng/tối, Đổi mật khẩu, Đăng xuất. Điện thoại: menu thành thanh ngang.
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="brand">
          <span className="brand-mark" aria-hidden="true"><Plane size={18} /></span>TravelLog <span className="badge">Admin</span>
        </Link>
        <nav className="admin-nav" aria-label="Menu quản trị">
          <NavLink to="/admin/reports"><Flag size={18} aria-hidden />Báo cáo</NavLink>
          <NavLink to="/admin/users"><Users size={18} aria-hidden />Tài khoản</NavLink>
          <NavLink to="/admin/stats"><ChartColumn size={18} aria-hidden />Thống kê</NavLink>
          <NavLink to="/explore"><Compass size={18} aria-hidden />Xem trang chính</NavLink>
        </nav>
      </aside>
      <div className="admin-body">
        <header className="admin-header">
          <span className="admin-user">
            {user && <Avatar user={user} size="sm" />}
            {user?.displayName || user?.username}
          </span>
          <div className="admin-header-actions">
            <ThemeToggle />
            <Link to="/settings/password" className="btn btn-ghost btn-sm">
              Đổi mật khẩu
            </Link>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
