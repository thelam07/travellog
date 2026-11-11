import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Post, PostDocument } from '../../posts/schemas/post.schema';

/**
 * BR01, BR10, BR20: PostAccessGuard
 * Tạm thời kiểm tra bài viết tồn tại và trạng thái (active) trước khi B6 hoàn thiện visibilityFilter.
 * Không tìm thấy hoặc bài bị ẩn / tác giả bị khoá -> trả 404 (không làm lộ sự tồn tại của bài).
 */
@Injectable()
export class PostAccessGuard implements CanActivate {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<PostDocument>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const postId = req.params.id;

    if (!postId || !isValidObjectId(postId)) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Không tìm thấy bài viết',
      });
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Không tìm thấy bài viết',
      });
    }

    // BR10 & BR09: Bài bị admin ẩn hoặc tác giả bị khoá -> chỉ tác giả hoặc admin mới xem được
    if (post.status === 'hidden' || post.authorLocked) {
      const user = (req as any).user;
      const isAuthor = user && String(post.author) === user.id;
      const isAdmin = user && user.role === 'admin';
      if (!isAuthor && !isAdmin) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'Không tìm thấy bài viết',
        });
      }
    }

    // Gắn post vào req để controller/service tái sử dụng nếu cần
    (req as any).post = post;
    return true;
  }
}
