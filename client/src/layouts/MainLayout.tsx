import { Link, NavLink, Outlet } from 'react-router';

// Khung trang chính: header + nội dung trang con qua <Outlet />.
export default function MainLayout() {
  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">TravelLog</Link>
          <nav className="nav">
            <NavLink to="/" end>Bảng tin</NavLink>
            <NavLink to="/explore">Khám phá</NavLink>
            <NavLink to="/login">Đăng nhập</NavLink>
          </nav>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
    </div>
  );
}
