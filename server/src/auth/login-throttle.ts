import { ThrottlerModuleOptions } from '@nestjs/throttler';

// IP người dùng. Trên Render request đi qua Cloudflare và nhiều lớp proxy nên req.ip (kể cả khi đặt trust proxy) là IP
// máy trung gian, đổi theo từng request. Cloudflare luôn gắn CF-Connecting-IP = IP người dùng. Client tự gửi header này
// thì Cloudflare chặn luôn (đo trên web thật 10/11/2026: 403 từ Cloudflare, request không tới server), nên không giả được.
// Chạy trên máy không qua Cloudflare thì không có header này → dùng req.ip.
const clientIp = (req: Record<string, any>): string => {
  const cf = req.headers?.['cf-connecting-ip'];
  return typeof cf === 'string' && cf ? cf : req.ip;
};

// BR25, E04: chặn dò mật khẩu (mở rộng ngoài thiết kế): chỉ gắn vào /auth/login và /auth/admin/login.
// "account": mỗi IP thử một email tối đa 5 lần / phút. "ip": mỗi IP tối đa 30 lần / phút dù đổi email.
// Đếm cả lần đúng lẫn sai, bộ đếm nằm trong bộ nhớ server (một server Render là đủ).
export const LOGIN_THROTTLE: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'account',
      ttl: 60_000,
      limit: 5,
      getTracker: (req) => `${clientIp(req)}|${String(req.body?.email ?? '').trim().toLowerCase()}`,
    },
    { name: 'ip', ttl: 60_000, limit: 30, getTracker: (req) => clientIp(req) },
  ],
  errorMessage: 'Bạn thử đăng nhập quá nhiều lần, vui lòng đợi 1 phút rồi thử lại',
};
