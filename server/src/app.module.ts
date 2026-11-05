import { Controller, Get, Module } from '@nestjs/common';

// Render gọi để kiểm tra server còn sống; cũng dùng để "đánh thức" server trước khi demo.
@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true };
  }
}

@Module({
  controllers: [HealthController],
})
export class AppModule {}
