import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/auth-user';
import { User } from '../users/schemas/user.schema';

export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
}

// Dùng chung cho REST (JwtStrategy) và Socket.IO (NotificationsGateway, N03).
export async function loadSessionUser(users: Model<User>, payload: JwtPayload): Promise<AuthUser> {
  const user = await users.findById(payload.sub).select('username role isLocked passwordChangedAt').lean();
  if (!user) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Tài khoản không tồn tại' });
  if (user.isLocked) throw new ForbiddenException({ code: 'ACCOUNT_LOCKED', message: 'Tài khoản đã bị khoá' });
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
  }
  return { id: String(user._id), username: user.username, role: user.role };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Đọc lại user từ DB mỗi request: khoá → 403 (BR09), đổi mật khẩu → token cũ 401, role lấy từ DB (BR11).
  validate(payload: JwtPayload): Promise<AuthUser> {
    return loadSessionUser(this.users, payload);
  }
}
