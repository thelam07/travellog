import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { AuthRequest } from '../../common/auth-user';
import { PostDocument } from '../schemas/post.schema';
import { PostsService } from '../posts.service';

@Injectable()
export class PostAccessGuard implements CanActivate {
  constructor(private readonly posts: PostsService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthRequest & { post?: PostDocument }>();
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
