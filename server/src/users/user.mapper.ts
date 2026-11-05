import { Types } from 'mongoose';
import { Avatar, User } from './schemas/user.schema';

type UserLike = Partial<User> & { _id: Types.ObjectId | string };

// Dữ liệu trả về client: không bao giờ có passwordHash, passwordChangedAt.
export function toUser(u: UserLike) {
  return {
    _id: String(u._id),
    username: u.username,
    email: u.email,
    displayName: u.displayName || u.username,
    bio: u.bio ?? '',
    avatar: (u.avatar as Avatar | null) ?? null,
    role: u.role,
    isLocked: !!u.isLocked,
    createdAt: u.createdAt,
  };
}

export function toUserSummary(u: UserLike | null | undefined) {
  if (!u) return null;
  return {
    _id: String(u._id),
    username: u.username,
    displayName: u.displayName || u.username,
    avatar: (u.avatar as Avatar | null) ?? null,
  };
}
