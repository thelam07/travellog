import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usersApi } from '../api/users';
import { parseError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  userId: string;
  isFollowing: boolean;
  onChange?: (isFollowing: boolean) => void;
}

/** F08. Ẩn với chính mình và admin (BR04, BR20); khách bấm thì về trang đăng nhập rồi quay lại. */
export default function FollowButton({ userId, isFollowing, onChange }: Props) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAdmin || user?._id === userId) return null;

  const toggle = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = following ? await usersApi.unfollow(userId) : await usersApi.follow(userId);
      setFollowing(res.following);
      onChange?.(res.following);
    } catch (err) {
      const e = parseError(err);
      // 409 = đã theo dõi rồi (vd. bấm ở tab khác) → đồng bộ lại giao diện
      if (e.status === 409) {
        setFollowing(true);
        onChange?.(true);
      } else setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="follow-btn">
      <button
        type="button"
        className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`}
        disabled={loading}
        onClick={toggle}
      >
        {loading ? '…' : following ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
      {error && <span className="field-error">{error}</span>}
    </span>
  );
}
