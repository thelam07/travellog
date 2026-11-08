import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from './follows/schemas/follow.schema';
import { Notification, NotificationSchema } from './notifications/schemas/notification.schema';
import { Post, PostSchema } from './posts/schemas/post.schema';
import { User, UserSchema } from './users/schemas/user.schema';
import { Like, LikeSchema } from './likes/schemas/like.schema';
import { Comment, CommentSchema } from './comments/schemas/comment.schema';
import { Report, ReportSchema } from './reports/schemas/report.schema';

// Đăng ký model một lần, dùng chung cho mọi module (inject bằng @InjectModel).
// Thêm schema mới: import rồi thêm một dòng vào mảng dưới đây.
const models = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Follow.name, schema: FollowSchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: Post.name, schema: PostSchema },
  { name: Like.name, schema: LikeSchema },
  { name: Comment.name, schema: CommentSchema },
  { name: Report.name, schema: ReportSchema },
]);

@Global()
@Module({ imports: [models], exports: [models] })
export class DatabaseModule {}