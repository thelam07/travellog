import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PostAccessGuard } from '../common/guards/post-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LikesService } from './likes.service';

/**
 * C4: POST và DELETE /api/posts/:id/likes (BR02, BR20).
 * - JwtAuthGuard: Bắt buộc đăng nhập.
 * - RolesGuard + @Roles('member'): Chặn admin tương tác (BR20).
 * - PostAccessGuard: Trả 404 nếu không tìm thấy hoặc không xem được bài viết (BR01, BR10).
 */
@Controller('posts/:id/likes')
@UseGuards(JwtAuthGuard, RolesGuard, PostAccessGuard)
@Roles('member')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  like(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.likesService.like(user, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  unlike(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.likesService.unlike(user, id);
  }
}
