import { expect, test } from '@playwright/test';
import { demo, uid } from './helpers';

// Đăng ký, đăng nhập, đăng xuất qua giao diện.
test.describe('Tài khoản', () => {
  test('đăng ký: báo lỗi ngay tại ô sai, đăng ký đúng thì tự đăng nhập', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Tên đăng nhập').fill('A!');
    await page.getByLabel('Email').fill('khong-phai-email');
    await page.getByLabel(/^Mật khẩu/).fill('123');
    await page.getByLabel('Nhập lại mật khẩu').fill('456');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.field-error')).toHaveCount(4);
    await expect(page).toHaveURL(/\/register/);

    const name = `e2e_${uid()}`;
    await page.getByLabel('Tên đăng nhập').fill(name);
    await page.getByLabel('Email').fill(`${name}@e2e.local`);
    await page.getByLabel(/^Mật khẩu/).fill('Matkhau123');
    await page.getByLabel('Nhập lại mật khẩu').fill('Matkhau123');
    await page.getByRole('button', { name: 'Đăng ký' }).click();

    await expect(page).not.toHaveURL(/\/register/);
    await expect(page.getByRole('button', { name: 'Tài khoản' })).toBeVisible();

    // Đăng xuất qua menu tài khoản
    await page.getByRole('button', { name: 'Tài khoản' }).click();
    await page.getByRole('menuitem', { name: /Đăng xuất/ }).click();
    await expect(page.getByRole('link', { name: 'Đăng nhập' }).first()).toBeVisible();
  });

  test('đăng ký trùng email thì báo lỗi', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Tên đăng nhập').fill(`e2e_${uid()}`);
    await page.getByLabel('Email').fill(demo('lan').email);
    await page.getByLabel(/^Mật khẩu/).fill('Matkhau123');
    await page.getByLabel('Nhập lại mật khẩu').fill('Matkhau123');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page.locator('.alert-error, .field-error').first()).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test('đăng nhập sai mật khẩu thì báo lỗi, không vào được', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demo('lan').email);
    await page.getByLabel('Mật khẩu').fill('SaiMatKhau1');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.locator('.alert-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
