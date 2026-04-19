# Sports Field Booking Platform

Nền tảng đặt sân thể thao đa vai trò (khách hàng, chủ sân, quản trị viên), hỗ trợ:
- Tra cứu câu lạc bộ/sân theo vị trí, bộ môn, khung giờ.
- Đặt sân nhiều slot, áp voucher, thanh toán, theo dõi trạng thái đơn.
- Vận hành chủ sân: quản lý CLB, sân, giá, lịch, khách hàng, bài đăng, khuyến mãi.
- Vận hành admin: duyệt KYC/chủ sân, quản trị người dùng, giám sát hệ thống.
- Real-time với Socket.IO, chatbot AI hỗ trợ tìm sân/đặt sân.

## 1) Tổng quan kiến truc hệ thống

Hệ thống được tổ chức theo kiến truc monorepo:

- `client/frontend`: Ứng dụng frontend Vue 3 + Vite.
- `server/backend`: API server Next.js (App Router) + Prisma + PostgreSQL.
- `docker` + `docker-compose*.yml`: Môi trường container cho dev/prod.
- `docs`: Tài liệu kiến truc, database, API, deploy.
- `script`: Script test nhanh API/DB nội bộ.

Luồng xử lý chính:
1. Frontend gửi request đến API (`/api/...`) kèm JWT khi cần xác thực.
2. Route handler ở backend validate dữ liệu (Zod), kiểm tra quyền, gọi service theo domain.
3. Service thao tác dữ liệu qua Prisma, phát sự kiện realtime qua Socket.IO khi cần.
4. Backend trả response chuẩn hóa (`success`, `message`, `data`).

## 2) Công nghệ và stack

### Frontend (`client/frontend`)
- Vue 3, Vue Router, Vite
- Axios
- Bootstrap + Font Awesome + Lucide
- Mapbox GL JS
- Socket.IO Client
- AI SDK cho Vue (`@ai-sdk/vue`)

### Backend (`server/backend`)
- Next.js 16 (App Router dùng như API server)
- TypeScript + `tsx`
- Prisma ORM + PostgreSQL
- Socket.IO + Redis adapter (`@socket.io/redis-adapter`, `ioredis`)
- JWT, Google Login, Facebook Login
- Stripe SDK, Cloudinary, Nodemailer
- AI SDK + Google provider (`ai`, `@ai-sdk/google`)
- Cron job (`node-cron`) cho nghiệp vụ tự động
- Unit test bằng Vitest

## 3) Chuc nang nghiep vu

### Khách hàng (`USER`)
- Đăng ký/đăng nhập, đổi/quên/reset mật khẩu
- Xem danh sách CLB/sân, tìm sân gần vị trí
- Xem chi tiết CLB theo `slug`, xem slot trống theo sân/ngày
- Tạo booking, thanh toán, theo dõi đơn theo mã
- Quản lý yêu thích (clubs/courts)
- Đánh giá sau đặt sân
- Xem thông báo và bài đăng từ CLB
- Tương tác chatbot AI

### Chủ sân (`OWNER`)
- Onboarding/KYC hồ sơ chủ sân
- Quản lý CLB, sân, tiện ích, giờ mở cửa, khung giá
- Quản lý slot, lock slot, booking của CLB
- Tạo booking tay tại quầy, xác nhận thanh toán tiền mặt
- Quản lý khách hàng CLB, lịch sử tiêu dùng
- Quản lý voucher/marketing post
- Xử lý yêu cầu hoàn tiền

### Quản trị viên (`ADMIN`)
- Quản lý người dùng/chủ sân
- Duyệt KYC
- Duyệt trạng thái CLB/sân
- Theo dõi số liệu tổng quan hệ thống

## 4) API surface (nhóm endpoint chính)

Backend hiện có 60+ route handlers trong `server/backend/src/app/api`, các nhóm chính:

- `auth/*`: `login`, `register`, `logout`, `forgot-password`, `reset-password`, social login
- `users/*`: hồ sơ cá nhân, đổi mật khẩu
- `clubs/*`, `courts/*`, `bookings/*`, `reviews/*`, `favorites/*`
- `vouchers/*`, `notifications/*`, `posts/*`
- `payments/*`: webhook/xác thực thanh toán
- `owner/*`: toàn bộ API nghiệp vụ chủ sân
- `admin/*`: toàn bộ API vận hành quản trị
- `chat`: API trợ lý AI
- `upload`: upload ảnh

Response chuẩn được dùng xuyên suốt:

```json
{
  "success": true,
  "message": "Thong bao",
  "data": {}
}
```

## 5) Cơ sở dữ liệu (Prisma + PostgreSQL)

Schema tại `server/backend/prisma/schema.prisma` với các cụm model chính:

- **Identity & Auth**: `User`, `UserProfile`, `Session`, `PasswordReset`, `OwnerProfile`
- **Club & Court**: `Club`, `ClubImage`, `OpeningHour`, `Court`, `CourtImage`
- **Pricing & Slot**: `CourtPricing`, `SpecialDatePricing`, `TimeSlot`
- **Booking & Payment**: `Booking`, `BookingItem`, `BookingService`, `Payment`, `BookingStatusHistory`
- **Engagement & Marketing**: `Review`, `ReviewImage`, `Voucher`, `VoucherUsage`, `Post`, `Notification`
- **CRM & Governance**: `ClubCustomer`, `AuditLog`, `SystemConfig`, `FavoriteClub`, `FavoriteCourt`

Enums nghiệp vụ quan trọng:
- `Role`: `USER`, `OWNER`, `ADMIN`
- `SportType`: `FOOTBALL`, `BADMINTON`, `TENNIS`, `PICKLEBALL`, `BASKETBALL`, ...
- `BookingStatus`: `PENDING`, `WAITING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `COMPLETED`
- `PaymentStatus`: `PENDING`, `WAITING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `REFUNDED`

## 6) Real-time, jobs, automation

- Socket server khởi tạo trong `server/backend/server.ts`.
- Listener domain:
  - `src/modules/booking/booking.listener.ts`
  - `src/modules/slot/slot.listener.ts`
- Cron job `expire-bookings.job.ts` chạy mỗi phút để:
  - Tìm booking `WAITING_PAYMENT` quá hạn.
  - Chuyển trạng thái booking/payment sang `CANCELLED`.
  - Giải phóng lại `TimeSlot` thành `AVAILABLE`.
  - Phát tín hiệu realtime cho client.

## 7) Cấu trúc thư mục dự án

```text
source/
├── client/
│   └── frontend/                 # Vue 3 app
├── server/
│   └── backend/                  # Next.js API + Prisma + Socket + jobs
├── docs/                         # Tài liệu hệ thống
│   ├── _architecture/
│   ├── _api/
│   ├── _database/
│   ├── _deploy/
│   ├── _mac/
│   └── _redis/
├── docker/
│   ├── client.Dockerfile
│   ├── server.Dockerfile
│   └── postgres/init.sql
├── docker-compose.dev.yml
├── docker-compose.yml
└── script/
    └── test/
```

## 8) Huong dan chay du an

### 8.1 Yêu cầu môi trường
- Node.js: theo engine trong `package.json` (`^20.19.0` hoặc `>=22.12.0`)
- npm
- PostgreSQL
- Redis

### 8.2 Chạy bằng Docker (khuyến nghị cho onboarding nhanh)

```bash
# 1) Tao file env root
cp .env.example .env

# 2) Khoi dong moi truong dev
docker compose -f docker-compose.dev.yml up -d
```

Ghi chú:
- `docker-compose.dev.yml` đã gồm `postgres`, `redis`, `backend`, `frontend`.
- `docker-compose.yml` dành cho profile production.

### 8.3 Chạy local (không Docker)

1) Backend:
```bash
cd server/backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

2) Frontend:
```bash
cd client/frontend
cp .env.example .env
npm install
npm run dev
```

## 9) Biến môi trường quan trọng

### Root (`.env`) - dùng cho Docker Compose
- `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`

### Backend (`server/backend/.env`)
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `SMTP_*` (forgot/reset password)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `CLOUDINARY_*`
- `GEMINI_API_KEY` / `GOOGLE_CLOUD_API_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

### Frontend (`client/frontend/.env`)
- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_MAPBOX_TOKEN`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_FACEBOOK_APP_ID`

## 10) Scripts chính

### Backend
- `npm run dev`: chạy server dev
- `npm run build`: build Next.js backend
- `npm run start`: chạy production build
- `npm run lint`: lint code
- `npm run test`: chạy test Vitest
- `npm run seed:config`, `npm run seed:vouchers`, `npm run seed:vouchers-test`

### Frontend
- `npm run dev`
- `npm run build`
- `npm run preview`

## 11) Tài liệu chi tiết

- Kiến trúc: `docs/_architecture/system-architecture.md`
- Database design: `docs/_database/database-design.md`
- API tổng quan: `docs/_api/api-system.md`
- Deploy production: `docs/_deploy/deployment.md`
- Setup local macOS: `docs/_mac/local-setup-mac.md`
- Redis trên Windows: `docs/_redis/redis-setup-windows.md`

## 12) Kiểm thử và chất lượng

- Có test cho chatbot tools trong `server/backend/src/app/api/chat/*.test.ts`.
- Khuyến nghị thêm test cho booking/payment/refund và owner/admin workflows trước khi go-live.

## 13) Luu y van hanh

- Không commit thông tin nhạy cảm trong `.env`.
- Đổi `JWT_SECRET` khác mặc định trước khi deploy.
- Bật HTTPS, giới hạn CORS, và cấu hình backup DB định kỳ ở production.

## 14) License

Dự án phục vụ mục tiêu đồ án tốt nghiệp và thuộc quyền sở hữu của nhóm phát triển.

