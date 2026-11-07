import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { AdminCreateUserDto } from '../auth/dto/auth.dto';
import { AuthUser, Role } from '../common/auth-user';
import { escapeRegex } from '../common/utils/text';
import { User } from '../users/schemas/user.schema';
import { toUser } from '../users/user.mapper';
import { UsersService } from '../users/users.service';

const PAGE_SIZE = 20;

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly usersService: UsersService,
  ) {}

  // F17. Tìm theo username hoặc email (escapeRegex của B2 để kí tự đặc biệt không làm lỗi), mới tạo trước.
  async list(q: string | undefined, page: number) {
    const term = q?.trim();
    const filter: QueryFilter<User> = term
      ? { $or: [{ username: { $regex: escapeRegex(term), $options: 'i' } }, { email: { $regex: escapeRegex(term), $options: 'i' } }] }
      : {};
    const [docs, total] = await Promise.all([
      this.users.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
      this.users.countDocuments(filter),
    ]);
    return { items: docs.map(toUser), page, limit: PAGE_SIZE, total };
  }

  // UC16, BR18: admin tạo được cả admin; username dành riêng (me, admin) vẫn bị chặn.
  async create(dto: AdminCreateUserDto) {
    const user = await this.usersService.create(dto);
    return toUser(user.toObject());
  }

  // UC17, F14. BR17: luôn còn ít nhất 1 admin đang hoạt động.
  async update(id: string, changes: { isLocked?: boolean; role?: Role }, admin: AuthUser) {
    const target = await this.users.findById(id).lean();
    if (!target) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy người dùng' });

    const selfChange = id === admin.id;
    if (selfChange && changes.isLocked) throw this.rule('Không thể tự khoá tài khoản của mình');
    if (selfChange && changes.role === 'member') throw this.rule('Không thể tự hạ quyền của mình');

    const losesActiveAdmin =
      target.role === 'admin' && !target.isLocked && (changes.isLocked === true || changes.role === 'member');
    if (losesActiveAdmin) {
      const others = await this.users.countDocuments({ _id: { $ne: target._id }, role: 'admin', isLocked: false });
      if (others === 0) throw this.rule('Hệ thống phải còn ít nhất 1 admin đang hoạt động');
    }

    // BR09: khoá có hiệu lực ngay vì JwtStrategy đọc lại isLocked mỗi request (token cũ → 403).
    const updated = await this.users.findByIdAndUpdate(id, changes, { returnDocument: 'after' }).lean();
    if (changes.isLocked !== undefined && changes.isLocked !== target.isLocked) {
      // Tuần 3: ẩn / hiện bài và bình luận của người này (BR09) khi B, C có hàm:
      // await Promise.all([this.posts.setAuthorLocked(id, changes.isLocked), this.comments.setAuthorLocked(id, changes.isLocked)]);
    }
    return toUser(updated!);
  }

  // UC18: đặt mật khẩu tạm; passwordChangedAt làm các phiên cũ của người đó hết hiệu lực (BR11).
  async resetPassword(id: string, newPassword: string) {
    if (!(await this.users.exists({ _id: id }))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy người dùng' });
    }
    await this.usersService.setPassword(id, newPassword);
    return { ok: true };
  }

  private rule(message: string) {
    return new BadRequestException({ code: 'ADMIN_RULE', message });
  }
}
