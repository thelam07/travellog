import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators';
import { OptionalJwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FollowsService } from '../follows/follows.service';
import { User } from './schemas/user.schema';
import { toUserSummary } from './user.mapper';

// Route cố định (/users/me…) phải khai báo trước /users/:username (mục 6). Sửa hồ sơ, avatar: việc sau của A.
@Controller('users')
@UseGuards(OptionalJwtAuthGuard)
export class UsersController {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly follows: FollowsService,
  ) {}

  // F04: khách xem được; có token thì biết mình đã theo dõi chưa.
  @Get(':username')
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
  async followers(@Param('username') username: string, @Query('cursor') cursor?: string, @CurrentUser() viewer?: AuthUser) {
    const user = await this.findVisible(username, viewer);
    return this.follows.listUsers(user._id, 'followers', cursor);
  }

  @Get(':username/following')
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
