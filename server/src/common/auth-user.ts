import { Request } from 'express';

export type Role = 'member' | 'admin';

// Người đang gọi API, do JwtStrategy.validate dựng từ dữ liệu DB (BR11: role lấy từ DB).
export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export type AuthRequest = Request & { user?: AuthUser };
