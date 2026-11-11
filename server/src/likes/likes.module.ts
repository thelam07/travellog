import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

/**
 * LikesModule: Xử lý chức năng Thích / Bỏ thích bài viết (F06, BR02, BR08, BR20).
 * Model Like và Post đã đăng ký tập trung ở DatabaseModule (@Global) nên không cần MongooseModule.forFeature.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
