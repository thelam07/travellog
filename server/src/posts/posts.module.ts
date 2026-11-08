import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

// Model Post đăng ký tập trung ở DatabaseModule.
// StorageService đăng ký ở StorageModule (@Global) nên không cần imports ở đây.
@Module({
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
