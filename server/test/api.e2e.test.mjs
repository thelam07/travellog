import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

test('Likes E2E tests (C4 - BR02, BR08, BR20)', async (t) => {
  // 1. Đăng nhập lấy token member (minh)
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'minh@demo.travellog', password: 'Demo12345' }),
  });
  assert.equal(loginRes.status, 200, 'Đăng nhập member thành công');
  const { token: memberToken } = await loginRes.json();

  // 2. Đăng nhập admin lấy token admin
  const adminLoginRes = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@travellog.local',
      password: process.env.ADMIN_PASSWORD || 'Admin12345',
    }),
  });
  let adminToken = null;
  if (adminLoginRes.status === 200) {
    const data = await adminLoginRes.json();
    adminToken = data.token;
  }

  // 3. Lấy 1 bài viết demo của lan (để minh like)
  const postsRes = await fetch(`${BASE_URL}/posts?limit=10`);
  let targetPostId = null;
  if (postsRes.status === 200) {
    const postsData = await postsRes.json();
    const post = (postsData.items || postsData)[0];
    if (post) {
      targetPostId = post._id;
    }
  }

  if (!targetPostId) {
    console.warn('Chưa có bài viết demo, vui lòng chạy npm run seed:demo trước khi chạy test');
    return;
  }

  // Đảm bảo trước khi test minh chưa like bài này
  await fetch(`${BASE_URL}/posts/${targetPostId}/likes`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${memberToken}` },
  });

  await t.test('1. Member thích bài viết lần đầu -> 201 Created và tăng likeCount', async () => {
    const res = await fetch(`${BASE_URL}/posts/${targetPostId}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.liked, true);
    assert.equal(typeof body.likeCount, 'number');
  });

  await t.test('2. Thích lại lần 2 -> 409 Conflict ALREADY_LIKED (BR02)', async () => {
    const res = await fetch(`${BASE_URL}/posts/${targetPostId}/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error?.code, 'ALREADY_LIKED');
  });

  await t.test('3. Bỏ thích -> 200 OK và giảm likeCount', async () => {
    const res = await fetch(`${BASE_URL}/posts/${targetPostId}/likes`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.liked, false);
    assert.equal(typeof body.likeCount, 'number');
  });

  await t.test('4. Bỏ thích khi chưa thích -> 404 NOT_LIKED', async () => {
    const res = await fetch(`${BASE_URL}/posts/${targetPostId}/likes`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_LIKED');
  });

  if (adminToken) {
    await t.test('5. Admin không được thích bài viết -> 403 FORBIDDEN_ROLE (BR20)', async () => {
      const res = await fetch(`${BASE_URL}/posts/${targetPostId}/likes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.error?.code, 'FORBIDDEN_ROLE');
    });
  }

  await t.test('6. Thích bài không tồn tại -> 404 NOT_FOUND', async () => {
    const res = await fetch(`${BASE_URL}/posts/000000000000000000000000/likes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error?.code, 'NOT_FOUND');
  });

  await t.test('7. Người lạ không thích được bài "chỉ người theo dõi" (BR01) -> 404 NOT_FOUND', async () => {
    const allPostsRes = await fetch(`${BASE_URL}/posts?limit=50`);
    if (allPostsRes.status === 200) {
      const data = await allPostsRes.json();
      const followersPost = (data.items || data).find(
        (p) => p.visibility === 'followers' && p.author?.username !== 'minh',
      );
      if (followersPost) {
        const res = await fetch(`${BASE_URL}/posts/${followersPost._id}/likes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${memberToken}` },
        });
        assert.equal(res.status, 404, 'Bài followers phải trả về 404 với người chưa theo dõi (BR01)');
      }
    }
  });
});
