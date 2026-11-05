import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { AuthRequest, AuthUser, Role } from '../auth-user';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | undefined => ctx.switchToHttp().getRequest<AuthRequest>().user,
);
