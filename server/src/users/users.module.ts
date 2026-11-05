import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

// Tuần 2 thêm UsersController (trang cá nhân, sửa hồ sơ, avatar).
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
