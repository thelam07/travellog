import { defineConfig, devices } from '@playwright/test';
import { ADMIN, API_PORT, DB_URI, WEB_PORT } from './e2e/helpers';

// Kiểm thử giao diện (E2E) bằng Playwright: bật server + client riêng trên cổng khác,
// dùng database riêng travellog_e2e (xoá sạch rồi seed lại mỗi lần chạy), không đụng dữ liệu dev.
// Cần MongoDB chạy ở localhost:27017. Chạy: cd client && npm run test:ui-e2e
export default defineConfig({
  testDir: './e2e',
  // Các test dùng chung một database nên chạy lần lượt, không song song
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: 'vi-VN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      // Build server, xoá database e2e, seed admin + dữ liệu demo rồi mới bật server
      command:
        'npm run build && node ../client/e2e/reset-db.mjs && node dist/seed/seed-admin.js && node dist/seed/seed-demo.js && node dist/main.js',
      cwd: '../server',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        PORT: String(API_PORT),
        MONGODB_URI: DB_URI,
        JWT_SECRET: 'e2e-secret-chi-dung-de-test',
        JWT_EXPIRES_IN: '1d',
        CLIENT_URL: `http://localhost:${WEB_PORT}`,
        PUBLIC_URL: `http://localhost:${API_PORT}`,
        ADMIN_EMAIL: ADMIN.email,
        ADMIN_PASSWORD: ADMIN.password,
        ADMIN_USERNAME: 'admin',
        // Để trống: ảnh lưu vào server/uploads, không đẩy lên Cloudinary thật
        CLOUDINARY_CLOUD_NAME: '',
        CLOUDINARY_API_KEY: '',
        CLOUDINARY_API_SECRET: '',
        GOOGLE_PLACES_KEY: '',
      },
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { API_PROXY: `http://localhost:${API_PORT}`, VITE_API_URL: '' },
    },
  ],
});
