import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { Role } from '../common/auth-user';
import { RESERVED_USERNAMES } from '../auth/dto/auth.dto';
import { User, UserDocument } from './schemas/user.schema';

export interface NewUserInput {
  username: string;
  email: string;
  password: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

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
