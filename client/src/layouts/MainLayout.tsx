import { Link, NavLink, Outlet } from 'react-router';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import SearchBox from '../components/SearchBox';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { Plane } from 'lucide-react';

// Khung trang chính: header + nội dung trang con qua <Outlet />.
// Điện thoại: các link trên header (desktop-only) ẩn đi, thay bằng BottomNav dưới đáy.
export default function MainLayout() {
  const { user } = useAuth();
  // B11: trang /explore có SearchBox riêng tự cập nhật URL khi gõ. Ô trên header luôn hiện như bản mẫu
  // nhưng KHÔNG tự điều hướng (autoNavigate={false}), chỉ chuyển trang khi Enter / chọn gợi ý,
  // nên hai ô không giành nhau URL.
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true"><Plane size={18} /></span>TravelLog</Link>
          <div className="desktop-only header-search">
            {/* B11 + E01: Enter thì tới /explore?q=..., gõ @ thì gợi ý người dùng */}
            <SearchBox
              suggestUsers
              autoNavigate={false}
              placeholder="Tìm địa điểm, #hashtag hoặc @người dùng"
            />
          </div>
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
