import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { setSessionExpiredHandler, tokenStorage } from '../api/client';
import { authApi, type Credentials } from '../api/auth';
import { useNotificationStore } from '../stores/useNotificationStore';
import type { AuthResponse, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** false khi đang kiểm tra token cũ bằng GET /auth/me lúc mở trang */
  ready: boolean;
  isAdmin: boolean;
  isMember: boolean;
  login: (body: Credentials) => Promise<User>;
  adminLogin: (body: Credentials) => Promise<User>;
  register: (body: { username: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
  /** PATCH /auth/password trả token mới, token cũ hết hiệu lực (BR11) */
  replaceToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Đổi người dùng thì xoá dữ liệu của người trước (C thêm reset bảng tin vào đây)
function resetStores() {
  useNotificationStore.getState().reset();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !tokenStorage.get());

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    resetStores();
  }, []);

  // Có token cũ (mở lại trang, F5) → hỏi server người dùng hiện tại; lỗi thì đăng xuất
  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    authApi
      .me()
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [token, user, logout]);

  // Interceptor gặp 401 hoặc tài khoản bị khoá → đăng xuất và về trang đăng nhập phù hợp
  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
      const isAdminArea = window.location.pathname.startsWith('/admin');
      navigate(isAdminArea ? '/admin/login' : '/login', {
        replace: true,
        state: { from: window.location.pathname, expired: true },
      });
    });
    return () => setSessionExpiredHandler(null);
  }, [logout, navigate]);

  const acceptAuth = useCallback((res: AuthResponse) => {
    tokenStorage.set(res.token);
    resetStores();
    setToken(res.token);
    setUser(res.user);
    setReady(true);
    return res.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      isAdmin: user?.role === 'admin',
      isMember: user?.role === 'member',
      login: (body) => authApi.login(body).then(acceptAuth),
      adminLogin: (body) => authApi.adminLogin(body).then(acceptAuth),
      register: (body) => authApi.register(body).then(acceptAuth),
      logout,
      setUser,
      replaceToken: (t) => {
        tokenStorage.set(t);
        setToken(t);
      },
    }),
    [user, token, ready, acceptAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
}
