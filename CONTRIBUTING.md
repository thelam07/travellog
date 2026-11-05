# Quy trình làm việc

Giảng viên xem tiến độ qua lịch sử commit, nên mỗi người tự commit phần mình và push đều, không dồn đến cuối tuần.

## Nhánh

- `main`: bản nộp. Chỉ nhận merge từ `dev` vào tối Chủ nhật, sau khi cả nhóm chạy thử.
- `dev`: bản tích hợp. Chỉ nhận Pull Request từ nhánh feature.
- `feature/<a|b|c>-<chức-năng>`: mỗi chức năng một nhánh, sống 2–4 ngày. Ví dụ `feature/a-auth-login`, `feature/b-upload-anh`.

Không push thẳng lên `main` hay `dev`.

## Cài đặt một lần

Email trong `git config` phải trùng email tài khoản GitHub, nếu không commit sẽ không được tính là của bạn.

```bash
git clone https://github.com/<chủ-repo>/travellog.git
cd travellog
git config user.name  "Họ Tên"
git config user.email "email-dang-ky-github@example.com"
cp server/.env.example server/.env    # sửa giá trị thật, KHÔNG commit file này
```

## Làm một chức năng

```bash
# 1. Bắt đầu từ dev mới nhất
git switch dev
git pull
git switch -c feature/a-auth-login

# 2. Commit nhỏ, push ít nhất cuối mỗi buổi code
git add server/src/auth
git commit -m "auth: đăng nhập trả JWT hạn 1 ngày (BR11)"
git push -u origin feature/a-auth-login   # lần sau chỉ cần: git push

# 3. Lấy code mới của người khác (mỗi sáng, hoặc khi có người báo vừa merge)
git fetch origin
git merge origin/dev
git push
```

4. Mở Pull Request vào `dev` trên GitHub, điền theo mẫu. Một người khác review trong 24 giờ.
5. Merge bằng **Create a merge commit**. Không dùng Squash: squash gộp các commit thành một và làm mất lịch sử làm việc.
6. Xoá nhánh feature sau khi merge.

## Mẫu commit

`<module>: <việc đã làm>`, kèm mã luật hoặc chức năng nếu có:

```
posts: chặn bài followers ở GET /posts/:id (BR01)
feed: phân trang bằng con trỏ (BR12)
client: trang đăng nhập hiện lỗi dưới từng trường
```

## File dùng chung

`server/src/app.module.ts`, `client/src/routes.tsx`, `client/src/styles.css`, `client/src/types/index.ts`, `docs/api-contract.md`:

- Sửa ít dòng, để trong PR riêng hoặc PR nhỏ, báo nhóm khi merge.
- Đổi API thì sửa `docs/api-contract.md` và `client/src/types/index.ts` trong cùng PR.
- Conflict ở phần của người khác thì hỏi người đó trước khi sửa.

## Không commit

`.env`, `node_modules/`, `dist/`, `uploads/`. Chỉ commit `.env.example`.
Lỡ đẩy `.env` lên thì đổi ngay `JWT_SECRET`, mật khẩu admin và các API key.

## Cuối tuần

Tối Chủ nhật A mở PR `dev` → `main`. Cả nhóm chạy thử bản `dev`, merge, rồi gắn tag mốc tuần:

```bash
git switch main && git pull
git tag tuan-1
git push origin tuan-1
```
