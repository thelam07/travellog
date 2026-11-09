// Kiểm thử phân quyền và luật nghiệp vụ bằng cách gọi thẳng API (kế hoạch tuần 4, làm sớm cho phần đã có).
// Cần server đang chạy và đã có admin: npm run seed:admin, rồi npm run test:e2e.
// Không cần seed:demo: mỗi lần chạy tự đăng ký tài khoản riêng (tên có hậu tố thời gian nên chạy lại không trùng).
// Nên chạy trên DB riêng (MONGODB_URI=.../travellog_test) để không làm bẩn dữ liệu demo.
// Ai merge API mới (bảng tin, thích, bình luận, báo cáo…) thì thêm test vào nhóm tương ứng.
import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

const BASE = process.env.API_URL ?? 'http://localhost:3000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL ?? 'admin@travellog.local', password: process.env.ADMIN_PASSWORD ?? 'Admin12345' };
// Ảnh PNG 1×1 thật (FileTypeValidator đọc nội dung file, không tin đuôi)
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const uid = Date.now().toString(36);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, { token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) body = form;
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function register(name, displayName) {
  const r = await api('POST', '/auth/register', {
    json: { username: `${name}_${uid}`, email: `${name}_${uid}@test.local`, password: 'Test12345' },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  if (displayName) await api('PATCH', '/users/me', { token: r.body.token, json: { displayName } });
  return r.body; // { token, user }
}

function fileForm(field, files, fields = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  for (const f of files) form.append(field, new Blob([f.data], { type: f.type }), f.name);
  return form;
}
const png = { data: PNG, type: 'image/png', name: 'a.png' };
const txt = { data: Buffer.from('xin chao'), type: 'text/plain', name: 'a.txt' };
// Đổi đuôi .txt thành .png: nội dung vẫn là chữ nên phải bị từ chối
const fakePng = { data: Buffer.from('xin chao'), type: 'image/png', name: 'gia.png' };

let admin;
before(async () => {
  const r = await api('POST', '/auth/admin/login', { json: ADMIN });
  assert.equal(r.status, 200, `Không đăng nhập được admin ${ADMIN.email}: chạy npm run seed:admin, đặt ADMIN_EMAIL / ADMIN_PASSWORD đúng`);
  admin = r.body.token;
});

describe('Tài khoản (F01)', () => {
  test('BR18: đăng ký luôn là member, role gửi kèm bị bỏ qua, không trả passwordHash', async () => {
    const r = await api('POST', '/auth/register', {
      json: { username: `hack_${uid}`, email: `hack_${uid}@test.local`, password: 'Test12345', role: 'admin' },
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.user.role, 'member');
    assert.equal(r.body.user.passwordHash, undefined);
    assert.equal(typeof r.body.token, 'string');
  });

  test('UC01: trùng email / username → 409 kèm lỗi từng trường; username dành riêng, mật khẩu yếu → 400', async () => {
    const u = await register('dup');
    const dupEmail = await api('POST', '/auth/register', { json: { username: `x_${uid}`, email: u.user.email, password: 'Test12345' } });
    assert.equal(dupEmail.status, 409);
    assert.ok(dupEmail.body.error.details.email);
    const dupName = await api('POST', '/auth/register', { json: { username: u.user.username, email: `y_${uid}@t.local`, password: 'Test12345' } });
    assert.equal(dupName.status, 409);
    assert.ok(dupName.body.error.details.username);
    const reserved = await api('POST', '/auth/register', { json: { username: 'admin', email: `r_${uid}@t.local`, password: 'Test12345' } });
    assert.equal(reserved.status, 400);
    // BR19: ít nhất 8 kí tự, có chữ và số
    const weak = await api('POST', '/auth/register', { json: { username: `w_${uid}`, email: `w_${uid}@t.local`, password: 'abcdefgh' } });
    assert.equal(weak.status, 400);
    assert.ok(weak.body.error.details.password);
  });

  test('Đăng nhập sai email hay sai mật khẩu đều báo chung một câu (không lộ email nào đã có)', async () => {
    const u = await register('login');
    const wrongPw = await api('POST', '/auth/login', { json: { email: u.user.email, password: 'Sai123456' } });
    const noUser = await api('POST', '/auth/login', { json: { email: `khongco_${uid}@t.local`, password: 'Sai123456' } });
    assert.equal(wrongPw.status, 401);
    assert.equal(noUser.status, 401);
    assert.equal(wrongPw.body.error.message, noUser.body.error.message);
    assert.equal((await api('POST', '/auth/login', { json: { email: u.user.email, password: 'Test12345' } })).status, 200);
  });

  test('BR20: admin đăng nhập ở /login → 403; member đăng nhập ở /admin/login → 403', async () => {
    const a = await api('POST', '/auth/login', { json: ADMIN });
    assert.equal(a.status, 403);
    assert.equal(a.body.error.code, 'ADMIN_USE_ADMIN_LOGIN');
    const u = await register('notadmin');
    const m = await api('POST', '/auth/admin/login', { json: { email: u.user.email, password: 'Test12345' } });
    assert.equal(m.status, 403);
  });

  test('Không token / token rác → 401', async () => {
    assert.equal((await api('GET', '/auth/me')).status, 401);
    assert.equal((await api('GET', '/auth/me', { token: 'rac.rac.rac' })).status, 401);
  });

  test('BR11 + BR19: đổi mật khẩu cần mật khẩu cũ đúng; token cũ 401, token mới dùng được', async () => {
    const u = await register('pw');
    await sleep(1100); // iat tính theo giây
    const wrong = await api('PATCH', '/auth/password', { token: u.token, json: { currentPassword: 'Sai123456', newPassword: 'Moi123456' } });
    assert.equal(wrong.status, 400);
    assert.ok(wrong.body.error.details.currentPassword);
    const ok = await api('PATCH', '/auth/password', { token: u.token, json: { currentPassword: 'Test12345', newPassword: 'Moi123456' } });
    assert.equal(ok.status, 200);
    assert.equal((await api('GET', '/auth/me', { token: u.token })).status, 401);
    assert.equal((await api('GET', '/auth/me', { token: ok.body.token })).status, 200);
  });
});

describe('Hồ sơ (F04, F10)', () => {
  test('Khách xem được trang cá nhân; sửa hồ sơ; role gửi kèm không có tác dụng; quá dài → 400', async () => {
    const u = await register('prof');
    const guest = await api('GET', `/users/${u.user.username}`);
    assert.equal(guest.status, 200);
    assert.equal(guest.body.isFollowing, false);
    const upd = await api('PATCH', '/users/me', { token: u.token, json: { displayName: 'Tên Mới', bio: 'Giới thiệu', role: 'admin' } });
    assert.equal(upd.status, 200);
    assert.equal(upd.body.displayName, 'Tên Mới');
    assert.equal(upd.body.role, 'member');
    assert.equal((await api('PATCH', '/users/me', { token: u.token, json: { displayName: 'x'.repeat(51) } })).status, 400);
    assert.equal((await api('PATCH', '/users/me', { json: { displayName: 'khách' } })).status, 401);
    assert.equal((await api('GET', `/users/khongco_${uid}`)).status, 404);
  });

  test('Ảnh đại diện: PNG → 200 có url; .txt hoặc đổi đuôi giả → 400 INVALID_FILE_TYPE; thiếu file → 400 FILE_REQUIRED', async () => {
    const u = await register('ava');
    const ok = await api('PUT', '/users/me/avatar', { token: u.token, form: fileForm('avatar', [png]) });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.ok(ok.body.avatar?.url);
    const bad = await api('PUT', '/users/me/avatar', { token: u.token, form: fileForm('avatar', [txt]) });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, 'INVALID_FILE_TYPE');
    const fake = await api('PUT', '/users/me/avatar', { token: u.token, form: fileForm('avatar', [fakePng]) });
    assert.equal(fake.status, 400);
    assert.equal(fake.body.error.code, 'INVALID_FILE_TYPE');
    const none = await api('PUT', '/users/me/avatar', { token: u.token, form: fileForm('avatar', []) });
    assert.equal(none.status, 400);
    assert.equal(none.body.error.code, 'FILE_REQUIRED');
    assert.equal((await api('PUT', '/users/me/avatar', { token: admin, form: fileForm('avatar', [png]) })).status, 403);
  });
});

describe('Theo dõi và thông báo (F08, F11)', () => {
  test('BR04: không tự theo dõi, không theo dõi hai lần; số người theo dõi và danh sách đúng', async () => {
    const a = await register('fa');
    const b = await register('fb');
    assert.equal((await api('POST', '/follows', { token: a.token, json: { userId: a.user._id } })).status, 400);
    assert.equal((await api('POST', '/follows', { token: a.token, json: { userId: b.user._id } })).status, 201);
    assert.equal((await api('POST', '/follows', { token: a.token, json: { userId: b.user._id } })).status, 409);
    const prof = await api('GET', `/users/${b.user.username}`, { token: a.token });
    assert.equal(prof.body.followerCount, 1);
    assert.equal(prof.body.isFollowing, true);
    const followers = await api('GET', `/users/${b.user.username}/followers`);
    assert.deepEqual(followers.body.items.map((x) => x.username), [a.user.username]);
    assert.equal(followers.body.hasMore, false);
    const following = await api('GET', `/users/${a.user.username}/following`);
    assert.deepEqual(following.body.items.map((x) => x.username), [b.user.username]);
    assert.equal((await api('DELETE', `/follows/${b.user._id}`, { token: a.token })).body.following, false);
    assert.equal((await api('GET', `/users/${b.user.username}`)).body.followerCount, 0);
  });

  test('BR08: theo dõi tạo thông báo; bỏ rồi theo dõi lại chỉ làm mới, không tạo trùng', async () => {
    const a = await register('na');
    const b = await register('nb');
    await api('POST', '/follows', { token: a.token, json: { userId: b.user._id } });
    assert.equal((await api('GET', '/notifications/unread-count', { token: b.token })).body.count, 1);
    const list1 = (await api('GET', '/notifications', { token: b.token })).body.items;
    assert.equal(list1.length, 1);
    assert.equal(list1[0].type, 'follow');
    assert.equal(list1[0].actor.username, a.user.username);

    await api('PATCH', `/notifications/${list1[0]._id}`, { token: b.token });
    assert.equal((await api('GET', '/notifications/unread-count', { token: b.token })).body.count, 0);
    await api('DELETE', `/follows/${b.user._id}`, { token: a.token });
    await api('POST', '/follows', { token: a.token, json: { userId: b.user._id } });
    const list2 = (await api('GET', '/notifications', { token: b.token })).body.items;
    assert.equal(list2.length, 1);
    assert.equal(list2[0]._id, list1[0]._id);
    assert.equal(list2[0].isRead, false); // làm mới thì thành chưa đọc lại
    assert.equal((await api('GET', '/notifications/unread-count', { token: a.token })).body.count, 0); // người làm không nhận
  });

  test('Thông báo của người khác → 403; id sai → 404; đánh dấu tất cả đã đọc', async () => {
    const a = await register('ma');
    const b = await register('mb');
    const c = await register('mc');
    await api('POST', '/follows', { token: a.token, json: { userId: b.user._id } });
    await api('POST', '/follows', { token: c.token, json: { userId: b.user._id } });
    const [n] = (await api('GET', '/notifications', { token: b.token })).body.items;
    assert.equal((await api('PATCH', `/notifications/${n._id}`, { token: a.token })).status, 403);
    assert.equal((await api('PATCH', '/notifications/khong-phai-id', { token: b.token })).status, 404);
    assert.equal((await api('PATCH', '/notifications', { token: b.token })).body.updated, 2);
    assert.equal((await api('GET', '/notifications/unread-count', { token: b.token })).body.count, 0);
    assert.equal((await api('GET', '/notifications')).status, 401);
  });

  test('BR20: admin không theo dõi được', async () => {
    const u = await register('target');
    assert.equal((await api('POST', '/follows', { token: admin, json: { userId: u.user._id } })).status, 403);
  });
});

describe('Quản trị tài khoản (F14, F17, F18)', () => {
  test('Chỉ admin vào /admin/users; tìm theo username', async () => {
    const u = await register('adm_list');
    assert.equal((await api('GET', '/admin/users')).status, 401);
    assert.equal((await api('GET', '/admin/users', { token: u.token })).status, 403);
    const r = await api('GET', `/admin/users?q=${encodeURIComponent(u.user.username)}`, { token: admin });
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.items.map((x) => x.username), [u.user.username]);
    assert.equal(r.body.total, 1);
  });

  test('BR09: khoá chặn token cũ và đăng nhập, ẩn trang cá nhân với người khác; mở khoá thì trở lại', async () => {
    const u = await register('lockme');
    assert.equal((await api('PATCH', `/admin/users/${u.user._id}`, { token: admin, json: { isLocked: true } })).status, 200);
    const me = await api('GET', '/auth/me', { token: u.token });
    assert.equal(me.status, 403);
    assert.equal(me.body.error.code, 'ACCOUNT_LOCKED');
    assert.equal((await api('POST', '/auth/login', { json: { email: u.user.email, password: 'Test12345' } })).status, 403);
    assert.equal((await api('GET', `/users/${u.user.username}`)).status, 404);
    assert.equal((await api('GET', `/users/${u.user.username}`, { token: admin })).status, 200);
    // Tuần 3: thêm kiểm bài và bình luận bị ẩn khi B13, C12 có setAuthorLocked.

    await api('PATCH', `/admin/users/${u.user._id}`, { token: admin, json: { isLocked: false } });
    assert.equal((await api('GET', '/auth/me', { token: u.token })).status, 200);
    assert.equal((await api('GET', `/users/${u.user.username}`)).status, 200);
  });

  test('UC18: admin đặt mật khẩu tạm → token cũ 401, đăng nhập bằng mật khẩu tạm được', async () => {
    const u = await register('reset');
    await sleep(1100);
    assert.equal((await api('PUT', `/admin/users/${u.user._id}/password`, { token: admin, json: { newPassword: 'Tam123456' } })).status, 200);
    assert.equal((await api('GET', '/auth/me', { token: u.token })).status, 401);
    assert.equal((await api('POST', '/auth/login', { json: { email: u.user.email, password: 'Tam123456' } })).status, 200);
    assert.equal((await api('PUT', `/admin/users/${u.user._id}/password`, { token: u.token, json: { newPassword: 'Tam123456' } })).status, 401);
  });

  test('BR17: không tự khoá, không tự hạ quyền; admin tạo được admin; quyền tính theo DB nên hạ quyền là mất ngay', async () => {
    const me = (await api('GET', '/auth/me', { token: admin })).body;
    assert.equal((await api('PATCH', `/admin/users/${me._id}`, { token: admin, json: { isLocked: true } })).status, 400);
    assert.equal((await api('PATCH', `/admin/users/${me._id}`, { token: admin, json: { role: 'member' } })).status, 400);
    const created = await api('POST', '/admin/users', {
      token: admin,
      json: { username: `adm_${uid}`, email: `adm_${uid}@test.local`, password: 'Admin12345', role: 'admin' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.role, 'admin');
    const token2 = (await api('POST', '/auth/admin/login', { json: { email: created.body.email, password: 'Admin12345' } })).body.token;
    assert.equal((await api('GET', '/admin/users', { token: token2 })).status, 200);
    await api('PATCH', `/admin/users/${created.body._id}`, { token: admin, json: { role: 'member' } });
    assert.equal((await api('GET', '/admin/users', { token: token2 })).status, 403);
  });

  test('Admin gốc (mở rộng): admin thường không đụng được admin gốc, không trao quyền admin', async () => {
    const me = (await api('GET', '/auth/me', { token: admin })).body;
    assert.equal(me.isOwner, true, 'tài khoản seed:admin phải là admin gốc');
    const u = await register('admin2');
    await api('PATCH', `/admin/users/${u.user._id}`, { token: admin, json: { role: 'admin' } });
    const sub = (await api('POST', '/auth/admin/login', { json: { email: u.user.email, password: 'Test12345' } })).body.token;
    assert.equal((await api('GET', '/auth/me', { token: sub })).body.isOwner, false);
    for (const json of [{ role: 'member' }, { isLocked: true }]) {
      const r = await api('PATCH', `/admin/users/${me._id}`, { token: sub, json });
      assert.equal(r.status, 403);
      assert.equal(r.body.error.code, 'OWNER_ONLY');
    }
    assert.equal((await api('PUT', `/admin/users/${me._id}/password`, { token: sub, json: { newPassword: 'Hack12345' } })).status, 403);
    const other = await register('member2');
    assert.equal((await api('PATCH', `/admin/users/${other.user._id}`, { token: sub, json: { role: 'admin' } })).status, 403);
    const adminForm = { username: `adm3_${uid}`, email: `adm3_${uid}@test.local`, password: 'Admin12345', role: 'admin' };
    assert.equal((await api('POST', '/admin/users', { token: sub, json: adminForm })).status, 403);
    // Việc admin thường vẫn làm được với thành viên
    const memberForm = { username: `tv_${uid}`, email: `tv_${uid}@test.local`, password: 'Test12345', role: 'member' };
    assert.equal((await api('POST', '/admin/users', { token: sub, json: memberForm })).status, 201);
    assert.equal((await api('PATCH', `/admin/users/${other.user._id}`, { token: sub, json: { isLocked: true } })).status, 200);
    assert.equal((await api('PATCH', `/admin/users/${other.user._id}`, { token: sub, json: { isLocked: false } })).status, 200);
    // Admin gốc thu quyền lại
    assert.equal((await api('PATCH', `/admin/users/${u.user._id}`, { token: admin, json: { role: 'member' } })).status, 200);
  });
});

describe('Bài viết (B4)', () => {
  const basePost = {
    title: 'Bài kiểm thử tự động',
    content: 'Nội dung có #KiemThu và #hoian',
    location: { name: 'Hội   An' },
    tripDate: '2026-01-15',
    cost: 1000,
    visibility: 'public',
  };

  test('BR05 + BR13 + BR16: đăng bài có ảnh, tách hashtag, chuẩn hoá địa điểm', async () => {
    const u = await register('poster');
    const ok = await api('POST', '/posts', { token: u.token, form: fileForm('images', [png, png], basePost) });
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.deepEqual(ok.body.hashtags, ['kiemthu', 'hoian']);
    assert.equal(ok.body.location.nameKey, 'hoi an');
    assert.equal(ok.body.images.length, 2);
  });

  test('BR05: file không phải ảnh, quá 6 ảnh, ngày đi ở tương lai → 400; khách 401; admin 403', async () => {
    const u = await register('poster2');
    assert.equal((await api('POST', '/posts', { token: u.token, form: fileForm('images', [txt], basePost) })).status, 400);
    assert.equal((await api('POST', '/posts', { token: u.token, form: fileForm('images', Array(7).fill(png), basePost) })).status, 400);
    const future = await api('POST', '/posts', { token: u.token, form: fileForm('images', [], { ...basePost, tripDate: '2099-01-01' }) });
    assert.equal(future.status, 400);
    assert.ok(future.body.error.details.tripDate);
    assert.equal((await api('POST', '/posts', { form: fileForm('images', [], basePost) })).status, 401);
    assert.equal((await api('POST', '/posts', { token: admin, form: fileForm('images', [], basePost) })).status, 403);
  });
});

describe('Tìm người dùng (mở rộng)', () => {
  test('Không phân biệt dấu, khớp đầu từ, bỏ @; ẩn tài khoản bị khoá; không lộ email', async () => {
    const tag = `z${uid}`; // từ riêng của lần chạy này để không lẫn dữ liệu cũ
    const a = await register('sa', `Thảo ${tag}`);
    const b = await register('sb', `Đức ${tag}`);
    const names = async (q) => (await api('GET', `/users/search?q=${encodeURIComponent(q)}`)).body.map((x) => x.username).sort();
    assert.deepEqual(await names(tag), [a.user.username, b.user.username].sort());
    assert.deepEqual(await names(`@thao ${tag}`), [a.user.username]);
    assert.deepEqual(await names(`đức ${tag}`), [b.user.username]);
    assert.deepEqual(await names(tag.slice(1)), []); // không khớp giữa từ
    const r = await api('GET', `/users/search?q=${tag}`);
    assert.equal(r.body[0].email, undefined);
    assert.equal(r.body[0].searchKey, undefined);
    assert.equal((await api('GET', `/users/search?q=${encodeURIComponent('a(b[')}`)).status, 200);
    await api('PATCH', `/admin/users/${b.user._id}`, { token: admin, json: { isLocked: true } });
    assert.deepEqual(await names(tag), [a.user.username]);
    await api('PATCH', `/admin/users/${b.user._id}`, { token: admin, json: { isLocked: false } });
  });
});

describe('Định dạng lỗi', () => {
  test('Lỗi luôn theo dạng { error: { code, message } }, lỗi validate có details từng trường', async () => {
    const notFound = await api('GET', `/users/khongco_${uid}`);
    assert.equal(notFound.status, 404);
    assert.equal(typeof notFound.body.error.code, 'string');
    assert.equal(typeof notFound.body.error.message, 'string');
    const noRoute = await api('GET', '/khong-co-duong-dan-nay');
    assert.equal(noRoute.status, 404);
    assert.equal(typeof noRoute.body.error.code, 'string');
    const invalid = await api('POST', '/auth/register', { json: {} });
    assert.equal(invalid.status, 400);
    assert.ok(invalid.body.error.details.username && invalid.body.error.details.email && invalid.body.error.details.password);
  });
});
