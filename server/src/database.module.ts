import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users/schemas/user.schema';

// Đăng ký model một lần, dùng chung cho mọi module (inject bằng @InjectModel).
// Thêm schema mới: import rồi thêm một dòng vào mảng dưới đây.
const models = MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]);

@Global()
@Module({ imports: [models], exports: [models] })
export class DatabaseModule {}
