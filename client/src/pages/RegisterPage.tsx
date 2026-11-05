import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { fieldErrorsFrom, parseError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { hasErrors, validateEmail, validatePassword, validateUsername, type Errors } from '../utils/validators';

type Field = 'username' | 'email' | 'password' | 'confirm';

const FIELDS: { name: Field; label: string; type: string; autoComplete: string; hint?: string }[] = [
  { name: 'username', label: 'Tên đăng nhập', type: 'text', autoComplete: 'username', hint: '3–30 kí tự: a-z, 0-9, _' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Mật khẩu', type: 'password', autoComplete: 'new-password', hint: 'Ít nhất 8 kí tự, có chữ và số' },
  { name: 'confirm', label: 'Nhập lại mật khẩu', type: 'password', autoComplete: 'new-password' },
];

// F01. Lỗi trùng email / username do server trả về hiện đúng dưới từng ô.
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<Field, string>>({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: field === 'username' ? value.toLowerCase() : value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors<Field> = {
      username: validateUsername(values.username),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirm: values.confirm !== values.password ? 'Mật khẩu nhập lại không khớp.' : undefined,
    };
    setErrors(errs);
    if (hasErrors(errs)) return;

    setLoading(true);
    setFormError(null);
    try {
      await register({ username: values.username, email: values.email.trim().toLowerCase(), password: values.password });
      navigate('/', { replace: true });
    } catch (err) {
      const fe = fieldErrorsFrom(err);
      setErrors(fe);
      if (!Object.keys(fe).length) setFormError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Tạo tài khoản</h1>
      <p className="muted">Lưu lại và chia sẻ những chuyến đi của bạn.</p>
      <form onSubmit={submit} className="stack" noValidate>
        {FIELDS.map((f) => (
          <div className="form-field" key={f.name}>
            <label htmlFor={`reg-${f.name}`}>
              {f.label}
              <span className="required"> *</span>
            </label>
            <input
              id={`reg-${f.name}`}
              type={f.type}
              autoComplete={f.autoComplete}
              value={values[f.name]}
              aria-invalid={Boolean(errors[f.name])}
              onChange={(e) => set(f.name, e.target.value)}
            />
            {errors[f.name] ? (
              <div className="field-error">{errors[f.name]}</div>
            ) : (
              f.hint && <div className="field-hint">{f.hint}</div>
            )}
          </div>
        ))}
        {formError && <div className="alert alert-error">{formError}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Đang tạo tài khoản…' : 'Đăng ký'}
        </button>
      </form>
      <p>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </>
  );
}
