import { expect, test } from '@playwright/test';
import { apiLogin, demo, findPostId } from './helpers';

// Vai trò Khách: xem, tìm bài công khai, xem trang cá nhân; không thấy bài "Chỉ người theo dõi".
test.describe('Khách chưa đăng nhập', () => {
  test('trang chủ chuyển sang Khám phá, chỉ thấy bài công khai', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.getByRole('heading', { name: 'Hội An 3 ngày 2 đêm' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sapa mùa lúa chín' })).toBeVisible();
    // Bài "Chỉ người theo dõi" của Lan và Hoa không hiện với khách
    await expect(page.getByRole('heading', { name: 'Phú Quốc biển xanh' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Vịnh Hạ Long' })).toHaveCount(0);
  });

  test('tìm theo địa điểm và theo hashtag', async ({ page }) => {
    await page.goto('/explore');
    const search = page.getByRole('banner').getByRole('searchbox', { name: 'Tìm kiếm' });
    await search.fill('Hà Giang');
    await search.press('Enter');
    await expect(page.getByRole('heading', { name: 'Hà Giang mùa hoa tam giác mạch' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hội An 3 ngày 2 đêm' })).toHaveCount(0);

    await search.fill('#hoian');
    await search.press('Enter');
    await expect(page.getByRole('heading', { name: 'Hội An 3 ngày 2 đêm' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hà Giang mùa hoa tam giác mạch' })).toHaveCount(0);
  });

  test('xem trang cá nhân và tab bản đồ', async ({ page }) => {
    await page.goto('/u/lan');
    await expect(page.getByRole('heading', { name: 'Lan Nguyễn', level: 1 })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Bài viết' }).getByRole('heading', { name: 'Hội An 3 ngày 2 đêm' })).toBeVisible();
    await expect(page.getByText('Phú Quốc biển xanh')).toHaveCount(0);
    await page.getByRole('tab', { name: 'Bản đồ' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible();
  });

  test('mở thẳng link bài "Chỉ người theo dõi" thì báo không tồn tại', async ({ page, request }) => {
    const lan = demo('lan');
    const token = await apiLogin(request, lan.email, lan.password);
    const id = await findPostId(request, 'lan', 'Phú Quốc biển xanh', token);
    await page.goto(`/posts/${id}`);
    await expect(page.getByText(/không tồn tại/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Phú Quốc biển xanh' })).toHaveCount(0);
  });

  test('trang cần đăng nhập chuyển về /login, đường dẫn sai hiện trang 404', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/khong-co-trang-nay');
    await expect(page.getByText('Không tìm thấy trang')).toBeVisible();
  });
});
