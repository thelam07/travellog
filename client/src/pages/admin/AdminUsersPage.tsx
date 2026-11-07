import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { adminApi } from '../../api/admin';
import { fieldErrorsFrom, parseError } from '../../api/client';
import UserInitial from '../../components/UserInitial';
import { useAuth } from '../../contexts/AuthContext';
import type { PagedList, Role, User } from '../../types';
import { formatDate, ROLE_LABELS } from '../../utils/format';
import { hasErrors, validateEmail, validatePassword, validateUsername, type Errors } from '../../utils/validators';

// Hộp thoại tạm dùng chung trong trang; khi C xong Modal / ConfirmDialog thì thay vào.
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog card" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type CreateField = 'username' | 'email' | 'password' | 'role';

// UC16, BR18: admin tạo được cả admin.
function CreateUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const [values, setValues] = useState({ username: '', email: '', password: '', role: 'member' as Role });
  const [errors, setErrors] = useState<Errors<CreateField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends CreateField>(field: K, value: (typeof values)[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors<CreateField> = {
      username: validateUsername(values.username),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setLoading(true);
    setFormError(null);
    try {
      onCreated(await adminApi.createUser({ ...values, email: values.email.trim().toLowerCase() }));
    } catch (err) {
      const fe = fieldErrorsFrom(err);
      setErrors(fe);
      if (!Object.keys(fe).length) setFormError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const field = (name: 'username' | 'email' | 'password', label: string, hint?: string) => (
    <div className="form-field">
      <label htmlFor={`cu-${name}`}>
        {label}
        <span className="required"> *</span>
      </label>
      <input
        id={`cu-${name}`}
        type={name === 'email' ? 'email' : 'text'}
        autoComplete="off"
        value={values[name]}
        aria-invalid={Boolean(errors[name])}
        onChange={(e) => set(name, name === 'username' ? e.target.value.toLowerCase() : e.target.value)}
      />
      {errors[name] ? <div className="field-error">{errors[name]}</div> : hint && <div className="field-hint">{hint}</div>}
    </div>
  );

  return (
    <Dialog title="Tạo tài khoản" onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        {field('username', 'Tên đăng nhập', '3–30 kí tự: a-z, 0-9, _')}
        {field('email', 'Email')}
        {field('password', 'Mật khẩu tạm', 'Ít nhất 8 kí tự, có chữ và số. Báo cho người dùng để họ đổi sau.')}
        <div className="form-field">
          <label htmlFor="cu-role">Vai trò</label>
          <select id="cu-role" value={values.role} onChange={(e) => set('role', e.target.value as Role)}>
            <option value="member">{ROLE_LABELS.member}</option>
            <option value="admin">{ROLE_LABELS.admin}</option>
          </select>
        </div>
        {formError && <div className="alert alert-error">{formError}</div>}
        <div className="form-actions end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// UC18: đặt mật khẩu tạm; server làm các phiên cũ của người đó hết hiệu lực.
function ResetPasswordDialog({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validatePassword(password);
    setError(err);
    if (err) return;
    setLoading(true);
    try {
      await adminApi.resetPassword(user._id, password);
      onDone();
    } catch (ex) {
      setError(fieldErrorsFrom(ex).newPassword ?? parseError(ex).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog title={`Đặt lại mật khẩu cho @${user.username}`} onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <p className="muted small">
          Báo mật khẩu tạm cho người dùng; họ nên đổi lại sau khi đăng nhập. Các phiên đăng nhập cũ của họ sẽ bị đăng xuất.
        </p>
        <div className="form-field">
          <label htmlFor="rp-password">
            Mật khẩu tạm<span className="required"> *</span>
          </label>
          <input
            id="rp-password"
            type="text"
            autoComplete="off"
            value={password}
            aria-invalid={Boolean(error)}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(undefined);
            }}
          />
          {error && <div className="field-error">{error}</div>}
        </div>
        <div className="form-actions end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu…' : 'Đặt lại'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

type Pending = { user: User; change: { isLocked?: boolean; role?: Role } };

function describePending(p: Pending) {
  if (p.change.isLocked !== undefined)
    return p.change.isLocked
      ? `Khoá tài khoản @${p.user.username}? Người này bị đăng xuất ngay và không đăng nhập được nữa.`
      : `Mở khoá tài khoản @${p.user.username}?`;
  return `Đổi vai trò của @${p.user.username} thành “${ROLE_LABELS[p.change.role!]}”?`;
}

// F17 + F14. Quy tắc BR17 (còn ít nhất 1 admin) do server kiểm; giao diện chỉ báo lỗi server trả về.
export default function AdminUsersPage() {
  const { user: me, setUser: setMe } = useAuth();
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedList<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<User | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.users({ q, page }));
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setQ(input.trim());
    setPage(1);
  };

  const applyChange = async () => {
    if (!pending) return;
    setBusy(true);
    setPendingError(null);
    try {
      const updated = await adminApi.updateUser(pending.user._id, pending.change);
      setData((d) => (d ? { ...d, items: d.items.map((u) => (u._id === updated._id ? updated : u)) } : d));
      if (updated._id === me?._id) setMe(updated);
      setNotice({ type: 'success', text: `Đã cập nhật @${updated.username}.` });
      setPending(null);
    } catch (err) {
      // Ví dụ: không tự khoá, không hạ admin cuối cùng (BR17)
      setPendingError(parseError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Quản lý tài khoản</h1>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          ＋ Tạo tài khoản
        </button>
      </div>
      <form className="search-row" onSubmit={search} role="search">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tìm theo tên đăng nhập hoặc email"
          aria-label="Tìm tài khoản"
        />
        <button type="submit" className="btn btn-secondary">
          Tìm
        </button>
      </form>
      {notice && <div className={`alert alert-${notice.type}`}>{notice.text}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {loading && !data && <p className="muted">Đang tải…</p>}
      {data && data.items.length === 0 && !loading && <p className="muted">Không tìm thấy tài khoản.</p>}

      {data && data.items.length > 0 && (
        <div className={`table-wrap card ${loading ? 'is-loading' : ''}`}>
          <table className="table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => {
                const isMe = u._id === me?._id;
                return (
                  <tr key={u._id}>
                    <td data-label="Tài khoản">
                      <Link to={`/u/${u.username}`} className="user-row">
                        <UserInitial user={u} size={28} />
                        <span>
                          <strong>{u.displayName || u.username}</strong>
                          <span className="muted small"> @{u.username}</span>
                          {isMe && <span className="badge">bạn</span>}
                        </span>
                      </Link>
                    </td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Vai trò">
                      <select
                        value={u.role}
                        aria-label={`Vai trò của ${u.username}`}
                        onChange={(e) => {
                          setPendingError(null);
                          setPending({ user: u, change: { role: e.target.value as Role } });
                        }}
                      >
                        <option value="member">{ROLE_LABELS.member}</option>
                        <option value="admin">{ROLE_LABELS.admin}</option>
                      </select>
                    </td>
                    <td data-label="Trạng thái">
                      {u.isLocked ? <span className="badge badge-danger">Đã khoá</span> : <span className="badge">Hoạt động</span>}
                    </td>
                    <td data-label="Ngày tạo">{formatDate(u.createdAt)}</td>
                    <td data-label="Thao tác">
                      <div className="form-actions">
                        <button
                          type="button"
                          className={`btn btn-sm ${u.isLocked ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => {
                            setPendingError(null);
                            setPending({ user: u, change: { isLocked: !u.isLocked } });
                          }}
                        >
                          {u.isLocked ? 'Mở khoá' : 'Khoá'}
                        </button>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setResetting(u)}>
                          Đặt lại mật khẩu
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && totalPages > 1 && (
        <nav className="pager" aria-label="Phân trang">
          <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ‹ Trước
          </button>
          <span className="muted small">
            Trang {data.page}/{totalPages} · {data.total} tài khoản
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau ›
          </button>
        </nav>
      )}

      {creating && (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onCreated={(u) => {
            setCreating(false);
            setNotice({ type: 'success', text: `Đã tạo tài khoản @${u.username} (${ROLE_LABELS[u.role]}).` });
            void load();
          }}
        />
      )}
      {resetting && (
        <ResetPasswordDialog
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={() => {
            setNotice({ type: 'success', text: `Đã đặt lại mật khẩu cho @${resetting.username}.` });
            setResetting(null);
          }}
        />
      )}
      {pending && (
        <Dialog title="Xác nhận" onClose={() => setPending(null)}>
          <p>{describePending(pending)}</p>
          {pendingError && <div className="alert alert-error">{pendingError}</div>}
          <div className="form-actions end">
            <button type="button" className="btn btn-secondary" onClick={() => setPending(null)}>
              Huỷ
            </button>
            <button
              type="button"
              className={`btn ${pending.change.isLocked ? 'btn-danger' : 'btn-primary'}`}
              disabled={busy}
              onClick={applyChange}
            >
              {busy ? 'Đang lưu…' : 'Đồng ý'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
