import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { PostAccessGuard } from './guards/post-access.guard';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [FollowsModule],
  controllers: [PostsController],
  providers: [PostsService, PostAccessGuard],
  exports: [PostsService, PostAccessGuard],
})
export class PostsModule {}
