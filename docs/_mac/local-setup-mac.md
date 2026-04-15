# Hướng dẫn chạy toàn bộ hệ thống trên Local (Native) - macOS

Tài liệu này hướng dẫn cách chạy toàn bộ hệ thống (Frontend, Backend, Database, Redis) trực tiếp trên macOS mà không cần sử dụng Docker. Cách này phù hợp cho các collaborator không muốn hoặc không thể cài đặt Docker trên máy.

> [!IMPORTANT]
> **Dành cho Collaborator không có Docker:** Nếu bạn không muốn sử dụng Docker, hãy thực hiện cài đặt Native thông qua Homebrew theo hướng dẫn bên dưới. Mọi dịch vụ sẽ chạy trực tiếp trên cổng localhost máy bạn.

---

## 1. Cài đặt các thành phần phụ trợ (Prerequisites)

Sử dụng **Homebrew** để cài đặt các dịch vụ cần thiết:

### A. Cài đặt PostgreSQL (Database)
```bash
brew install postgresql@16
brew services start postgresql@16
```
- Tạo database: `createdb sports-booking`

### B. Cài đặt Redis (Socket & Cache)
```bash
brew install redis
brew services start redis
```

---

## 2. Cấu hình và chạy Backend

Di chuyển vào thư mục backend:
```bash
cd server/backend
```

### A. Cài đặt dependencies
```bash
npm install
```

### B. Cấu hình biến môi trường (.env)
Tạo file `.env` từ `.env.example`. Chỉnh sửa các giá trị quan trọng:

```env
# Database & Redis
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sports-booking?schema=public"
REDIS_URL="redis://127.0.0.1:6379"

# Cấu hình Port cho Backend (Ví dụ: 4000 để tránh trùng với Frontend)
PORT=4000
JWT_SECRET="your-super-secret-key"
```

### C. Khởi tạo Database (Prisma)
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed:config
```

### D. Chạy Backend
```bash
npm run dev
```
Backend sẽ chạy tại: `http://localhost:4000` (nếu bạn đặt PORT=4000).

---

## 3. Cấu hình và chạy Frontend

Mở một Terminal mới:
```bash
cd client/frontend
npm install
```

### A. Cấu hình biến môi trường (.env)
Tạo file `.env` trỏ tới Backend bạn vừa chạy:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

### B. Chạy Frontend
```bash
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:3000` (hoặc cổng hiển thị trên Terminal).


---

## 4. Bảng so sánh Local (Native) vs Docker

| Thành phần | Local (Native) | Docker (dev) |
| :--- | :--- | :--- |
| **PostgreSQL** | `localhost:5432` | `localhost:5432` |
| **Redis** | `localhost:6379` | `localhost:6379` |
| **Backend URL** | `http://localhost:4000` | `http://localhost:4000` |
| **REDIS_URL** | `redis://localhost:6379` | `redis://redis:6379` |
| **DATABASE_URL** | Host: `localhost` | Host: `postgres` |

---

## Lưu ý quan trọng
- Khi chạy local (Native), các dịch vụ cần giao tiếp qua `localhost`.
- Đảm bảo các cổng (5432, 6379, 4000, 3000) không bị chiếm dụng bởi các ứng dụng khác.
- Nếu gặp lỗi "Connection refused", hãy kiểm tra xem service (Postgres/Redis) đã được start chưa bằng lệnh: `brew services list`.
