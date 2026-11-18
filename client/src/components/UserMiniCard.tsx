// client/src/components/UserMiniCard.tsx
// (A – E01) Một dòng người dùng: avatar, tên hiển thị, @username, bấm vào tới trang cá nhân.

import { Link } from 'react-router';
import type { UserSummary } from '../types';
import { Avatar } from './Avatar';

export default function UserMiniCard({ user }: { user: UserSummary }) {
  return (
    <Link to={`/u/${user.username}`} className="user-mini">
      <Avatar user={user} size="sm" />
      <span className="user-mini-text">
        <strong>{user.displayName || user.username}</strong>
        <span className="muted small">@{user.username}</span>
      </span>
    </Link>
  );
}
