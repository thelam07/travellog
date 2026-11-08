import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { StorageService } from '../common/storage/storage.service';
import { FollowsService } from '../follows/follows.service';
import { User } from './schemas/user.schema';
import { toUser, toUserSummary } from './user.mapper';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// F10. Username, email, role không có trong DTO nên whitelist bỏ đi, không sửa được qua đây.
class UpdateProfileDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(50, { message: 'Tên hiển thị tối đa 50 kí tự' }) displayName?: string;
  @IsOptional() @IsString() @MaxLength(200, { message: 'Giới thiệu tối đa 200 kí tự' }) bio?: string;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
// Cùng luật ảnh với bài viết (BR05): JPG, PNG, WebP ≤ 5 MB. FileTypeValidator đọc nội dung file, không tin đuôi file.
const avatarPipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_AVATAR_SIZE }),
    new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
  ],
  exceptionFactory: (error) =>
    /required/i.test(error)
      ? new BadRequestException({ code: 'FILE_REQUIRED', message: 'Hãy chọn một ảnh', details: { avatar: ['Hãy chọn một ảnh'] } })
      : new BadRequestException({
          code: 'INVALID_FILE_TYPE',
          message: 'Ảnh đại diện phải là JPG, PNG hoặc WebP, tối đa 5 MB',
          details: { avatar: ['Chỉ nhận JPG, PNG, WebP ≤ 5 MB'] },
        }),
});

// Route cố định (/users/me…) phải khai báo trước /users/:username (mục 6).
@Controller('users')
export class UsersController {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly follows: FollowsService,
    private readonly storage: StorageService,
  ) {}

  // Tên hiển thị để trống thì hiện username (toUser).
  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('member')
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const updated = await this.users.findByIdAndUpdate(user.id, dto, { returnDocument: 'after', runValidators: true }).lean();
    if (!updated) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản' });
    return toUser(updated);
  }

  // F10. Lưu ảnh mới trước, cập nhật user, rồi mới xoá ảnh cũ: lỗi giữa chừng thì không mất ảnh đang dùng.
  @Put('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('member')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: MAX_AVATAR_SIZE, files: 1 } }))
  async updateAvatar(@CurrentUser() user: AuthUser, @UploadedFile(avatarPipe) file: Express.Multer.File) {
    const old = await this.users.findById(user.id).select('avatar').lean();
    const stored = await this.storage.upload(file, 'avatars');
    const updated = await this.users
      .findByIdAndUpdate(user.id, { avatar: { url: stored.url, publicId: stored.publicId } }, { returnDocument: 'after' })
      .lean();
    if (!updated) {
      await this.storage.remove(stored.publicId);
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy tài khoản' });
    }
    if (old?.avatar) await this.storage.remove(old.avatar.publicId);
    return toUser(updated);
  }

  // F04: khách xem được; có token thì biết mình đã theo dõi chưa.
  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  async profile(@Param('username') username: string, @CurrentUser() viewer?: AuthUser) {
    const user = await this.findVisible(username, viewer);
    const [followerCount, followingCount, isFollowing] = await Promise.all([
      this.follows.countFollowers(user._id),
      this.follows.countFollowing(user._id),
      viewer ? this.follows.isFollowing(viewer.id, String(user._id)) : false,
    ]);
    return {
      ...toUserSummary(user),
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      // B: thay bằng số bài người xem được thấy (theo bộ lọc BR01) khi có PostsService.
      postCount: 0,
      followerCount,
      followingCount,
      isFollowing,
      ...(viewer?.role === 'admin' && { isLocked: user.isLocked }),
    };
  }

  @Get(':username/followers')
  @UseGuards(OptionalJwtAuthGuard)
  async followers(@Param('username') username: string, @Query('cursor') cursor?: string, @CurrentUser() viewer?: AuthUser) {
    const user = await this.findVisible(username, viewer);
    return this.follows.listUsers(user._id, 'followers', cursor);
  }

  @Get(':username/following')
  @UseGuards(OptionalJwtAuthGuard)
  async following(@Param('username') username: string, @Query('cursor') cursor?: string, @CurrentUser() viewer?: AuthUser) {
    const user = await this.findVisible(username, viewer);
    return this.follows.listUsers(user._id, 'following', cursor);
  }

  // Tài khoản bị khoá chỉ admin còn thấy (BR09).
  private async findVisible(username: string, viewer?: AuthUser) {
    const user = await this.users.findOne({ username: username.toLowerCase() }).lean();
    if (!user || (user.isLocked && viewer?.role !== 'admin')) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Không tìm thấy người dùng' });
    }
    return user;
  }
}
