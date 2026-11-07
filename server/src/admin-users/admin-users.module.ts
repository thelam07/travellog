import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

// Tuần 3: import PostsModule (B) và CommentsModule (C) để gọi setAuthorLocked khi khoá (BR09).
@Module({
  imports: [UsersModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
