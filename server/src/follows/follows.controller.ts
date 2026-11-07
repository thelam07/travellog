import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { IsMongoId } from 'class-validator';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { FollowsService } from './follows.service';

class FollowDto {
  @IsMongoId({ message: 'userId không hợp lệ' })
  userId: string;
}

// BR20: admin không theo dõi được (403).
@Controller('follows')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('member')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Post()
  follow(@CurrentUser() user: AuthUser, @Body() dto: FollowDto) {
    return this.follows.follow(user.id, dto.userId);
  }

  @Delete(':userId')
  unfollow(@CurrentUser() user: AuthUser, @Param('userId') userId: string) {
    return this.follows.unfollow(user.id, userId);
  }
}
