import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CURSOR_SORT, cursorFilter, toCursorPage } from '../common/utils/cursor';
import { USER_SUMMARY_FIELDS } from '../users/schemas/user.schema';
import { toUserSummary } from '../users/user.mapper';
import { NotificationsGateway } from './notifications.gateway';
import { Notification, NotificationType } from './schemas/notification.schema';

const PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notifications: Model<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * BR08. C gọi khi thích / bình luận (kèm post), A gọi khi theo dõi.
   * Không báo khi tự tương tác. Thích / theo dõi lại sau khi bỏ thì làm mới thông báo cũ thay vì tạo bản trùng.
   */
  async notify(input: { recipient: string; actor: string; type: NotificationType; post?: string | null }) {
    if (input.recipient === input.actor) return;
    const key = {
      recipient: new Types.ObjectId(input.recipient),
      actor: new Types.ObjectId(input.actor),
      type: input.type,
      post: input.post ? new Types.ObjectId(input.post) : null,
    };
    const doc =
      input.type === 'comment'
        ? await this.notifications.create(key)
        : await this.notifications.findOneAndUpdate(
            key,
            { $set: { isRead: false, createdAt: new Date() } },
            // Mongoose coi createdAt là immutable và bỏ qua khi cập nhật; overwriteImmutable để thông báo nhảy lên đầu.
            { upsert: true, timestamps: false, overwriteImmutable: true, returnDocument: 'after' },
          );
    // Không chờ: lỗi gửi socket không được làm hỏng thao tác thích / bình luận / theo dõi.
    this.push(input.recipient, String(doc!._id)).catch(() => undefined);
  }

  // N03: đẩy thông báo kèm số chưa đọc cho người nhận (like lặp lại chỉ làm mới bản cũ nên client không tự cộng được).
  private async push(recipient: string, id: string) {
    const [n, unread] = await Promise.all([this.withRefs(this.notifications.findById(id)).lean(), this.unreadCount(recipient)]);
    if (n) this.gateway.emitToUser(recipient, 'notification', { notification: this.toDto(n), unreadCount: unread.count });
  }

  async list(userId: string, cursor?: string) {
    const docs = await this.withRefs(
      this.notifications.find({ recipient: userId, ...cursorFilter(cursor) }).sort(CURSOR_SORT).limit(PAGE_SIZE + 1),
    ).lean();
    const page = toCursorPage(docs, PAGE_SIZE);
    return { ...page, items: page.items.map((n) => this.toDto(n)) };
  }

  unreadCount(userId: string) {
    return this.notifications.countDocuments({ recipient: userId, isRead: false }).then((count) => ({ count }));
  }

  async markRead(userId: string, id: string) {
    const n = isValidObjectId(id) ? await this.notifications.findById(id) : null;
    if (!n) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy thông báo' });
    if (String(n.recipient) !== userId) {
      throw new ForbiddenException({ code: 'NOT_OWNER', message: 'Không phải thông báo của bạn' });
    }
    n.isRead = true;
    await n.save();
    const doc = await this.withRefs(this.notifications.findById(id)).lean();
    return this.toDto(doc);
  }

  async markAllRead(userId: string) {
    const r = await this.notifications.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    return { updated: r.modifiedCount };
  }

  // Lấy kèm người tạo thông báo và tiêu đề bài. Model Post do B đăng ký; chưa có thì bỏ qua để không lỗi.
  private withRefs<T>(query: T): T {
    const q = (query as any).populate('actor', USER_SUMMARY_FIELDS);
    return this.notifications.db.models.Post ? q.populate('post', 'title') : q;
  }

  private toDto(n: any) {
    const post = n.post && typeof n.post === 'object' && 'title' in n.post ? n.post : null;
    return {
      _id: String(n._id),
      actor: toUserSummary(n.actor),
      type: n.type,
      // Bài đã bị xoá thì populate trả null
      post: post ? { _id: String(post._id), title: post.title } : null,
      isRead: n.isRead,
      createdAt: n.createdAt,
    };
  }
}
