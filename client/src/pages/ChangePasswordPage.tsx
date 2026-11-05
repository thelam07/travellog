import { useState, type FormEvent } from 'react';
import { authApi } from '../api/auth';
import { fieldErrorsFrom, parseError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { hasErrors, validatePassword, type Errors } from '../utils/validators';

type Field = 'currentPassword' | 'newPassword' | 'confirm';
const empty: Record<Field, string> = { currentPassword: '', newPassword: '', confirm: '' };

const FIELDS: { name: Field; label: string; autoComplete: string; hint?: string }[] = [
  { name: 'currentPassword', label: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password', hint: 'Ít nhất 8 kí tự, có chữ và số' },
  { name: 'confirm', label: 'Nhập lại mật khẩu mới', autoComplete: 'new-password' },
];

// F01d. Dùng cho cả thành viên và admin (admin đổi mật khẩu mặc định sau seed:admin).
export default function ChangePasswordPage() {
  const { replaceToken } = useAuth();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors<Field> = {
      currentPassword: values.currentPassword ? undefined : 'Vui lòng nhập mật khẩu hiện tại.',
      newPassword:
        validatePassword(values.newPassword) ??
        (values.newPassword === values.currentPassword ? 'Mật khẩu mới phải khác mật khẩu cũ.' : undefined),
      confirm: values.confirm !== values.newPassword ? 'Mật khẩu nhập lại không khớp.' : undefined,
    };
    setErrors(errs);
    if (hasErrors(errs)) return;

    setLoading(true);
    setMessage(null);
    try {
      const { token } = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      replaceToken(token); // token cũ đã hết hiệu lực (BR11)
      setValues(empty);
      setMessage({ type: 'success', text: 'Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.' });
    } catch (err) {
      const fe = fieldErrorsFrom(err);
      setErrors(fe);
      if (!Object.keys(fe).length) setMessage({ type: 'error', text: parseError(err).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="narrow">
      <h1>Đổi mật khẩu</h1>
      <form onSubmit={submit} className="card stack" noValidate>
        {FIELDS.map((f) => (
          <div className="form-field" key={f.name}>
            <label htmlFor={`pw-${f.name}`}>
              {f.label}
              <span className="required"> *</span>
            </label>
            <input
              id={`pw-${f.name}`}
              type="password"
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
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Đang lưu…' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}
