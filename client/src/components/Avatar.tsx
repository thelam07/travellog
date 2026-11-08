import type { UserSummary } from '../types';

interface AvatarProps {
  user: UserSummary;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ user, size = 'md' }: AvatarProps) {
  const initial = user?.displayName ? user.displayName.trim().charAt(0).toUpperCase() : '?';

  if (user?.avatar?.url) {
    return (
      <div className={`avatar-wrap avatar-${size}`}>
        <img src={user.avatar.url} alt={user.displayName} className="avatar-img" />
      </div>
    );
  }

  return (
    <div className={`avatar-wrap avatar-${size}`}>
      {initial}
    </div>
  );
}