import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { fieldErrorsFrom, parseError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { hasErrors, validateEmail, type Errors } from '../utils/validators';

type Field = 'email' | 'password';

// F01b (thành viên) và F01c (admin, BR20). Ô nhập dùng thẻ thường; khi C xong FormField / Button thì thay vào.
export default function LoginPage({ admin = false }: { admin?: boolean }) {
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; expired?: boolean } | null;

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<ReactNode>(
    state?.expired ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' : null,
  );
  const [loading, setLoading] = useState(false);
  const idPrefix = admin ? 'admin-login' : 'login';

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors<Field> = {
      email: validateEmail(values.email),
      password: values.password ? undefined : 'Vui lòng nhập mật khẩu.',
    };
    setErrors(errs);
    if (hasErrors(errs)) return;

    setLoading(true);
    setFormError(null);
    try {
      const body = { email: values.email.trim().toLowerCase(), password: values.password };
      if (admin) {
        await adminLogin(body);
        navigate(state?.from?.startsWith('/admin') ? state.from : '/admin', { replace: true });
      } else {
        await login(body);
        navigate(state?.from && !state.from.startsWith('/admin') ? state.from : '/', { replace: true });
      }
    } catch (err) {
      const { code, message } = parseError(err);
      setErrors(fieldErrorsFrom(err));
      if (code === 'ADMIN_USE_ADMIN_LOGIN') {
        setFormError(
          <>
            Tài khoản quản trị phải đăng nhập tại <Link to="/admin/login">trang quản trị</Link>.
          </>,
        );
      } else setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>{admin ? 'Đăng nhập quản trị' : 'Đăng nhập'}</h1>
      <p className="muted">{admin ? 'Chỉ dành cho tài khoản quản trị viên.' : 'Chào mừng trở lại TravelLog!'}</p>
      <form onSubmit={submit} className="stack" noValidate>
        <div className="form-field">
          <label htmlFor={`${idPrefix}-email`}>
            Email<span className="required"> *</span>
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            onChange={(e) => set('email', e.target.value)}
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>
        <div className="form-field">
          <label htmlFor={`${idPrefix}-password`}>
            Mật khẩu<span className="required"> *</span>
          </label>
          <input
            id={`${idPrefix}-password`}
            type="password"
            autoComplete="current-password"
            value={values.password}
            aria-invalid={Boolean(errors.password)}
            onChange={(e) => set('password', e.target.value)}
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>
        {formError && <div className="alert alert-error">{formError}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
      {admin ? (
        <p className="small">
          <Link to="/login">← Đăng nhập thành viên</Link>
        </p>
      ) : (
        <>
          <p className="muted small">Quên mật khẩu? Vui lòng liên hệ quản trị viên để được đặt lại.</p>
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link> · <Link to="/explore">Xem bài công khai</Link>
          </p>
        </>
      )}
    </>
  );
}
