import { createBrowserRouter, Navigate } from 'react-router';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import NotFoundPage from './pages/NotFoundPage';
import PlaceholderPage from './pages/PlaceholderPage';

// Cây route theo mục 7.1. Ai làm trang nào thì thay PlaceholderPage bằng trang thật
// và thêm route của mình vào đúng layout; sửa file này bằng PR nhỏ (file dùng chung).
export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // A thay bằng: khách → /explore, thành viên → FeedPage (C).
      { index: true, element: <Navigate to="/explore" replace /> },
      { path: 'explore', element: <PlaceholderPage title="Khám phá" /> }, // B
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <PlaceholderPage title="Đăng nhập" /> }, // A
      { path: 'register', element: <PlaceholderPage title="Đăng ký" /> }, // A
      { path: 'admin/login', element: <PlaceholderPage title="Đăng nhập quản trị" /> }, // A
    ],
  },
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/reports" replace /> },
      { path: 'reports', element: <PlaceholderPage title="Báo cáo vi phạm" /> }, // C
      { path: 'users', element: <PlaceholderPage title="Quản lý tài khoản" /> }, // A
      { path: 'stats', element: <PlaceholderPage title="Thống kê địa điểm" /> }, // C
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
