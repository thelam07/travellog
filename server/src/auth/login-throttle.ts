import { ThrottlerModuleOptions } from '@nestjs/throttler';

// BR25, E04: chặn dò mật khẩu (mở rộng ngoài thiết kế): chỉ gắn vào /auth/login và /auth/admin/login.
// "account": mỗi IP thử một email tối đa 5 lần / phút. "ip": mỗi IP tối đa 30 lần / phút dù đổi email.
// Đếm cả lần đúng lẫn sai, bộ đếm nằm trong bộ nhớ server (một server Render là đủ).
export const LOGIN_THROTTLE: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'account',
      ttl: 60_000,
      limit: 5,
      getTracker: (req) => `${req.ip}|${String(req.body?.email ?? '').trim().toLowerCase()}`,
    },
    { name: 'ip', ttl: 60_000, limit: 30, getTracker: (req) => req.ip },
  ],
  errorMessage: 'Bạn thử đăng nhập quá nhiều lần, vui lòng đợi 1 phút rồi thử lại',
};
