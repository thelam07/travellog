import { Link, Outlet } from 'react-router';

// Khung cho đăng nhập, đăng ký, đăng nhập quản trị: một thẻ ở giữa màn hình.
export default function AuthLayout() {
  return (
    <div className="auth-page">
      <Link to="/" className="brand">TravelLog</Link>
      <div className="card auth-card">
        <Outlet />
      </div>
    </div>
  );
}
