import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

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
  ],
  controllers: [HealthController],
})
export class AppModule {}
