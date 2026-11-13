import { Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PostAccessGuard } from '../posts/guards/post-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LikesService } from './likes.service';

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
