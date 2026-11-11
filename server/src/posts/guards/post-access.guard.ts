import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { AuthRequest } from '../../common/auth-user';
import { PostsService } from '../posts.service';

// Đặt sau JwtAuthGuard hoặc OptionalJwtAuthGuard. Đọc :id, kiểm tra quyền xem theo BR01/BR09/BR10.
// Mọi trường hợp thất bại (id sai định dạng / không tồn tại / không có quyền) đều trả 404 để
// không lộ bài có tồn tại hay không. Bài hợp lệ được gắn vào req.post để controller lấy bằng @AccessiblePost().
@Injectable()
export class PostAccessGuard implements CanActivate {
  constructor(private readonly posts: PostsService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthRequest & { post?: any }>();
    const id = req.params?.id as string | undefined;
    if (!id || !isValidObjectId(id)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }
    const viewer = req.user;
    const post = await this.posts.findOneForViewer(id, viewer);
    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }
    req.post = post;
    return true;
  }
}
