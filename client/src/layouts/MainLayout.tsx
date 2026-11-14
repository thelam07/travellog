import { Link, NavLink, Outlet } from 'react-router';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../contexts/AuthContext';

// Khung trang chính: header + nội dung trang con qua <Outlet />.
// Điện thoại: các link trên header (desktop-only) ẩn đi, thay bằng BottomNav dưới đáy.
export default function MainLayout() {
  const { user } = useAuth();
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">TravelLog</Link>
          <nav className="nav">
            {user && <NavLink to="/" end className="desktop-only">Bảng tin</NavLink>}
            <NavLink to="/explore" className="desktop-only">Khám phá</NavLink>
            {user?.role === 'member' && (
              <NavLink to="/posts/new" className="desktop-only">Đăng bài</NavLink>
            )}
            {user ? (
              <>
                {user.role === 'admin' && <NavLink to="/admin" className="desktop-only">Quản trị</NavLink>}
                <NotificationBell />
                <UserMenu />
              </>
            ) : (
              <>
                <NavLink to="/login" className="desktop-only">Đăng nhập</NavLink>
                <NavLink to="/register" className="desktop-only">Đăng ký</NavLink>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
