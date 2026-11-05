import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Bắt buộc token hợp lệ. Lỗi từ JwtStrategy.validate (khoá → 403) được ném nguyên vẹn.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: unknown, user: T): T {
    if (err) throw err;
    if (!user) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Bạn cần đăng nhập' });
    return user;
  }
}

// Có token thì gắn req.user, không có (hoặc token hỏng) vẫn cho qua như khách.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: unknown, user: T): T {
    if (err) throw err;
    return (user || undefined) as T;
  }
}
