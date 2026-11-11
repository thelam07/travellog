import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../../common/auth-user';
import { PostDocument } from '../schemas/post.schema';

// Lấy bài viết mà PostAccessGuard đã gắn vào req.post. Dùng sau @UseGuards(PostAccessGuard).
export const AccessiblePost = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PostDocument => ctx.switchToHttp().getRequest<AuthRequest & { post: PostDocument }>().post,
);
