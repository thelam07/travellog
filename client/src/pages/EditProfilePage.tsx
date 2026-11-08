import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { usersApi } from '../api/users';
import { fieldErrorsFrom, parseError } from '../api/client';
import AvatarPicker from '../components/AvatarPicker';
import { useAuth } from '../contexts/AuthContext';
import type { Errors } from '../utils/validators';

type Field = 'displayName' | 'bio';
const LIMITS: Record<Field, number> = { displayName: 50, bio: 200 };

// F10. Username, email không đổi được. Ảnh đại diện lưu riêng qua AvatarPicker, không cần bấm Lưu.
export default function EditProfilePage() {
  const { user, setUser } = useAuth();
  const [values, setValues] = useState<Record<Field, string>>({
    displayName: user?.displayName === user?.username ? '' : (user?.displayName ?? ''),
    bio: user?.bio ?? '',
  });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setMessage(null);
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Errors<Field> = {
      displayName: values.displayName.trim().length > LIMITS.displayName ? 'Tên hiển thị tối đa 50 kí tự.' : undefined,
      bio: values.bio.length > LIMITS.bio ? 'Giới thiệu tối đa 200 kí tự.' : undefined,
    };
    setErrors(errs);
    if (errs.displayName || errs.bio) return;

    setLoading(true);
    try {
      const updated = await usersApi.updateMe({ displayName: values.displayName.trim(), bio: values.bio });
      setUser(updated); // header và các chỗ dùng useAuth().user cập nhật ngay
      setMessage({ type: 'success', text: 'Đã lưu hồ sơ.' });
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
      <h1>Sửa hồ sơ</h1>
      <form onSubmit={submit} className="card stack" noValidate>
        <AvatarPicker />
        <div className="form-field">
          <label htmlFor="pf-username">Tên đăng nhập</label>
          <input id="pf-username" value={user.username} disabled />
          <div className="field-hint">Không đổi được, vì dùng trong đường dẫn trang cá nhân.</div>
        </div>
        <div className="form-field">
          <label htmlFor="pf-displayName">Tên hiển thị</label>
          <input
            id="pf-displayName"
            value={values.displayName}
            placeholder={user.username}
            aria-invalid={Boolean(errors.displayName)}
            onChange={(e) => set('displayName', e.target.value)}
          />
          {errors.displayName ? (
            <div className="field-error">{errors.displayName}</div>
          ) : (
            <div className="field-hint">
              Để trống thì hiện tên đăng nhập · {values.displayName.trim().length}/{LIMITS.displayName}
            </div>
          )}
        </div>
        <div className="form-field">
          <label htmlFor="pf-bio">Giới thiệu</label>
          <textarea
            id="pf-bio"
            rows={4}
            value={values.bio}
            aria-invalid={Boolean(errors.bio)}
            onChange={(e) => set('bio', e.target.value)}
          />
          {errors.bio ? (
            <div className="field-error">{errors.bio}</div>
          ) : (
            <div className="field-hint">
              {values.bio.length}/{LIMITS.bio}
            </div>
          )}
        </div>
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu…' : 'Lưu'}
          </button>
          <Link to={`/u/${user.username}`} className="btn btn-ghost">
            Xem trang cá nhân
          </Link>
        </div>
      </form>
    </div>
  );
}
