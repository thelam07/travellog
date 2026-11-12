import { useRef, useState, type ChangeEvent } from 'react';
import { parseError } from '../api/client';
import { usersApi } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './Avatar';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

// F10. Chọn ảnh là tải lên ngay; server kiểm tra lại loại và dung lượng (BR05).
export default function AvatarPicker() {
  const { user, setUser } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // chọn lại đúng file đó vẫn kích hoạt onChange
    if (!file) return;
    if (!TYPES.includes(file.type) || file.size > MAX_SIZE) {
      setMessage({ type: 'error', text: 'Chỉ nhận ảnh JPG, PNG, WebP, tối đa 5 MB.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      setUser(await usersApi.updateAvatar(file)); // header cập nhật ngay
      setMessage({ type: 'success', text: 'Đã đổi ảnh đại diện.' });
    } catch (err) {
      setMessage({ type: 'error', text: parseError(err).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="avatar-picker">
      <Avatar user={user} size="lg" />
      <div className="stack">
        <input ref={input} type="file" accept={TYPES.join(',')} hidden onChange={pick} />
        <button type="button" className="btn btn-secondary" disabled={loading} onClick={() => input.current?.click()}>
          {loading ? 'Đang tải lên…' : 'Đổi ảnh đại diện'}
        </button>
        <div className="field-hint">JPG, PNG hoặc WebP, tối đa 5 MB.</div>
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      </div>
    </div>
  );
}
