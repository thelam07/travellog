import { Link, Outlet } from 'react-router';
import ThemeToggle from '../components/ThemeToggle';
import { Plane } from 'lucide-react';

// Khung cho đăng nhập, đăng ký, đăng nhập quản trị: một thẻ ở giữa màn hình.
export default function AuthLayout() {
  return (
    <div className="auth-page">
      <ThemeToggle />
      <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true"><Plane size={18} /></span>TravelLog</Link>
      <div className="card auth-card">
        <Outlet />
      </div>
    </div>
  );
}
