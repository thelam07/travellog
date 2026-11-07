import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database.module';
import { FollowsModule } from './follows/follows.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';

// Render gọi để kiểm tra server còn sống; cũng dùng để "đánh thức" server trước khi demo.
@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [
    // Đọc server/.env; secret và chuỗi kết nối không nằm trong code (mục 6.3).
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGODB_URI') }),
    }),
    DatabaseModule,
    AuthModule,
    AdminUsersModule,
    UsersModule,
    FollowsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
