import { expect, test } from '@playwright/test';
import { API, apiLogin, authFile, demo, findPostId, uid } from './helpers';

// Cửa sổ khách thật sự (không kế thừa phiên admin của describe)
const NO_LOGIN = { cookies: [], origins: [] };

// Admin: xử lý báo cáo (ẩn bài), khoá / mở khoá tài khoản, thống kê địa điểm.
test.describe('Quản trị', () => {
  test('thành viên vào /admin bị đưa về trang chủ', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: authFile('lan') });
    const page = await ctx.newPage();
    await page.goto('/admin/reports');
    await expect(page).not.toHaveURL(/\/admin/);
    await ctx.close();
  });

  test.describe('đăng nhập admin', () => {
    test.use({ storageState: authFile('admin') });

    test('ẩn bài bị báo cáo: bài biến mất với mọi người, bỏ ẩn thì hiện lại', async ({ page, request, browser }) => {
      // Chuẩn bị: Tuấn báo cáo bài "Đà Lạt sương mù" của Hoa qua API
      const tuan = demo('tuan');
      const token = await apiLogin(request, tuan.email, tuan.password);
      const postId = await findPostId(request, 'hoa', 'Đà Lạt sương mù');
      const res = await request.post(`${API}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { postId, reason: 'offensive' },
      });
      expect([201, 409]).toContain(res.status());

      await page.goto('/admin/reports');
      const row = page.getByRole('row', { name: /Đà Lạt sương mù/ });
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: 'Ẩn bài' }).click();
      await expect(page.getByText(/Đã ẩn bài viết/)).toBeVisible();

      const guest = await browser.newContext({ storageState: NO_LOGIN });
      const g = await guest.newPage();
      await g.goto(`/posts/${postId}`);
      await expect(g.getByText(/không tồn tại/i).first()).toBeVisible();

      await page.getByRole('button', { name: 'Tất cả' }).click();
      await page.getByRole('row', { name: /Đà Lạt sương mù/ }).getByRole('button', { name: 'Bỏ ẩn' }).click();
      await expect(page.getByRole('row', { name: /Đà Lạt sương mù/ }).getByRole('button', { name: 'Ẩn bài' })).toBeVisible();
      await g.reload();
      await expect(g.getByRole('heading', { name: 'Đà Lạt sương mù', level: 1 })).toBeVisible();
      await guest.close();
    });

    test('khoá tài khoản: bài của người đó bị ẩn, mở khoá thì hiện lại', async ({ page, browser }) => {
      await page.goto('/admin/users');
      const row = page.getByRole('row', { name: /@tuan/ });
      await row.getByRole('button', { name: 'Khoá' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Đồng ý' }).click();
      await expect(row.getByRole('button', { name: 'Mở khoá' })).toBeVisible();
      await expect(row).toContainText('Đã khoá');

      const guest = await browser.newContext({ storageState: NO_LOGIN });
      const g = await guest.newPage();
      await g.goto('/explore');
      await expect(g.getByRole('heading', { name: 'Sapa mùa lúa chín' })).toBeVisible();
      await expect(g.getByRole('heading', { name: 'Săn mây Tà Xùa' })).toHaveCount(0);

      await row.getByRole('button', { name: 'Mở khoá' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Đồng ý' }).click();
      await expect(row.getByRole('button', { name: 'Khoá' })).toBeVisible();
      await g.reload();
      await expect(g.getByRole('heading', { name: 'Săn mây Tà Xùa' })).toBeVisible();
      await guest.close();
    });

    test('tài khoản bị khoá không đăng nhập được', async ({ page, browser, request }) => {
      // Tạo tài khoản riêng để khoá (khoá làm mất phiên đăng nhập, không dùng tài khoản demo)
      const name = `khoa_${uid()}`;
      const email = `${name}@e2e.local`;
      const reg = await request.post(`${API}/auth/register`, { data: { username: name, email, password: 'Matkhau123' } });
      expect(reg.status()).toBe(201);

      await page.goto('/admin/users');
      await page.getByRole('textbox', { name: 'Tìm tài khoản' }).fill(name);
      await page.getByRole('button', { name: 'Tìm', exact: true }).click();
      const row = page.getByRole('row', { name: new RegExp(`@${name}`) });
      await row.getByRole('button', { name: 'Khoá' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Đồng ý' }).click();
      await expect(row.getByRole('button', { name: 'Mở khoá' })).toBeVisible();

      const guest = await browser.newContext({ storageState: NO_LOGIN });
      const g = await guest.newPage();
      await g.goto('/login');
      await g.getByLabel('Email').fill(email);
      await g.getByLabel('Mật khẩu').fill('Matkhau123');
      await g.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(g.locator('.alert-error')).toContainText(/khoá/i);
      await expect(g).toHaveURL(/\/login/);
      await guest.close();
    });

    test('thống kê địa điểm được nhắc nhiều nhất', async ({ page }) => {
      await page.goto('/admin/stats');
      await expect(page.getByRole('heading', { name: 'Thống kê địa điểm' })).toBeVisible();
      const rows = page.getByRole('table').getByRole('row');
      await expect(rows.nth(1)).toContainText('#1');
      await expect(page.getByRole('cell', { name: 'Phú Quốc' })).toBeVisible();
      await page.getByLabel('Hiển thị:').selectOption({ label: 'Top 5' });
      await expect(rows).toHaveCount(6); // 1 dòng tiêu đề + 5 địa điểm
    });
  });
});
