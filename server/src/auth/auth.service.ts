import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { toUser } from '../users/user.mapper';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  // BR11: token chỉ chứa userId và role.
  private issue(user: UserDocument) {
    return { token: this.jwt.sign({ sub: String(user._id), role: user.role }), user: toUser(user.toObject()) };
  }

  // BR18: đăng ký công khai luôn là member.
  async register(dto: RegisterDto) {
    const user = await this.usersService.create({ ...dto, role: 'member' });
    return this.issue(user);
  }

  // Sai email hay sai mật khẩu đều báo chung một câu, không lộ email nào đã có tài khoản.
  // BR20: 'site' (/auth/login) chỉ nhận member, 'admin' (/auth/admin/login) chỉ nhận admin.
  async login(dto: LoginDto, area: 'site' | 'admin') {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng' });
    }
    if (user.isLocked) throw new ForbiddenException({ code: 'ACCOUNT_LOCKED', message: 'Tài khoản đã bị khoá' });
    if (area === 'site' && user.role === 'admin') {
      throw new ForbiddenException({ code: 'ADMIN_USE_ADMIN_LOGIN', message: 'Tài khoản admin đăng nhập ở trang /admin/login' });
    }
    if (area === 'admin' && user.role !== 'admin') {
      throw new ForbiddenException({ code: 'NOT_ADMIN', message: 'Tài khoản không có quyền quản trị' });
    }
    return this.issue(user);
  }

  async me(userId: string) {
    const user = await this.users.findById(userId).lean();
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản' });
    return toUser(user);
  }

  // BR19 + BR11: đổi mật khẩu làm các token cũ hết hiệu lực, trả token mới cho phiên hiện tại.
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.users.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản' });
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException({
        code: 'WRONG_PASSWORD',
        message: 'Mật khẩu hiện tại không đúng',
        details: { currentPassword: ['Mật khẩu hiện tại không đúng'] },
      });
    }
    await this.usersService.setPassword(userId, dto.newPassword);
    return { token: this.jwt.sign({ sub: userId, role: user.role }) };
  }
}
