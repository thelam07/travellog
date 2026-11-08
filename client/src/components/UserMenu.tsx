import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './Avatar';

/** Menu tài khoản trên header: gom trang cá nhân, sửa hồ sơ, đổi mật khẩu, đăng xuất vào nút avatar. */
export default function UserMenu() {
  const { user, isMember, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Đóng khi chuyển trang, bấm ra ngoài hoặc bấm Esc.
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div className="user-menu" ref={box}>
      <button
        type="button"
        className="user-menu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Tài khoản"
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar user={user} size="sm" />
      </button>
      {open && (
        <div className="user-menu-list" role="menu">
          <div className="user-menu-head">
            <strong>{user.displayName || user.username}</strong>
            <span className="muted">@{user.username}</span>
          </div>
          {isMember && (
            <>
              <Link role="menuitem" to={`/u/${user.username}`}>Trang cá nhân</Link>
              <Link role="menuitem" to="/settings/profile">Sửa hồ sơ</Link>
            </>
          )}
          {isAdmin && <Link role="menuitem" to="/admin">Quản trị</Link>}
          <Link role="menuitem" to="/settings/password">Đổi mật khẩu</Link>
          <button type="button" role="menuitem" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
