# Hợp đồng API TravelLog

Chi tiết hoá mục 6.1 của [thiet-ke-v1.2.txt](thiet-ke-v1.2.txt). Kiểu dữ liệu ở [client/src/types/index.ts](../client/src/types/index.ts).

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

## Users, follows

| Method | URL | Body / query | Trả về |
|---|---|---|---|
| GET | /users/suggestions | | `UserSummary[]` (tối đa 5, N02) |
| GET | /users/:username | | `Profile` |
| GET | /users/:username/followers | `?cursor` | `CursorPage<UserSummary>` |
| GET | /users/:username/following | `?cursor` | `CursorPage<UserSummary>` |
| GET | /users/:username/map | | `MapPoint[]` (bài có toạ độ, đã lọc quyền xem) |
| PATCH | /users/me | `{ displayName?, bio? }` | `User` |
| PUT | /users/me/avatar | multipart, trường `avatar` | `User` |
| POST | /follows | `{ userId }` | 201 `{ following: true }` |
| DELETE | /follows/:userId | | `{ following: false }` |

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
