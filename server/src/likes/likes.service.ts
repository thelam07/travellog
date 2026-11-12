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

  async like(user: AuthUser, postId: string) {
    if (!isValidObjectId(postId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

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

    const post = await this.postModel.findByIdAndUpdate(
      postId,
      { $inc: { likeCount: 1 } },
      { new: true },
    );

    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

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

  async unlike(user: AuthUser, postId: string) {
    if (!isValidObjectId(postId)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' });
    }

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
