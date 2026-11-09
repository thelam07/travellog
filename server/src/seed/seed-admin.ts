// F18: tạo admin đầu tiên từ ADMIN_EMAIL / ADMIN_PASSWORD trong .env. Chạy lại không tạo trùng.
import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const config = app.get(ConfigService);
    const email = config.getOrThrow<string>('ADMIN_EMAIL').trim().toLowerCase();
    const password = config.getOrThrow<string>('ADMIN_PASSWORD');
    const username = (config.get<string>('ADMIN_USERNAME') ?? 'admin').trim().toLowerCase();

    const users = app.get<Model<User>>(getModelToken(User.name));
    const existing = await users.findOne({ email }).lean();
    if (existing) {
      console.log(`Đã có tài khoản ${email} (role = ${existing.role}), không tạo lại.`);
      return;
    }
    const usersService = app.get(UsersService);
    await usersService.create({ username, email, password, role: 'admin' }, { allowReserved: true });
    await usersService.ensureOwner(); // admin đầu tiên là admin gốc
    console.log(`Đã tạo admin ${email}. Đăng nhập ở /admin/login rồi đổi mật khẩu ở /settings/password.`);
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e?.response ?? e);
  process.exit(1);
});
