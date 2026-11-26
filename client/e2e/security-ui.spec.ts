import { expect, test } from '@playwright/test';
import { API, apiLogin, authFile, demo, findPostId } from './helpers';

// Quyền kiểm tra ở server (gọi thẳng API), giao diện điện thoại, chế độ sáng/tối.
test.describe('Phân quyền khi gọi thẳng API', () => {
  test('bài "Chỉ người theo dõi": khách gọi thẳng API nhận 404', async ({ request }) => {
    const lan = demo('lan');
    const token = await apiLogin(request, lan.email, lan.password);
    const id = await findPostId(request, 'lan', 'Phú Quốc biển xanh', token);
    expect((await request.get(`${API}/posts/${id}`)).status()).toBe(404);
    expect((await request.get(`${API}/posts/${id}`, { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(200);
  });

  test('thành viên gọi API quản trị nhận 403, chưa đăng nhập nhận 401', async ({ request }) => {
    const lan = demo('lan');
    const token = await apiLogin(request, lan.email, lan.password);
    expect((await request.get(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(403);
    expect((await request.get(`${API}/admin/users`)).status()).toBe(401);
  });
});

test.describe('Giao diện', () => {
  test.use({ storageState: authFile('lan') });

  test('chế độ tối bật được và giữ sau khi tải lại', async ({ page }) => {
    await page.goto('/explore');
    const html = page.locator('html');
    await page.getByRole('button', { name: 'Chuyển sang giao diện tối' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Chuyển sang giao diện sáng' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('màn hình điện thoại: thanh điều hướng chuyển xuống dưới, không cuộn ngang', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const bottomNav = page.getByRole('navigation', { name: /Điều hướng/ });
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole('link', { name: /Đăng bài/ })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
