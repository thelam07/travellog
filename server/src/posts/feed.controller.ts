import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PostsService } from './posts.service';

@Controller('feed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('member')
export class FeedController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getFeed(
    @CurrentUser() user: AuthUser,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getFeed(user, cursor, limit);
  }
}
