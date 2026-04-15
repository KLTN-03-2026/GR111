# 🚀 Deployment Guide - Sports Field Booking Platform

Tài liệu này hướng dẫn các bước triển khai hệ thống lên môi trường Production.

---

## 🏗️ 1. Yêu cầu Hệ thống (Prerequisites)

- **Runtime**: Node.js 18.x trở lên.
- **Database**: PostgreSQL 14+ (Ví dụ: Supabase, Railway, RDS).
- **In-Memory Cache**: Redis 6+ (Ví dụ: Upstash, Redis Cloud).
- **Storage**: Cloudinary Account (để lưu trữ hình ảnh).
- **Hosting**: Vercel, AWS, Google Cloud, hoặc VPS Docker.

---

## 🔑 2. Cấu hình Biến môi trường (Environment Variables)

Sao chép `.env.example` thành `.env` trên server và cập nhật các giá trị thực tế.

### Backend (.env)
```env
# Database & Redis
DATABASE_URL="postgresql://user:pass@host:port/dbname?schema=public"
REDIS_URL="redis://:pass@host:port"

# Authentication
JWT_SECRET="your_super_secret_key"
NEXTAUTH_SECRET="another_secret_key"

# AI & Third-party
GEMINI_API_KEY="AI_KEY_HERE"
CLOUDINARY_URL="cloudinary://key:secret@name"

# Payment (VNPAY/MOMO)
VNPAY_TMN_CODE="..."
VNPAY_HASH_SECRET="..."
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_SOCKET_URL="https://api.yourdomain.com"
```

---

## 🛠️ 3. Các bước triển khai Backend

### Bước 1: Cài đặt Dependencies
```bash
cd server/backend
npm install --production=false # Cần devDeps để build
```

### Bước 2: Database Migration
```bash
# Đẩy schema lên database production
npx prisma migrate deploy

# (Tùy chọn) Seed dữ liệu khởi tạo
npx prisma db seed
```

### Bước 3: Build & Start
```bash
npm run build
npm run start
```
*Lưu ý: Nếu sử dụng PM2 trên VPS:*
```bash
pm2 start npm --name "court-booking-be" -- start
```

---

## 💻 4. Các bước triển khai Frontend

### Bước 1: Cài đặt & Build
```bash
cd client/frontend
npm install
npm run build
```

### Bước 2: Deploy
- **Nếu dùng Vercel/Netlify**: Chỉ cần kết nối repo và chọn framework tương ứng.
- **Nếu dùng Nginx**: Trỏ root tới thư mục `dist` hoặc `out`.

---

## 🔄 5. CI/CD Pipeline (GitHub Actions)

Khuyến khích thiết lập workflow tự động:

1. **Lint & Test**: Kiểm tra code style và chạy unit test.
2. **Prisma Validate**: Kiểm tra tính đồng nhất của Schema.
3. **Build Image**: (Nếu dùng Docker) Đẩy image lên Docker Hub/Registry.
4. **Auto Deploy**: Kích hoạt lệnh deploy trên Server/Hosting qua Webhook.

---

## 🛡️ 6. Checklist trước khi Go-live

- [ ] Đã chạy `prisma migrate deploy`.
- [ ] Đã cấu hình HTTPS/SSL.
- [ ] Đã tắt chế độ Debug/Test trong các cổng thanh toán (VNPAY/MOMO).
- [ ] Đã giới hạn CORS chỉ cho phép domain frontend truy cập backend.
- [ ] Đã cấu hình Backup định kỳ cho cơ sở dữ liệu.
