import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import GuestOnly from './components/GuestOnly';
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';
import { useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import RootLayout from './layouts/RootLayout';
import ChangePasswordPage from './pages/ChangePasswordPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

// Trang chủ: khách → /explore, admin → /admin, thành viên → bảng tin (C thay PlaceholderPage bằng FeedPage).
function HomeRoute({ feed }: { feed: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loading">Đang tải…</div>;
  if (!user) return <Navigate to="/explore" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{feed}</>;
}

// Cây route theo mục 7.1. Ai làm trang nào thì thay PlaceholderPage bằng trang thật
// và thêm route của mình vào đúng layout; sửa file này bằng PR nhỏ (file dùng chung).
// Trang cần đăng nhập: bọc <RequireAuth> (mọi vai trò) hoặc <RequireRole role="member"> (BR20: admin không đăng bài, thích…).
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <HomeRoute feed={<PlaceholderPage title="Bảng tin" />} /> }, // C
          { path: 'explore', element: <PlaceholderPage title="Khám phá" /> }, // B
          { path: 'u/:username', element: <ProfilePage /> },
          { path: 'settings/password', element: <RequireAuth><ChangePasswordPage /></RequireAuth> },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <GuestOnly><LoginPage key="member" /></GuestOnly> },
          { path: 'register', element: <GuestOnly><RegisterPage /></GuestOnly> },
          { path: 'admin/login', element: <GuestOnly admin><LoginPage key="admin" admin /></GuestOnly> },
        ],
      },
      {
        path: 'admin',
        // Chưa đăng nhập → /admin/login; thành viên → / (BR20).
        element: <RequireRole role="admin"><AdminLayout /></RequireRole>,
        children: [
          { index: true, element: <Navigate to="/admin/reports" replace /> },
          { path: 'reports', element: <PlaceholderPage title="Báo cáo vi phạm" /> }, // C
          { path: 'users', element: <PlaceholderPage title="Quản lý tài khoản" /> }, // A
          { path: 'stats', element: <PlaceholderPage title="Thống kê địa điểm" /> }, // C
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
