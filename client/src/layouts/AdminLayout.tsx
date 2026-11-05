import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

// Khung trang quản trị: menu bên trái, nội dung bên phải.
export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="brand">TravelLog Admin</Link>
        <nav className="admin-nav">
          <NavLink to="/admin/reports">Báo cáo</NavLink>
          <NavLink to="/admin/users">Tài khoản</NavLink>
          <NavLink to="/admin/stats">Thống kê</NavLink>
        </nav>
        <div className="admin-account">
          <span className="muted">@{user?.username}</span>
          <Link to="/settings/password">Đổi mật khẩu</Link>
          <Link to="/explore">Xem trang chính</Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
