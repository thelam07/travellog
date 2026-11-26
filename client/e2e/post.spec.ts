import { expect, test } from '@playwright/test';
import { authFile, fixture, uid } from './helpers';

// Thành viên đăng bài có ảnh (xem trước, bỏ bớt), sửa bài (thêm ảnh), xoá bài.
test.use({ storageState: authFile('lan') });

test.describe('Bài viết', () => {
  test('bỏ trống form thì báo lỗi, không gửi', async ({ page }) => {
    await page.goto('/posts/new');
    await page.getByRole('button', { name: 'Đăng bài' }).click();
    await expect(page.locator('.field-error').first()).toBeVisible();
    await expect(page).toHaveURL(/\/posts\/new/);
  });

  test('đăng, sửa, xoá bài có ảnh', async ({ page }) => {
    const title = `Chuyến đi thử ${uid()}`;
    await page.goto('/posts/new');
    await page.getByLabel('Tiêu đề').fill(title);
    await page.getByLabel('Nội dung').fill('Kiểm thử tự động bằng Playwright #e2etest');
    await page.getByLabel('Địa điểm').fill('Mũi Né');
    await page.getByLabel('Ngày đi').fill('2026-10-20');
    await page.getByLabel('Chi phí (VND)').fill('2500000');

    // Chọn 3 ảnh → có 3 ảnh xem trước → bỏ 1 ảnh còn 2
    await page.locator('input[type="file"]').setInputFiles([fixture('bien.jpg'), fixture('nui.jpg'), fixture('pho.jpg')]);
    const removeButtons = page.getByRole('button', { name: 'Bỏ ảnh' });
    await expect(removeButtons).toHaveCount(3);
    await removeButtons.last().click();
    await expect(removeButtons).toHaveCount(2);

    await page.getByRole('button', { name: 'Đăng bài' }).click();

    // Chuyển sang trang chi tiết bài vừa đăng
    await expect(page).toHaveURL(/\/posts\/[a-f0-9]{24}$/);
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expect(page.getByText('Mũi Né').first()).toBeVisible();
    await expect(page.getByText('2.500.000 ₫')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Xem ảnh \d của/ })).toHaveCount(2);
    const postUrl = page.url();

    // Sửa: đổi tiêu đề, thêm 1 ảnh → 3 ảnh
    await page.getByRole('link', { name: 'Sửa' }).click();
    await expect(page).toHaveURL(/\/edit$/);
    const newTitle = `${title} (đã sửa)`;
    await page.getByLabel('Tiêu đề').fill(newTitle);
    await page.locator('input[type="file"]').setInputFiles([fixture('pho.jpg')]);
    await page.getByRole('button', { name: /Lưu/ }).click();
    await expect(page).toHaveURL(postUrl);
    await expect(page.getByRole('heading', { name: newTitle, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Xem ảnh \d của/ })).toHaveCount(3);

    // Xoá: có hộp thoại xác nhận, xoá xong về trang chủ, link cũ không còn
    await page.getByRole('button', { name: 'Xoá' }).click();
    const confirm = page.getByRole('dialog', { name: 'Xoá bài viết?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /Xoá|Xác nhận/ }).click();
    await expect(page).not.toHaveURL(postUrl);
    await page.goto(postUrl);
    await expect(page.getByText(/không tồn tại/i).first()).toBeVisible();
  });

  test('bấm ảnh mở trình xem ảnh, Esc để đóng', async ({ page }) => {
    await page.goto('/u/lan');
    await page.getByRole('button', { name: 'Xem ảnh 1 của Hội An 3 ngày 2 đêm' }).first().click();
    const viewer = page.getByRole('dialog');
    await expect(viewer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);
  });
});
