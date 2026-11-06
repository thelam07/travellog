import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';

// Module rỗng cho B1: chỉ đăng ký model Post để các module khác (likes, comments, reports, feed)
// có thể inject bằng @InjectModel(Post.name). Controller và service thêm ở B4, B6, B7.
@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
  exports: [MongooseModule],
})
export class PostsModule {}
