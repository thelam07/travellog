import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Like, LikeDocument } from './schemas/like.schema';

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * BR02: Mỗi người chỉ thích một bài một lần. likeCount tăng bằng $inc.
   * BR08: Tạo thông báo cho chủ bài khi có người khác thích.
   */
  async like(user: AuthUser, postId: string) {
    if (!isValidObjectId(postId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

    // 1. Tạo bản ghi like; bắt lỗi trùng unique index { user: 1, post: 1 }
    try {
      await this.likeModel.create({
        user: new Types.ObjectId(user.id),
        post: new Types.ObjectId(postId),
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException({
          code: 'ALREADY_LIKED',
          message: 'Bạn đã thích bài viết này rồi',
        });
      }
      throw err;
    }

    // 2. Tăng likeCount bằng $inc
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: 1 } },
      { new: true },
    );

    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

    // 3. Thông báo khi có người thích (BR08)
    // NotificationsService.notify tự bỏ qua khi tự thích bài mình và không tạo thông báo trùng khi thích lại
    await this.notificationsService.notify({
      recipient: String(post.author),
      actor: user.id,
      type: 'like',
      post: String(post._id),
    });

    return {
      liked: true,
      likeCount: post.likeCount,
    };
  }

  /**
   * Bỏ thích: xoá bản ghi like, giảm likeCount bằng $inc.
   * Bỏ thích thì không xoá thông báo cũ.
   */
  async unlike(user: AuthUser, postId: string) {
    if (!isValidObjectId(postId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

    // Xoá like; nếu không có bản ghi thì báo 404 NOT_LIKED
    const deleted = await this.likeModel.findOneAndDelete({
      user: new Types.ObjectId(user.id),
      post: new Types.ObjectId(postId),
    });

    if (!deleted) {
      throw new NotFoundException({
        code: 'NOT_LIKED',
        message: 'Bạn chưa thích bài viết này',
      });
    }

    // Giảm likeCount bằng $inc
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: -1 } },
      { new: true },
    );

    const likeCount = post ? Math.max(0, post.likeCount) : 0;

    return {
      liked: false,
      likeCount,
    };
  }
}
