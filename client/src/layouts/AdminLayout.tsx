import { Link, NavLink, Outlet } from 'react-router';

// Khung trang quản trị: menu bên trái, nội dung bên phải.
export default function AdminLayout() {
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/admin" className="brand">TravelLog Admin</Link>
        <nav className="admin-nav">
          <NavLink to="/admin/reports">Báo cáo</NavLink>
          <NavLink to="/admin/users">Tài khoản</NavLink>
          <NavLink to="/admin/stats">Thống kê</NavLink>
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
