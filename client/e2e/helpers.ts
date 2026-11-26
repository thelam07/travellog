import { expect, type APIRequestContext, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const API_PORT = 3031;
export const WEB_PORT = 5185;
export const DB_URI = 'mongodb://127.0.0.1:27017/travellog_e2e';
export const API = `http://localhost:${API_PORT}/api`;
export const ADMIN = { email: 'admin@e2e.local', password: 'AdminE2e12345' };

// Tài khoản có sẵn sau khi chạy seed:demo (server/src/seed/seed-demo.ts)
export const DEMO_PASSWORD = 'Demo12345';
export const demo = (username: string) => ({ username, email: `${username}@demo.travellog`, password: DEMO_PASSWORD });

const here = path.dirname(fileURLToPath(import.meta.url));
export const AUTH_DIR = path.join(here, '.auth');
export const authFile = (name: string) => path.join(AUTH_DIR, `${name}.json`);
export const fixture = (name: string) => path.join(here, 'fixtures', name);

/** Hậu tố ngẫu nhiên để dữ liệu mỗi lần chạy không trùng nhau */
export const uid = () => Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);

/** Đăng nhập qua giao diện (trang /login hoặc /admin/login) */
export async function loginUI(page: Page, email: string, password: string, admin = false) {
  await page.goto(admin ? '/admin/login' : '/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Đăng nhập qua API, trả về token (dùng cho bước chuẩn bị dữ liệu và kiểm tra gọi thẳng API) */
export async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<string> {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.status()).toBe(200);
  return (await res.json()).token;
}

/** Tìm id bài theo tiêu đề trong danh sách bài của một người (token tuỳ chọn để thấy bài "Chỉ người theo dõi") */
export async function findPostId(request: APIRequestContext, username: string, title: string, token?: string) {
  const res = await request.get(`${API}/posts?author=${username}&limit=50`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const post = (await res.json()).items.find((p: { title: string }) => p.title === title);
  if (!post) throw new Error(`Không tìm thấy bài "${title}" của ${username}`);
  return post._id as string;
}
