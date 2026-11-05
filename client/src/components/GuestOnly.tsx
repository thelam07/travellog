import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

/** Trang đăng nhập / đăng ký: đã đăng nhập thì chuyển đi (admin → /admin, thành viên → /) */
export default function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loading">Đang tải…</div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return <>{children}</>;
}
