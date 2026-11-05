import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

/** Chặn trang theo vai trò: admin vào trang thành viên (đăng bài…) → /admin; member vào /admin → / */
export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="page-loading">Đang tải…</div>;
  if (!user) {
    const to = role === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={to} replace state={{ from: location.pathname + location.search }} />;
  }
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return <>{children}</>;
}
