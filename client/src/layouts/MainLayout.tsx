import { Link, NavLink, Outlet, useLocation } from 'react-router';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import SearchBox from '../components/SearchBox';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../contexts/AuthContext';

// Khung trang chính: header + nội dung trang con qua <Outlet />.
// Điện thoại: các link trên header (desktop-only) ẩn đi, thay bằng BottomNav dưới đáy.
export default function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  // B11: ở trang /explore có SearchBox riêng trong trang. Nếu header cũng tự navigate,
  // hai ô giành nhau URL → lặp vô hạn. Ẩn ô header khi đang ở /explore.
  const showHeaderSearch = !location.pathname.startsWith('/explore');
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">✈</span>TravelLog</Link>
          {showHeaderSearch && (
            <div className="desktop-only header-search">
              {/* B11: ô tìm kiếm — gõ xong 400ms tự chuyển tới /explore?q=... */}
              <SearchBox />
            </div>
          )}
          <nav className="nav">
            {user && <NavLink to="/" end className="desktop-only">Bảng tin</NavLink>}
            <NavLink to="/explore" className="desktop-only">Khám phá</NavLink>
            {user?.role === 'member' && (
              <NavLink to="/posts/new" className="desktop-only">Đăng bài</NavLink>
            )}
            {user ? (
              <>
                {user.role === 'admin' && <NavLink to="/admin" className="desktop-only">Quản trị</NavLink>}
                {/* Giống bản mẫu: 🌙 → 🔔 → avatar + tên (avatar ngoài cùng bên phải) */}
                <ThemeToggle />
                <NotificationBell />
                <UserMenu />
              </>
            ) : (
              <>
                <NavLink to="/login" className="desktop-only">Đăng nhập</NavLink>
                <NavLink to="/register" className="desktop-only">Đăng ký</NavLink>
                <ThemeToggle />
              </>
            )}
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
