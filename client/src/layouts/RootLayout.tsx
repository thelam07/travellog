import { Outlet } from 'react-router';
import { AuthProvider } from '../contexts/AuthContext';

// AuthProvider cần useNavigate nên phải nằm bên trong router: bọc mọi route bằng layout gốc này.
export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
