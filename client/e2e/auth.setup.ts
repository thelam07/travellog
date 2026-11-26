import { test as setup } from '@playwright/test';
import { ADMIN, authFile, demo, loginUI } from './helpers';

// Đăng nhập sẵn vài tài khoản một lần, lưu token (localStorage) để các test dùng lại,
// tránh đăng nhập lặp lại nhiều lần (server giới hạn 30 lần đăng nhập / phút / IP).
for (const name of ['lan', 'minh', 'hoa', 'mai']) {
  setup(`đăng nhập ${name}`, async ({ page }) => {
    const u = demo(name);
    await loginUI(page, u.email, u.password);
    await page.context().storageState({ path: authFile(name) });
  });
}

setup('đăng nhập admin', async ({ page }) => {
  await loginUI(page, ADMIN.email, ADMIN.password, true);
  await page.context().storageState({ path: authFile('admin') });
});
