// B5: tạo dữ liệu mẫu (5 user + 10 bài viết) để test app.
// Chạy lại: xoá hết user có email @demo.travellog và bài viết của họ, tạo lại từ đầu.
// Không đụng tới tài khoản thật (email không có đuôi @demo.travellog).
// Ảnh demo lấy từ picsum.photos với seed cố định → ổn định giữa các lần chạy và các máy.
// publicId bắt đầu bằng "demo/" để StorageService.remove() bỏ qua khi dọn dẹp.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from '../app.module';
import { Post } from '../posts/schemas/post.schema';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

const DEMO_EMAIL_SUFFIX = '@demo.travellog';
const DEMO_PASSWORD = 'Demo12345';

interface DemoUser {
  username: string;
  email: string;
  displayName: string;
  bio: string;
}

interface DemoLocation {
  name: string;
  placeId: string;
  address: string;
  lat: number;
  lng: number;
}

interface DemoPost {
  authorUsername: string;
  title: string;
  content: string;
  // location có thể là DemoLocation đầy đủ hoặc chỉ { name } (nhập tay, không placeId/toạ độ).
  location: DemoLocation | { name: string };
  tripDate: string; // YYYY-MM-DD, phải ở quá khứ
  cost: number;
  visibility: 'public' | 'followers';
}

const DEMO_USERS: DemoUser[] = [
  { username: 'lan', email: `lan${DEMO_EMAIL_SUFFIX}`, displayName: 'Lan Nguyễn', bio: 'Thích biển và cà phê sáng.' },
  { username: 'minh', email: `minh${DEMO_EMAIL_SUFFIX}`, displayName: 'Minh Trần', bio: 'Phượt thủ miền núi phía Bắc.' },
  { username: 'hoa', email: `hoa${DEMO_EMAIL_SUFFIX}`, displayName: 'Hoa Lê', bio: 'Ăn đâu đi đó.' },
  { username: 'tuan', email: `tuan${DEMO_EMAIL_SUFFIX}`, displayName: 'Tuấn Phạm', bio: 'Chụp ảnh phong cảnh.' },
  { username: 'mai', email: `mai${DEMO_EMAIL_SUFFIX}`, displayName: 'Mai Vũ', bio: 'Du lịch tiết kiệm.' },
];

const LOCATIONS: Record<string, DemoLocation> = {
  hoian: { name: 'Hội An', placeId: 'demo-hoian', address: 'Hội An, Quảng Nam', lat: 15.8801, lng: 108.338 },
  dalat: { name: 'Đà Lạt', placeId: 'demo-dalat', address: 'Đà Lạt, Lâm Đồng', lat: 11.9404, lng: 108.4583 },
  sapa: { name: 'Sa Pa', placeId: 'demo-sapa', address: 'Sa Pa, Lào Cai', lat: 22.3364, lng: 103.8438 },
  phuquoc: { name: 'Phú Quốc', placeId: 'demo-phuquoc', address: 'Phú Quốc, Kiên Giang', lat: 10.2899, lng: 103.984 },
  halong: { name: 'Vịnh Hạ Long', placeId: 'demo-halong', address: 'Hạ Long, Quảng Ninh', lat: 20.9101, lng: 107.1839 },
  hagiang: { name: 'Hà Giang', placeId: 'demo-hagiang', address: 'Hà Giang', lat: 22.8233, lng: 104.9836 },
};

const DEMO_POSTS: DemoPost[] = [
  {
    authorUsername: 'lan',
    title: 'Hội An 3 ngày 2 đêm',
    content: 'Phố cổ đẹp lắm, ăn cao lầu và bánh mì Phượng #hoian #vietnam',
    location: LOCATIONS.hoian,
    tripDate: '2024-10-15',
    cost: 1500000,
    visibility: 'public',
  },
  {
    authorUsername: 'lan',
    title: 'Phú Quốc biển xanh',
    content: 'Lặn san hô ở Hòn Thơm, cát trắng nắng vàng #phuquoc #beach',
    location: LOCATIONS.phuquoc,
    tripDate: '2024-08-05',
    cost: 4500000,
    visibility: 'followers',
  },
  {
    authorUsername: 'minh',
    title: 'Sapa mùa lúa chín',
    content: 'Đi Fansipan, ruộng bậc thang vàng óng #sapa #mountains',
    location: LOCATIONS.sapa,
    tripDate: '2024-09-20',
    cost: 3200000,
    visibility: 'public',
  },
  {
    authorUsername: 'minh',
    title: 'Hà Giang mùa hoa tam giác mạch',
    content: 'Cột cờ Lũng Cú, Đồng Văn #hagiang #flowers',
    location: LOCATIONS.hagiang,
    tripDate: '2024-10-28',
    cost: 2800000,
    visibility: 'public',
  },
  {
    authorUsername: 'hoa',
    title: 'Đà Lạt sương mù',
    content: 'Cà phê view đồi thông, săn mây ở Cầu Đất #dalat #fog',
    location: LOCATIONS.dalat,
    tripDate: '2024-07-12',
    cost: 1200000,
    visibility: 'public',
  },
  {
    authorUsername: 'hoa',
    title: 'Vịnh Hạ Long',
    content: 'Du thuyền qua hang Sửng Sốt, kayak quanh đảo #halong #bay',
    location: LOCATIONS.halong,
    tripDate: '2024-06-22',
    cost: 3800000,
    visibility: 'followers',
  },
  {
    authorUsername: 'tuan',
    title: 'Săn mây Tà Xùa',
    content: 'Biển mây cuối năm, đêm dưới 10 độ #sapa #cloud',
    location: LOCATIONS.sapa,
    tripDate: '2024-12-05',
    cost: 2100000,
    visibility: 'public',
  },
  {
    authorUsername: 'tuan',
    title: 'Đà Lạt mùa hoa dã quỳ',
    content: 'Vàng rực hai bên đường, chụp ảnh cực đẹp #dalat #wildflowers',
    location: LOCATIONS.dalat,
    tripDate: '2024-11-15',
    cost: 950000,
    visibility: 'public',
  },
  {
    authorUsername: 'mai',
    title: 'Phú Quốc tiết kiệm',
    content: 'Ở homestay, ăn chợ đêm, thuê xe máy #phuquoc #budget',
    location: LOCATIONS.phuquoc,
    tripDate: '2024-05-18',
    cost: 1800000,
    visibility: 'public',
  },
  {
    authorUsername: 'mai',
    title: 'Hội An nhập tay',
    content: 'Bài này chỉ có tên địa điểm, không có toạ độ #hoian #manual',
    // Chỉ có name, không placeId/address/lat/lng — để thống kê gộp với "Hội An" nhờ nameKey.
    location: { name: 'hoi an' },
    tripDate: '2024-04-10',
    cost: 600000,
    visibility: 'public',
  },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const usersService = app.get(UsersService);
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const postModel = app.get<Model<Post>>(getModelToken(Post.name));

    // 1. Dọn user demo cũ + bài viết của họ (không đụng tài khoản thật).
    const demoUsers = await userModel.find({ email: { $regex: `${DEMO_EMAIL_SUFFIX}$` } }).select('_id').lean();
    const demoIds = demoUsers.map((u) => u._id);
    if (demoIds.length) {
      await postModel.deleteMany({ author: { $in: demoIds } });
      await userModel.deleteMany({ _id: { $in: demoIds } });
      console.log(`Đã xoá ${demoIds.length} user demo cũ và bài viết của họ.`);
    }

    // 2. Tạo 5 user demo qua UsersService.create, sau đó cập nhật displayName + bio
    // (UsersService.create chưa nhận 2 trường này).
    const userMap = new Map<string, string>();
    for (const u of DEMO_USERS) {
      const created = await usersService.create({
        username: u.username,
        email: u.email,
        password: DEMO_PASSWORD,
        role: 'member',
      });
      await userModel.updateOne({ _id: created._id }, { displayName: u.displayName, bio: u.bio });
      userMap.set(u.username, String(created._id));
      console.log(`Đã tạo user ${u.username} (${u.email}).`);
    }

    // 3. Tạo 10 bài viết demo. createdAt cách nhau 3 giờ để bảng tin có thứ tự.
    for (let i = 0; i < DEMO_POSTS.length; i++) {
      const p = DEMO_POSTS[i];
      const authorId = userMap.get(p.authorUsername);
      if (!authorId) {
        console.warn(`Bỏ qua bài "${p.title}": không tìm thấy user ${p.authorUsername}.`);
        continue;
      }

      // 2 ảnh từ picsum với seed cố định → ổn định giữa các lần chạy và các máy.
      const images = [1, 2].map((k) => ({
        url: `https://picsum.photos/seed/travellog-${i}-${k}/1200/800`,
        publicId: `demo/${i}-${k}`,
      }));

      // location có thể là đầy đủ (có placeId/address/lat/lng) hoặc chỉ { name }.
      const loc = p.location as Partial<DemoLocation>;
      const location = {
        name: loc.name,
        placeId: loc.placeId ?? null,
        address: loc.address ?? null,
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
      };

      await postModel.create({
        author: new Types.ObjectId(authorId),
        title: p.title,
        content: p.content,
        location,
        tripDate: new Date(p.tripDate),
        cost: p.cost,
        visibility: p.visibility,
        images,
        createdAt: new Date(Date.now() - i * 3 * 3600 * 1000),
        updatedAt: new Date(Date.now() - i * 3 * 3600 * 1000),
      });
      console.log(`Đã tạo bài "${p.title}" của ${p.authorUsername}.`);
    }

    // 4. In danh sách tài khoản để đăng nhập thử.
    console.log('\n=== Tài khoản demo ===');
    for (const u of DEMO_USERS) {
      console.log(`  ${u.email}  /  ${DEMO_PASSWORD}`);
    }
    console.log('======================\n');
    console.log('Seed demo hoàn tất.');
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e?.response ?? e);
  process.exit(1);
});
