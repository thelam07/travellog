import { BadRequestException, ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { Role } from '../common/auth-user';
import { RESERVED_USERNAMES } from '../auth/dto/auth.dto';
import { escapeRegex, normalizeKey } from '../common/utils/text';
import { User, USER_SUMMARY_FIELDS, UserDocument, userSearchKey } from './schemas/user.schema';
import { toUserSummary } from './user.mapper';

const SEARCH_LIMIT = 10;

export interface NewUserInput {
  username: string;
  email: string;
  password: string;
  role: Role;
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async onModuleInit() {
    await Promise.all([this.backfillSearchKeys(), this.ensureOwner()]);
  }

  // Tài khoản tạo trước khi có searchKey: tính bù một lần lúc khởi động.
  private async backfillSearchKeys() {
    const missing = await this.users
      .find({ $or: [{ searchKey: { $exists: false } }, { searchKey: '' }] })
      .select('username displayName')
      .lean();
    if (!missing.length) return;
    await this.users.bulkWrite(
      missing.map((u) => ({
        updateOne: { filter: { _id: u._id }, update: { $set: { searchKey: userSearchKey(u.displayName, u.username) } } },
      })),
    );
  }

  // DB có từ trước khi có admin gốc: admin tạo sớm nhất (thường là tài khoản seed:admin) thành admin gốc.
  async ensureOwner() {
    if (await this.users.exists({ isOwner: true })) return;
    const first = await this.users.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select('_id').lean();
    if (first) await this.users.updateOne({ _id: first._id }, { isOwner: true });
  }

  /**
   * Tìm thành viên theo đầu một từ trong tên hiển thị hoặc username, không phân biệt dấu ("@lan", "lan nguyen", "Nguyễn").
   * Ẩn tài khoản bị khoá (BR09) và admin (không có trang cá nhân để theo dõi).
   */
  async search(q: string) {
    const key = normalizeKey(q.replace(/^@+/, ''));
    if (!key) return [];
    const docs = await this.users
      .find({ searchKey: { $regex: `(^| )${escapeRegex(key)}` }, isLocked: false, role: 'member' })
      .select(USER_SUMMARY_FIELDS)
      .sort({ username: 1 })
      .limit(SEARCH_LIMIT)
      .lean();
    return docs.map((u) => toUserSummary(u));
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Báo trùng theo từng trường để form hiện lỗi đúng chỗ (UC01, UC16).
  async create(input: NewUserInput, options: { allowReserved?: boolean } = {}): Promise<UserDocument> {
    if (!options.allowReserved && RESERVED_USERNAMES.includes(input.username)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        details: { username: ['Username này không được dùng'] },
      });
    }
    const details: Record<string, string[]> = {};
    if (await this.users.exists({ email: input.email })) details.email = ['Email đã được dùng'];
    if (await this.users.exists({ username: input.username })) details.username = ['Username đã được dùng'];
    if (Object.keys(details).length) {
      throw new ConflictException({ code: 'DUPLICATE', message: 'Email hoặc username đã tồn tại', details });
    }
    return this.users.create({
      username: input.username,
      email: input.email,
      displayName: input.username,
      passwordHash: await this.hashPassword(input.password),
      role: input.role,
    });
  }

  findByEmailWithPassword(email: string) {
    return this.users.findOne({ email }).select('+passwordHash');
  }

  // BR11: ghi lại thời điểm đổi để token phát trước đó bị từ chối.
  async setPassword(userId: string, password: string): Promise<Date> {
    const changedAt = new Date();
    await this.users.updateOne(
      { _id: userId },
      { passwordHash: await this.hashPassword(password), passwordChangedAt: changedAt },
    );
    return changedAt;
  }
}
