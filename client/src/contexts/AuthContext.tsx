import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { setSessionExpiredHandler, TOKEN_KEY, tokenStorage, type SessionEndReason } from '../api/client';
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
  /** Vì sao phiên vừa bị server kết thúc (bị khoá / hết hạn), để trang đăng nhập báo đúng; null khi tự đăng xuất */
  sessionEndReason: SessionEndReason | null;
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
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason | null>(null);

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
    setSessionExpiredHandler((reason) => {
      // Lưu lý do ở đây vì state của navigate có thể bị RequireAuth / RequireRole ghi đè khi cùng chuyển trang
      setSessionEndReason(reason);
      logout();
      const isAdminArea = window.location.pathname.startsWith('/admin');
      navigate(isAdminArea ? '/admin/login' : '/login', {
        replace: true,
        state: { from: window.location.pathname },
      });
    });
    return () => setSessionExpiredHandler(null);
  }, [logout, navigate]);

  // Tab khác đăng nhập tài khoản khác, đăng xuất hoặc đổi mật khẩu → tải lại để tab này dùng đúng token mới,
  // không hiện người cũ mà gọi API bằng token của người mới. Không còn token thì RequireAuth tự đưa về /login.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === null) window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const acceptAuth = useCallback((res: AuthResponse) => {
    tokenStorage.set(res.token);
    resetStores();
    setSessionEndReason(null);
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
      sessionEndReason,
    }),
    [user, token, ready, sessionEndReason, acceptAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
}
