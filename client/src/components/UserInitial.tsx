import type { UserSummary } from '../types';

/** Ảnh đại diện tạm: có avatar thì hiện ảnh, không thì chữ cái đầu. Khi C xong Avatar thì thay bằng component đó. */
export default function UserInitial({ user, size = 40 }: { user: UserSummary; size?: number }) {
  const name = user.displayName || user.username;
  return user.avatar ? (
    <img className="user-initial" src={user.avatar.url} alt={name} width={size} height={size} />
  ) : (
    <span className="user-initial" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
