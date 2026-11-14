import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isValidObjectId } from 'mongoose';
import { AuthRequest } from '../auth-user';
import { PostDocument } from '../../posts/schemas/post.schema';
import { PostsService } from '../../posts/posts.service';

// Đặt sau JwtAuthGuard. Đọc :id, so sánh author với người gọi.
// - id sai định dạng / không tồn tại → 404 (không lộ bài có tồn tại hay không).
// - không phải chủ → 403.
// - tuỳ chọn cho admin qua (dùng cho DELETE — BR06: admin xoá được bài người khác).
// Bài hợp lệ được gắn vào req.post để controller lấy bằng @AccessiblePost().
export const ALLOW_ADMIN_KEY = 'ownershipAllowAdmin';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly posts: PostsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthRequest & { post?: PostDocument }>();
    const id = req.params?.id as string | undefined;
    if (!id || !isValidObjectId(id)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }
    // Tải bài không qua visibilityFilter: cần biết author để so sánh, kể cả khi bài hidden / authorLocked.
    const post = await this.posts.findByIdRaw(id);
    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }
    const user = req.user;
    if (!user) {
      // JwtAuthGuard đã chặn trước, nhưng đề phòng.
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' });
    }
    const allowAdmin = this.reflector.getAllAndOverride<boolean>(ALLOW_ADMIN_KEY, [ctx.getHandler(), ctx.getClass()]);
    const isOwner = String(post.author) === user.id;
    const isAdmin = user.role === 'admin' && allowAdmin;
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'Bạn không phải chủ bài viết này' });
    }
    req.post = post;
    return true;
  }
}
