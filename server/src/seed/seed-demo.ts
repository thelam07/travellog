// B5: tạo dữ liệu mẫu (user + bài viết) để test app. Chạy lại không tạo trùng.
// Ảnh demo lấy từ picsum.photos với seed cố định → ổn định giữa các lần chạy và giữa
// các máy (không phụ thuộc PUBLIC_URL của máy seed). publicId bắt đầu bằng "demo/" để
// StorageService.remove() bỏ qua khi dọn dẹp.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Post } from '../posts/schemas/post.schema';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

interface DemoUser {
  username: string;
  email: string;
  password: string;
  role: 'member' | 'admin';
}

interface DemoPost {
  authorUsername: string;
  title: string;
  content: string;
  location: { name: string; lat: number; lng: number };
  tripDate: string; // YYYY-MM-DD, phải ở quá khứ
  cost: number;
  visibility: 'public' | 'followers';
}

const DEMO_USERS: DemoUser[] = [
  { username: 'quan', email: 'quan@demo.local', password: 'demo1234', role: 'member' },
  { username: 'linh', email: 'linh@demo.local', password: 'demo1234', role: 'member' },
  { username: 'minh', email: 'minh@demo.local', password: 'demo1234', role: 'member' },
];

const DEMO_POSTS: DemoPost[] = [
  {
    authorUsername: 'quan',
    title: 'Hội An 3 ngày 2 đêm',
    content: 'Phố cổ đẹp lắm, ăn cao lầu và bánh mì Phượng #hoian #vietnam',
    location: { name: 'Hội An', lat: 15.8801, lng: 108.338 },
    tripDate: '2024-10-15',
    cost: 1500000,
    visibility: 'public',
  },
  {
    authorUsername: 'quan',
    title: 'Sapa mùa lúa chín',
    content: 'Đi Fansipan, ruộng bậc thang vàng óng #sapa #mountains',
    location: { name: 'Sa Pa', lat: 22.3402, lng: 103.8442 },
    tripDate: '2024-09-20',
    cost: 3200000,
    visibility: 'public',
  },
  {
    authorUsername: 'linh',
    title: 'Phú Quốc biển xanh',
    content: 'Lặn san hô ở Hòn Thơm, cát trắng nắng vàng #phuquoc #beach',
    location: { name: 'Phú Quốc', lat: 10.2899, lng: 103.984 },
    tripDate: '2024-08-05',
    cost: 4500000,
    visibility: 'public',
  },
  {
    authorUsername: 'linh',
    title: 'Hà Nội cuối thu',
    content: 'Lá vàng phố cổ, ăn phở Hàng Trống #hanoi #autumn',
    location: { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
    tripDate: '2024-11-01',
    cost: 800000,
    visibility: 'followers',
  },
  {
    authorUsername: 'minh',
    title: 'Đà Lạt sương mù',
    content: 'Cà phê view đồi thông, săn mây ở Cầu Đất #dalat #fog',
    location: { name: 'Đà Lạt', lat: 11.9404, lng: 108.4583 },
    tripDate: '2024-07-12',
    cost: 1200000,
    visibility: 'public',
  },
  {
    authorUsername: 'minh',
    title: 'Nha Trang lặn biển',
    content: 'Hòn Mun san hô đẹp, ăn hải sản tươi #nhatrang #diving',
    location: { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
    tripDate: '2024-06-18',
    cost: 2800000,
    visibility: 'public',
  },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const usersService = app.get(UsersService);
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const postModel = app.get<Model<Post>>(getModelToken(Post.name));

    // 1. Tạo user demo (idempotent: đã có thì bỏ qua).
    const userMap = new Map<string, string>();
    for (const u of DEMO_USERS) {
      const existing = await userModel.findOne({ email: u.email }).lean();
      if (existing) {
        console.log(`User ${u.username} đã tồn tại, bỏ qua.`);
        userMap.set(u.username, String(existing._id));
        continue;
      }
      const created = await usersService.create(u);
      userMap.set(u.username, String(created._id));
      console.log(`Đã tạo user ${u.username} (${u.email}).`);
    }

    // 2. Tạo bài viết demo (idempotent: cùng author + title thì bỏ qua).
    for (let i = 0; i < DEMO_POSTS.length; i++) {
      const p = DEMO_POSTS[i];
      const authorId = userMap.get(p.authorUsername);
      if (!authorId) {
        console.warn(`Bỏ qua bài "${p.title}": không tìm thấy user ${p.authorUsername}.`);
        continue;
      }
      const exists = await postModel.findOne({ author: authorId, title: p.title }).lean();
      if (exists) {
        console.log(`Bài "${p.title}" đã tồn tại, bỏ qua.`);
        continue;
      }

      // 2 ảnh từ picsum với seed cố định → ổn định giữa các lần chạy và các máy.
      // publicId bắt đầu "demo/" để StorageService.remove() bỏ qua khi dọn dẹp.
      const images = [1, 2].map((k) => ({
        url: `https://picsum.photos/seed/travellog-${i}-${k}/1200/800`,
        publicId: `demo/${i}-${k}`,
      }));

      await postModel.create({
        author: authorId,
        title: p.title,
        content: p.content,
        location: {
          name: p.location.name,
          placeId: null,
          address: null,
          lat: p.location.lat,
          lng: p.location.lng,
        },
        tripDate: new Date(p.tripDate),
        cost: p.cost,
        visibility: p.visibility,
        images,
      });
      console.log(`Đã tạo bài "${p.title}" của ${p.authorUsername}.`);
    }

    console.log('Seed demo hoàn tất.');
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e?.response ?? e);
  process.exit(1);
});
