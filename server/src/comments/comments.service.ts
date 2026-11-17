import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { CURSOR_SORT, cursorFilter, toCursorPage } from '../common/utils/cursor';
import { NotificationsService } from '../notifications/notifications.service';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { toUserSummary } from '../users/user.mapper';
import { CreateCommentDto } from './dto/comment.dto';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  private formatComment(c: any) {
    return {
      _id: String(c._id),
      post: String(c.post),
      author: toUserSummary(c.author),
      parent: c.parent ? String(c.parent) : null,
      content: c.content,
      createdAt: c.createdAt,
      replies: c.replies ?? [],
    };
  }

  async getComments(post: PostDocument, cursor?: string, viewer?: AuthUser) {
    const rootFilter: Record<string, unknown> = {
      post: post._id,
      parent: null,
    };
    if (viewer?.role !== 'admin') {
      rootFilter.authorLocked = { $ne: true };
    }

    const cur = cursorFilter(cursor);
    const query = Object.keys(cur).length > 0 ? { $and: [rootFilter, cur] } : rootFilter;

    const rootDocs = await this.commentModel
      .find(query)
      .sort(CURSOR_SORT)
      .limit(10 + 1)
      .populate('author', 'username displayName avatar')
      .lean()
      .exec();

    const page = toCursorPage(rootDocs as any, 10);
    if (page.items.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const rootIds = page.items.map((c) => c._id);
    const repliesFilter: Record<string, unknown> = {
      post: post._id,
      parent: { $in: rootIds },
    };
    if (viewer?.role !== 'admin') {
      repliesFilter.authorLocked = { $ne: true };
    }

    const replyDocs = await this.commentModel
      .find(repliesFilter)
      .sort({ createdAt: 1, _id: 1 })
      .populate('author', 'username displayName avatar')
      .lean()
      .exec();

    const repliesByParent = new Map<string, any[]>();
    for (const r of replyDocs) {
      const pid = String(r.parent);
      if (!repliesByParent.has(pid)) {
        repliesByParent.set(pid, []);
      }
      repliesByParent.get(pid)!.push(this.formatComment(r));
    }

    const items = page.items.map((root) => {
      const formatted = this.formatComment(root);
      formatted.replies = repliesByParent.get(String(root._id)) ?? [];
      return formatted;
    });

    return {
      items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  async createComment(post: PostDocument, user: AuthUser, dto: CreateCommentDto) {
    let resolvedParent: Types.ObjectId | null = null;
    if (dto.parentId) {
      if (!isValidObjectId(dto.parentId)) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bình luận cha' });
      }
      const parent = await this.commentModel.findById(dto.parentId).exec();
      if (!parent || String(parent.post) !== String(post._id)) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bình luận cha' });
      }
      resolvedParent = parent.parent ? parent.parent : parent._id;
    }

    const comment = await this.commentModel.create({
      post: post._id,
      author: new Types.ObjectId(user.id),
      parent: resolvedParent,
      content: dto.content,
    });

    await this.postModel.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

    await this.notifications.notify({
      recipient: String(post.author),
      actor: user.id,
      type: 'comment',
      post: String(post._id),
    });

    const populated = await this.commentModel
      .findById(comment._id)
      .populate('author', 'username displayName avatar')
      .lean()
      .exec();

    return this.formatComment(populated);
  }

  async deleteComment(id: string, user: AuthUser) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bình luận' });
    }

    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy bình luận' });
    }

    const post = await this.postModel.findById(comment.post).exec();
    const isCommentAuthor = String(comment.author) === user.id;
    const isPostAuthor = post && String(post.author) === user.id;
    const isAdmin = user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Bạn không có quyền xoá bình luận này' });
    }

    const res = await this.commentModel.deleteMany({
      $or: [{ _id: comment._id }, { parent: comment._id }],
    });

    const deleted = res.deletedCount;
    if (deleted > 0 && post) {
      await this.postModel.updateOne(
        { _id: post._id },
        { $inc: { commentCount: -deleted } },
      );
    }

    return { deleted };
  }

  async setAuthorLocked(userId: string, locked: boolean) {
    if (!isValidObjectId(userId)) return;
    await this.commentModel.updateMany(
      { author: new Types.ObjectId(userId) },
      { $set: { authorLocked: locked } },
    );
  }
}
