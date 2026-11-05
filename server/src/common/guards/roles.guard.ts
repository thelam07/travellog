import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRequest, Role } from '../auth-user';
import { ROLES_KEY } from '../decorators';

// Đặt sau JwtAuthGuard. @Roles('member') chặn admin tương tác (BR20), @Roles('admin') cho trang quản trị.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest<AuthRequest>().user;
    if (user && roles.includes(user.role)) return true;
    throw new ForbiddenException({
      code: 'FORBIDDEN_ROLE',
      message: roles.includes('admin')
        ? 'Chỉ admin được thực hiện thao tác này'
        : 'Tài khoản admin chỉ dùng để quản trị, không tương tác được',
    });
  }
}
