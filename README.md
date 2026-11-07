# TravelLog – Nhật ký du lịch

Bài tập lớn cuối kỳ môn Lập trình Web, Đề 5: mạng xã hội nhỏ cho người thích du lịch. Thành viên đăng bài kể về chuyến đi (ảnh, địa điểm, ngày đi, chi phí), chọn ai được xem, theo dõi nhau, thích và bình luận. Admin xử lý bài bị báo cáo, khoá tài khoản vi phạm và xem thống kê địa điểm.

- Thiết kế: [docs/PhanTichThietKe_De5_TravelLog_v1.2.docx](docs/PhanTichThietKe_De5_TravelLog_v1.2.docx) (bản text: [docs/thiet-ke-v1.2.txt](docs/thiet-ke-v1.2.txt))
- Hợp đồng API: [docs/api-contract.md](docs/api-contract.md)
- Quy trình làm việc với Git: [CONTRIBUTING.md](CONTRIBUTING.md)

## Thành viên và phân công

| Thành viên | Phần phụ trách | Chức năng |
|---|---|---|
| A – Nguyen The Lam | Tài khoản, theo dõi, thông báo, quản lý và khoá tài khoản, giao diện sáng/tối, deploy | F01–F01d, F04, F08, F10, F11, F14, F16–F18, N04 |
| B – dinhquan-ptit | Bài viết, tìm kiếm, bản đồ | F02, F03, F05, N01 |
| C – Tqh2910 | Bảng tin, thích, bình luận, báo cáo, thống kê | F06, F07, F09, F12, F13, F15, N02 |

## Công nghệ

| Phần | Công nghệ |
|---|---|
| `server/` | NestJS (Express) + Mongoose, JWT, class-validator, Multer, Cloudinary |
| `client/` | React + Vite + React Router + Zustand, Leaflet |
| CSDL | MongoDB (Atlas khi deploy) |

TypeScript cho cả client và server.

## Cách chạy

Cần Node.js 20 trở lên và MongoDB (có Docker thì chạy `docker compose up -d` ở thư mục gốc).

```bash
# 1. Server
cd server
npm install
cp .env.example .env          # sửa JWT_SECRET thành chuỗi ngẫu nhiên dài
npm run seed:admin            # tạo admin đầu tiên từ ADMIN_EMAIL / ADMIN_PASSWORD; chạy lại không tạo trùng
npm run dev                   # http://localhost:3000/api

# 2. Client (terminal khác)
cd client
npm install
npm run dev                   # http://localhost:5173 (tự chuyển /api sang server)
```

Server chạy cổng khác 3000 thì chạy client bằng `API_PROXY=http://localhost:<cổng> npm run dev`.

## Tài khoản demo

Cập nhật sau.

## Deploy

| Phần | Địa chỉ | Nơi chạy |
|---|---|---|
| Web | https://travellog-rust.vercel.app | Vercel (thư mục `client`, preset Vite) |
| API | https://travellog-api.onrender.com/api | Render Free, Singapore (thư mục `server`) |
| CSDL | MongoDB Atlas M0 | AWS Hong Kong |

Cả Vercel và Render tự deploy khi có commit mới trên nhánh `main`, nên muốn cập nhật bản chạy thật thì merge `dev` vào `main`. Các nhánh khác chỉ có bản xem thử (Preview) trên Vercel.

Server Render miễn phí sẽ ngủ sau khoảng 15 phút không ai gọi, lần gọi đầu mất chừng 50 giây. Trước khi demo, mở https://travellog-api.onrender.com/api/health và chờ đến khi thấy `{"ok":true}`.

Biến môi trường (giá trị thật không đưa lên Git):

- Render: `NODE_VERSION`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (địa chỉ web, nhiều địa chỉ cách nhau bằng dấu phẩy), `PUBLIC_URL` (địa chỉ API). Build `npm ci --include=dev && npm run build`, start `npm start`, health check `/api/health`.
- Vercel: `VITE_API_URL` = địa chỉ API, có `/api` ở cuối.

Admin đầu tiên trên Atlas tạo bằng `npm run seed:admin` chạy từ máy, với `MONGODB_URI` và `ADMIN_*` đặt thành giá trị của Atlas.
