import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { OwnershipGuard } from '../common/guards/ownership.guard';
import { PostAccessGuard } from './guards/post-access.guard';
import { FeedController } from './feed.controller';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

// Model Post đăng ký tập trung ở DatabaseModule.
// StorageService đăng ký ở StorageModule (@Global) nên không cần imports ở đây.
// FollowsModule cần cho PostsService.visibilityFilter / findOneForViewer (lấy danh sách theo dõi).
@Module({
  imports: [FollowsModule],
  controllers: [PostsController, FeedController],
  providers: [PostsService, PostAccessGuard, OwnershipGuard],
  exports: [PostsService, PostAccessGuard, OwnershipGuard],
})
export class PostsModule {}
