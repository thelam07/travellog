# Hợp đồng API TravelLog

Chi tiết hoá mục 6.1 của [thiet-ke-v1.3.txt](thiet-ke-v1.3.txt). Kiểu dữ liệu ở [client/src/types/index.ts](../client/src/types/index.ts).

- Tiền tố `/api`, JSON. Server dev: `http://localhost:3000`.
- Header: `Authorization: Bearer <token>`.
- Lỗi: `{ error: { code, message, details? } }`. `details` là `{ tênTrường: [thông báo] }` khi lỗi 400 do validate.
- Danh sách cuộn vô hạn: `CursorPage<T>` = `{ items, nextCursor, hasMore }`, truyền lại `?cursor=<nextCursor>`.
- Bảng quản trị: `PagedList<T>` = `{ items, page, limit, total }`, `?page=1` (limit 20).
- Ngày giờ trả về dạng chuỗi ISO.

## Auth

| Method | URL | Body | Trả về |
|---|---|---|---|
| POST | /auth/register | `{ username, email, password }` | 201 `AuthResponse` |
| POST | /auth/login | `{ email, password }` | `AuthResponse`; admin → 403 `ADMIN_USE_ADMIN_LOGIN` |
| POST | /auth/admin/login | `{ email, password }` | `AuthResponse`; không phải admin → 403 |
| GET | /auth/me | | `User` |
| PATCH | /auth/password | `{ currentPassword, newPassword }` | `{ token }` (token mới, token cũ hết hiệu lực) |

Chặn dò mật khẩu (BR25, mở rộng): hai API đăng nhập giới hạn mỗi IP thử một email 5 lần/phút và mỗi IP 30 lần/phút, đếm cả lần đúng lẫn sai. Quá giới hạn trả 429 `TOO_MANY_REQUESTS` kèm câu báo đợi 1 phút. Các API khác (kể cả đăng ký) không bị giới hạn.

## Users, follows

| Method | URL | Body / query | Trả về |
|---|---|---|---|
| GET | /users/search | `?q` (bỏ `@` ở đầu, tối đa 50 kí tự) | `UserSummary[]` (tối đa 10; mở rộng ngoài thiết kế, xem dưới) |
| GET | /users/suggestions | | `UserSummary[]` (tối đa 5, N02) |
| GET | /users/:username | | `Profile` |
| GET | /users/:username/followers | `?cursor` | `CursorPage<UserSummary>` |
| GET | /users/:username/following | `?cursor` | `CursorPage<UserSummary>` |
| GET | /users/:username/map | | `MapPoint[]` (bài có toạ độ, đã lọc quyền xem) |
| PATCH | /users/me | `{ displayName?, bio? }` | `User` |
| PUT | /users/me/avatar | multipart, trường `avatar` | `User` |
| POST | /follows | `{ userId }` | 201 `{ following: true }` |
| DELETE | /follows/:userId | | `{ following: false }` |

`/users/search`: khách cũng gọi được. Không phân biệt dấu, khớp đầu một từ trong tên hiển thị hoặc username: `lan`, `@lan`, `nguyen`, `Nguyễn` đều ra Lan Nguyễn, còn `an` thì không. Chỉ trả thành viên đang hoạt động (không admin, không tài khoản bị khoá), sắp theo username. `q` rỗng trả `[]`.

## Posts

| Method | URL | Body / query | Trả về |
|---|---|---|---|
| GET | /posts | `?q&tag&author(username)&minCost&maxCost&cursor` | `CursorPage<Post>` |
| GET | /feed | `?cursor&limit=10` | `CursorPage<Post>` |
| GET | /posts/:id | | `Post` |
| POST | /posts | multipart: `title, content, location (chuỗi JSON PostLocation không có nameKey), tripDate (YYYY-MM-DD), cost, visibility, images[]` | 201 `Post` |
| PATCH | /posts/:id | multipart: như trên (tuỳ chọn) + `keepImageIds` (chuỗi JSON mảng _id ảnh giữ lại) + `images[]` mới | `Post` |
| DELETE | /posts/:id | | `{ deleted: true }` |
| POST | /posts/:id/likes | | 201 `{ liked: true, likeCount }` |
| DELETE | /posts/:id/likes | | `{ liked: false, likeCount }` |
| GET | /posts/:id/comments | `?cursor` | `CursorPage<Comment>` (bình luận gốc, kèm `replies`) |
| POST | /posts/:id/comments | `{ content, parentId? }` | 201 `Comment` |
| DELETE | /comments/:id | | `{ deleted: n }` |

`q` bắt đầu bằng `#` được hiểu là hashtag; client nên tách sẵn thành `tag`.

## Places

| Method | URL | Query | Trả về |
|---|---|---|---|
| GET | /places/autocomplete | `?q&sessionToken` | `PlaceSuggestion[]`; 502 khi Google lỗi / chưa cấu hình |
| GET | /places/:placeId | `?sessionToken` | `PlaceDetail` |

## Notifications, reports

| Method | URL | Body / query | Trả về |
|---|---|---|---|
| GET | /notifications | `?cursor` | `CursorPage<Notification>` |
| GET | /notifications/unread-count | | `{ count }` |
| PATCH | /notifications/:id | | `Notification` (đã đọc) |
| PATCH | /notifications | | `{ updated }` |
| POST | /reports | `{ postId, reason, note? }` | 201 `Report` |

Thông báo tức thời (N03, Socket.IO): client nối tới gốc server (không có `/api`), gửi `auth: { token }`. Chỉ thành viên được giữ kết nối, token sai, bị khoá hoặc là admin thì server ngắt ngay.

- Sự kiện `notification`: `{ notification: Notification, unreadCount }`, gửi mỗi khi `notify()` tạo hoặc làm mới thông báo.
- Admin khoá tài khoản hoặc đặt mật khẩu tạm thì server ngắt kết nối; client gọi lại API để biết phiên đã hết.
- Polling `/notifications/unread-count` 30 giây vẫn giữ để dự phòng.

## Admin

| Method | URL | Body / query | Trả về |
|---|---|---|---|
| GET | /reports | `?status&page` | `PagedList<Report>` |
| PATCH | /reports/:id | `{ status: 'resolved' \| 'rejected', hidePost?: boolean }` | `{ updated }` |
| PATCH | /admin/posts/:id | `{ status: 'active' \| 'hidden' }` | `Post` |
| GET | /admin/users | `?q&page` | `PagedList<User>` |
| POST | /admin/users | `{ username, email, password, role }` | 201 `User` |
| PATCH | /admin/users/:id | `{ isLocked?, role? }` | `User` |
| PUT | /admin/users/:id/password | `{ newPassword }` | `{ ok: true }` |
| GET | /stats/locations | `?limit=10` | `LocationStat[]` |

Admin gốc (mở rộng ngoài thiết kế): `User` có thêm `isOwner`. Admin đầu tiên (`seed:admin`, hoặc admin tạo sớm nhất khi DB có từ trước) là admin gốc, chỉ có một.

- Không ai khoá, đổi vai trò hay đặt lại mật khẩu được admin gốc → 403 `OWNER_ONLY`.
- Chỉ admin gốc được trao hoặc thu quyền admin: `PATCH /admin/users/:id` đổi `role`, hoặc `POST /admin/users` với `role: 'admin'`. Admin khác làm thì nhận 403 `OWNER_ONLY`. Gửi `role` trùng vai trò hiện tại không tính là đổi.
- Admin thường vẫn tạo, khoá, mở khoá và đặt mật khẩu tạm cho thành viên.
