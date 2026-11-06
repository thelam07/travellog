import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

// Khung trang chính: header + nội dung trang con qua <Outlet />.
export default function MainLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">TravelLog</Link>
          <nav className="nav">
            {user && <NavLink to="/" end>Bảng tin</NavLink>}
            <NavLink to="/explore">Khám phá</NavLink>
            {user ? (
              <>
                {/* Sau này gom vào menu người dùng (trang cá nhân, đổi mật khẩu) */}
                {user.role === 'admin' && <NavLink to="/admin">Quản trị</NavLink>}
                {user.role === 'member' ? (
                  <NavLink to={`/u/${user.username}`}>@{user.username}</NavLink>
                ) : (
                  <span className="muted">@{user.username}</span>
                )}
                <NavLink to="/settings/password">Đổi mật khẩu</NavLink>
                <button type="button" className="btn btn-ghost" onClick={logout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Đăng nhập</NavLink>
                <NavLink to="/register">Đăng ký</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
    </div>
  );
}
