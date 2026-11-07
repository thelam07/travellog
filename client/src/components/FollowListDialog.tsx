import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { usersApi } from '../api/users';
import { parseError } from '../api/client';
import type { UserSummary } from '../types';
import UserInitial from './UserInitial';

interface Props {
  username: string;
  kind: 'followers' | 'following';
  onClose: () => void;
}

/** Danh sách người theo dõi / đang theo dõi, tải thêm bằng con trỏ. */
export default function FollowListDialog({ username, kind, onClose }: Props) {
  const [items, setItems] = useState<UserSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (from: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const fetch = kind === 'followers' ? usersApi.followers : usersApi.following;
      const page = await fetch(username, from);
      setItems((prev) => (from ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [username, kind]);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h2>{kind === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <ul className="user-list">
          {items.map((u) => (
            <li key={u._id}>
              <Link to={`/u/${u.username}`} onClick={onClose} className="user-row">
                <UserInitial user={u} size={36} />
                <span>
                  <strong>{u.displayName || u.username}</strong>
                  <span className="muted small"> @{u.username}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {loading && <p className="muted">Đang tải…</p>}
        {!loading && !error && items.length === 0 && <p className="muted">Chưa có ai.</p>}
        {hasMore && !loading && items.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => load(cursor)}>
            Xem thêm
          </button>
        )}
      </div>
    </div>
  );
}
