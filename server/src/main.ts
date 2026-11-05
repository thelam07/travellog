import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationPipe } from './common/validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  // CORS chỉ cho địa chỉ client trong .env (mục 0).
  app.enableCors({ origin: (config.get<string>('CLIENT_URL') ?? 'http://localhost:5173').split(',').map((s) => s.trim()) });
  // Kiểm tra dữ liệu đầu vào bằng DTO, lỗi trả theo từng trường (mục 6.3).
  app.useGlobalPipes(validationPipe);
  // Mọi lỗi trả về dạng { error: { code, message, details } } (mục 6).
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`TravelLog API: http://localhost:${port}/api`);
}

bootstrap();
