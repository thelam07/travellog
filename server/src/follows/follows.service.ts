import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CURSOR_SORT, cursorFilter, toCursorPage } from '../common/utils/cursor';
import { NotificationsService } from '../notifications/notifications.service';
import { User, USER_SUMMARY_FIELDS } from '../users/schemas/user.schema';
import { toUserSummary } from '../users/user.mapper';
import { Follow } from './schemas/follow.schema';

const PAGE_SIZE = 20;

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private readonly follows: Model<Follow>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly notifications: NotificationsService,
  ) {}

  // B dùng cho bộ lọc quyền xem bài (BR01), C dùng cho bảng tin (BR12).
  async followingIds(userId: string): Promise<Types.ObjectId[]> {
    const rows = await this.follows.find({ follower: userId }).select('following').lean();
    return rows.map((r) => r.following);
  }

  async isFollowing(follower: string, following: string): Promise<boolean> {
    return !!(await this.follows.exists({ follower, following }));
  }

  countFollowers(userId: Types.ObjectId | string) {
    return this.follows.countDocuments({ following: userId });
  }

  countFollowing(userId: Types.ObjectId | string) {
    return this.follows.countDocuments({ follower: userId });
  }

  // BR04: không tự theo dõi, không theo dõi hai lần (unique index → 409). Chỉ theo dõi được thành viên đang hoạt động.
  async follow(me: string, targetId: string) {
    if (me === targetId) {
      throw new BadRequestException({ code: 'FOLLOW_SELF', message: 'Không thể tự theo dõi chính mình' });
    }
    const target = isValidObjectId(targetId)
      ? await this.users.findOne({ _id: targetId, role: 'member', isLocked: false }).select('_id').lean()
      : null;
    if (!target) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy người dùng' });
    try {
      await this.follows.create({ follower: me, following: targetId });
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException({ code: 'ALREADY_FOLLOWING', message: 'Bạn đã theo dõi người này' });
      throw e;
    }
    await this.notifications.notify({ recipient: targetId, actor: me, type: 'follow' });
    return { following: true };
  }

  async unfollow(me: string, targetId: string) {
    const r = isValidObjectId(targetId) ? await this.follows.deleteOne({ follower: me, following: targetId }) : null;
    if (!r?.deletedCount) throw new NotFoundException({ code: 'NOT_FOLLOWING', message: 'Bạn chưa theo dõi người này' });
    return { following: false };
  }

  // Danh sách người theo dõi / đang theo dõi, mới nhất trước, bỏ tài khoản bị khoá (BR09).
  async listUsers(userId: Types.ObjectId, direction: 'followers' | 'following', cursor?: string) {
    const [match, other] = direction === 'followers' ? ['following', 'follower'] : ['follower', 'following'];
    const docs = await this.follows
      .find({ [match]: userId, ...cursorFilter(cursor) })
      .sort(CURSOR_SORT)
      .limit(PAGE_SIZE + 1)
      .populate(other, `${USER_SUMMARY_FIELDS} isLocked`)
      .lean();
    const page = toCursorPage(docs, PAGE_SIZE);
    const items = page.items
      .map((f: any) => f[other])
      .filter((u: any) => u && !u.isLocked)
      .map(toUserSummary);
    return { ...page, items };
  }
}
