// client/src/components/Avatar.tsx
import type { UserSummary } from '../types';

export interface AvatarProps {
  user: UserSummary;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ user, size = 'md' }: AvatarProps) {
  // Ưu tiên displayName, nếu không có thì dùng username
  const nameToUse = user.displayName || user.username || '';
  const initial = nameToUse.trim().charAt(0).toUpperCase();

  if (user.avatar?.url) {
    return (
      <div className={`avatar-wrap avatar-${size}`}>
        <img src={user.avatar.url} alt={nameToUse} className="avatar-img" />
      </div>
    );
  }

  return (
    <div className={`avatar-wrap avatar-${size}`}>
      {initial}
    </div>
  );
}