import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

/**
 * Trang đăng nhập / đăng ký: đã đăng nhập thì chuyển đi.
 * Vừa đăng nhập xong cũng đi qua đây, nên quay lại trang đang định vào (state.from) nếu đúng khu vực của vai trò.
 */
export default function GuestOnly({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, ready } = useAuth();
  const from = (useLocation().state as { from?: string } | null)?.from;
  if (!ready) return <div className="page-loading">Đang tải…</div>;
  if (user?.role === 'admin') return <Navigate to={from?.startsWith('/admin') ? from : '/admin'} replace />;
  // /admin/login vẫn cho thành viên mở (để đăng nhập bằng tài khoản admin)
  if (user && !admin) return <Navigate to={from && !from.startsWith('/admin') ? from : '/'} replace />;
  return <>{children}</>;
}
