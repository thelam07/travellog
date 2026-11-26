import { expect, test, type Browser } from '@playwright/test';
import { authFile, uid } from './helpers';

// Theo dõi, quyền xem bài "Chỉ người theo dõi", thích, bình luận + trả lời, thông báo tức thời, báo cáo.
const as = async (browser: Browser, name: string) => {
  const ctx = await browser.newContext({ storageState: authFile(name) });
  return { ctx, page: await ctx.newPage() };
};

test.describe('Kết nối và tương tác', () => {
  test('theo dõi thì thấy bài "Chỉ người theo dõi", bỏ theo dõi thì mất', async ({ browser }) => {
    const { ctx, page } = await as(browser, 'minh');
    await page.goto('/u/lan');
    const posts = page.getByRole('region', { name: 'Bài viết' });
    await expect(posts.getByRole('heading', { name: 'Hội An 3 ngày 2 đêm' })).toBeVisible();
    await expect(posts.getByRole('heading', { name: 'Phú Quốc biển xanh' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đang theo dõi', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '1 người theo dõi' })).toBeVisible();
    await page.reload();
    await expect(posts.getByRole('heading', { name: 'Phú Quốc biển xanh' })).toBeVisible();

    // Bài của người mình theo dõi hiện trên bảng tin
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Phú Quốc biển xanh' })).toBeVisible();

    await page.goto('/u/lan');
    await page.getByRole('button', { name: 'Đang theo dõi', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Theo dõi', exact: true })).toBeVisible();
    await page.reload();
    await expect(posts.getByRole('heading', { name: 'Hội An 3 ngày 2 đêm' })).toBeVisible();
    await expect(posts.getByRole('heading', { name: 'Phú Quốc biển xanh' })).toHaveCount(0);
    await ctx.close();
  });

  test('thích cập nhật ngay, giữ sau khi tải lại, bỏ thích được', async ({ browser }) => {
    const { ctx, page } = await as(browser, 'hoa');
    await page.goto('/u/minh');
    await page.getByRole('link', { name: 'Sapa mùa lúa chín' }).click();
    const like = page.getByRole('article').getByRole('button', { name: /^(🤍|❤️) \d+$/ });
    await expect(like).toHaveText(/🤍\s*0/);
    // Giao diện đổi ngay (optimistic), đồng thời chờ server lưu xong rồi mới tải lại trang
    const saved = page.waitForResponse((r) => r.url().includes('/likes') && r.request().method() === 'POST');
    await like.click();
    await expect(like).toHaveText(/❤️\s*1/);
    expect((await saved).status()).toBe(201);
    await page.reload();
    await expect(like).toHaveText(/❤️\s*1/);
    const removed = page.waitForResponse((r) => r.url().includes('/likes') && r.request().method() === 'DELETE');
    await like.click();
    await expect(like).toHaveText(/🤍\s*0/);
    expect((await removed).ok()).toBe(true);
    await page.reload();
    await expect(like).toHaveText(/🤍\s*0/);
    await ctx.close();
  });

  test('bình luận và trả lời bình luận', async ({ browser }) => {
    const hoa = await as(browser, 'hoa');
    const text = `Đẹp quá, đi mấy ngày vậy? ${uid()}`;
    await hoa.page.goto('/u/tuan');
    await hoa.page.getByRole('link', { name: 'Săn mây Tà Xùa' }).click();
    const postUrl = hoa.page.url();
    await hoa.page.getByPlaceholder(/Chia sẻ cảm nghĩ/).fill(text);
    await hoa.page.getByRole('button', { name: 'Gửi' }).click();
    await expect(hoa.page.getByText(text)).toBeVisible();
    await expect(hoa.page.getByRole('heading', { name: 'Bình luận (1)' })).toBeVisible();

    // Một thành viên khác (Mai) trả lời bình luận đó
    const mai = await as(browser, 'mai');
    await mai.page.goto(postUrl);
    const comment = mai.page.locator('.comment-root-item', { hasText: text });
    await comment.getByRole('button', { name: 'Trả lời' }).click();
    const reply = `Mình đi 2 ngày bạn ơi ${uid()}`;
    await comment.getByPlaceholder(/^Trả lời/).fill(reply);
    await comment.getByRole('button', { name: 'Trả lời', exact: true }).last().click();
    await expect(comment.locator('.comment-reply-item', { hasText: reply })).toBeVisible();

    // Bên Hoa tải lại vẫn thấy trả lời nằm dưới bình luận gốc
    await hoa.page.reload();
    await expect(hoa.page.locator('.comment-root-item', { hasText: text }).locator('.comment-reply-item', { hasText: reply })).toBeVisible();
    await hoa.ctx.close();
    await mai.ctx.close();
  });

  test('thông báo tức thời: được theo dõi thì chuông nhảy số, không cần tải lại', async ({ browser }) => {
    const mai = await as(browser, 'mai');
    await mai.page.goto('/u/mai');
    const bell = mai.page.getByRole('link', { name: /^Thông báo/ }).first();
    await expect(bell).toHaveAccessibleName(/^Thông báo/);
    const before = Number((await bell.getAttribute('aria-label'))?.match(/(\d+) chưa đọc/)?.[1] ?? 0);

    const minh = await as(browser, 'minh');
    await minh.page.goto('/u/mai');
    await minh.page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
    await expect(minh.page.getByRole('button', { name: 'Đang theo dõi', exact: true })).toBeVisible();

    // Trang của Mai không tải lại mà chuông vẫn tăng (Socket.IO)
    await expect(bell).toHaveAccessibleName(`Thông báo, ${before + 1} chưa đọc`, { timeout: 5_000 });
    await bell.click();
    await expect(mai.page.getByText(/Minh Trần.*theo dõi bạn/).first()).toBeVisible();
    await mai.ctx.close();
    await minh.ctx.close();
  });

  test('báo cáo bài vi phạm, báo cáo lần 2 thì bị chặn', async ({ browser }) => {
    const { ctx, page } = await as(browser, 'hoa');
    await page.goto('/u/mai');
    await page.getByRole('link', { name: 'Phú Quốc tiết kiệm' }).click();
    await page.getByRole('button', { name: /Báo cáo/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Báo cáo bài viết' });
    await dialog.getByText('Spam', { exact: true }).click();
    await dialog.getByRole('button', { name: /Gửi/ }).click();
    await expect(dialog.getByText('Đã gửi báo cáo')).toBeVisible();
    await expect(page.getByText('Đã gửi báo cáo')).toHaveCount(0, { timeout: 5_000 });

    await page.getByRole('button', { name: /Báo cáo/ }).click();
    await dialog.getByText('Spam', { exact: true }).click();
    await dialog.getByRole('button', { name: /Gửi/ }).click();
    await expect(dialog.getByText('Bạn đã báo cáo bài này')).toBeVisible();
    await ctx.close();
  });
});
