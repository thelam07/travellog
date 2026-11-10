import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { ServerOptions } from 'socket.io';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationPipe } from './common/validation';

// Socket.IO (N03) dùng cùng danh sách CORS với REST.
class SocketIoAdapter extends IoAdapter {
  constructor(app: NestExpressApplication, private readonly origins: string[]) {
    super(app);
  }
  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, { ...options, cors: { origin: this.origins } });
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Render đặt server sau proxy: tin header X-Forwarded-For của 1 lớp proxy để req.ip là IP người dùng,
  // không thì mọi người bị tính chung IP của proxy và chặn dò mật khẩu (BR25) sẽ khoá cả trang.
  app.set('trust proxy', 1);
  const config = app.get(ConfigService);

  // Phục vụ file tĩnh trong uploads/ qua URL /uploads/... (B3).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  app.setGlobalPrefix('api');
  // CORS chỉ cho địa chỉ client trong .env (mục 0).
  const origins = (config.get<string>('CLIENT_URL') ?? 'http://localhost:5173').split(',').map((s) => s.trim());
  app.enableCors({ origin: origins });
  app.useWebSocketAdapter(new SocketIoAdapter(app, origins));
  // Kiểm tra dữ liệu đầu vào bằng DTO, lỗi trả theo từng trường (mục 6.3).
  app.useGlobalPipes(validationPipe);
  // Mọi lỗi trả về dạng { error: { code, message, details } } (mục 6).
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`TravelLog API: http://localhost:${port}/api`);
}

bootstrap();
