import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { FollowsService } from '../../follows/follows.service';
import { Post, PostDocument } from '../schemas/post.schema';

@Injectable()
export class PostAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly followsService: FollowsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const postId = req.params.id;

    if (!postId || !isValidObjectId(postId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

    const user = req.user;
    const isAuthor = user && String(post.author) === user.id;
    const isAdmin = user && user.role === 'admin';

    if (post.status === 'hidden' || post.authorLocked) {
      if (!isAuthor && !isAdmin) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
      }
    }

    if (post.visibility === 'followers') {
      if (!isAuthor && !isAdmin) {
        if (!user) {
          throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
        }
        const following = await this.followsService.isFollowing(user.id, String(post.author));
        if (!following) {
          throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
        }
      }
    }

    (req as any).post = post;
    return true;
  }
}
