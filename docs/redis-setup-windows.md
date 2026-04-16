# Hướng dẫn cài đặt và khởi động Redis trên Windows

> Tài liệu dành cho các collaborator tham gia dự án **Sports Field Booking Platform**.  
> Redis được sử dụng cho **Socket.IO Adapter** (pub/sub) và **cache thông báo realtime**.

---

## 📋 Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Tải Redis Portable cho Windows](#2-tải-redis-portable-cho-windows)
3. [Cấu hình biến môi trường](#3-cấu-hình-biến-môi-trường)
4. [Khởi động Redis Server](#4-khởi-động-redis-server)
5. [Kiểm tra kết nối](#5-kiểm-tra-kết-nối)
6. [Xử lý lỗi thường gặp](#6-xử-lý-lỗi-thường-gặp)
7. [Dừng Redis Server](#7-dừng-redis-server)

---

## 1. Yêu cầu hệ thống

| Yêu cầu         | Chi tiết                        |
|------------------|---------------------------------|
| Hệ điều hành    | Windows 10 / 11 (64-bit)       |
| Redis version    | Redis for Windows 3.x (MSOpenTech) |
| Port mặc định   | `6379`                          |

> [!NOTE]
> Dự án đã bao gồm sẵn Redis portable trong thư mục `redis/` ở root project. **Bạn KHÔNG cần cài đặt Redis riêng** — chỉ cần chạy file bat có sẵn.

---

## 2. Tải Redis Portable cho Windows

### Cách 1: Sử dụng Redis đã có sẵn trong project (Khuyến nghị)

Thư mục `redis/` đã nằm sẵn trong repository với các file cần thiết:

```
sports-field-booking-platform/
├── redis/
│   ├── redis-server.exe          # Redis server
│   ├── redis-cli.exe             # Redis CLI client
│   ├── redis.windows.conf        # File cấu hình cho Windows
│   └── ...
├── start-redis.bat               # Script khởi động nhanh
└── ...
```

### Cách 2: Tải Redis mới (nếu thư mục `redis/` bị thiếu)

1. Truy cập: https://github.com/microsoftarchive/redis/releases
2. Tải file **Redis-x64-3.0.504.zip** (hoặc bản mới nhất)
3. Giải nén vào thư mục `redis/` ở root project:
   ```
   sports-field-booking-platform/redis/
   ```

---

## 3. Cấu hình biến môi trường

### Bước 1: Tạo file `.env` cho backend

Copy file `.env.example` và đổi tên thành `.env`:

```powershell
cd server\backend
copy .env.example .env
```

### Bước 2: Đảm bảo có biến `REDIS_URL`

Mở file `server/backend/.env` và kiểm tra dòng sau:

```env
# --- REDIS ---
REDIS_URL=redis://127.0.0.1:6379
```

> [!IMPORTANT]
> **Bắt buộc sử dụng `127.0.0.1`** thay vì `localhost`.  
> Trên Windows, `localhost` có thể resolve sang IPv6 (`::1`) gây lỗi `ECONNREFUSED`.  
> Redis for Windows chỉ lắng nghe trên IPv4 (`127.0.0.1`).

### Tham khảo: Cấu hình Redis trong code

File `server/backend/src/lib/redis.ts` sử dụng biến `REDIS_URL`:

```typescript
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});
```

Nếu không có biến `REDIS_URL`, mặc định sẽ kết nối tới `redis://127.0.0.1:6379`.

---

## 4. Khởi động Redis Server

### Cách 1: Dùng file `.bat` có sẵn (Đơn giản nhất)

Từ **root project**, double-click hoặc chạy:

```powershell
.\start-redis.bat
```

Nội dung file `start-redis.bat`:
```bat
@echo off
echo Starting Redis Server...
cd redis
redis-server.exe redis.windows.conf
pause
```

### Cách 2: Chạy thủ công bằng Terminal

```powershell
cd redis
.\redis-server.exe redis.windows.conf
```

### Kết quả mong đợi

Khi khởi động thành công, terminal sẽ hiển thị:

```
                _._
           _.-``__ ''-._
      _.-``    `.  `_.  ''-._           Redis 3.0.504 (00000000/0) 64 bit
  .-`` .-```.  ```\/    _.,_ ''-._
 (    '      ,       .-`  | `,    )     Running in standalone mode
 |`-._`-...-` __...-.``-._|'` _.-'|     Port: 6379
 |    `-._   `._    /     _.-'    |     PID: xxxxx
  `-._    `-._  `-./  _.-'    _.-'
 |`-._`-._    `-.__.-'    _.-'_.-'|
 |    `-._`-._        _.-'_.-'    |
  `-._    `-._`-.__.-'_.-'    _.-'
      `-._    `-.__.-'    _.-'
          `-._        _.-'
              `-.__.-'

[xxxxx] ... The server is now ready to accept connections on port 6379
```

> [!WARNING]
> **Giữ nguyên cửa sổ terminal này mở** trong suốt quá trình phát triển.  
> Nếu đóng terminal, Redis server sẽ dừng và backend sẽ mất kết nối.

---

## 5. Kiểm tra kết nối

### Kiểm tra bằng Redis CLI

Mở một terminal **mới** (giữ nguyên terminal Redis server):

```powershell
cd redis
.\redis-cli.exe
```

Sau đó gõ lệnh `PING`:

```
127.0.0.1:6379> PING
PONG
```

Nhận được `PONG` nghĩa là Redis đang chạy bình thường. Gõ `exit` để thoát.

### Kiểm tra từ Backend

Khi khởi động backend (`npm run dev` trong `server/backend`), console sẽ hiển thị:

```
✓ Redis connected
✓ Socket.io server ready
```

---

## 6. Xử lý lỗi thường gặp

### ❌ Lỗi `ECONNREFUSED ::1:6379`

**Nguyên nhân:** Backend đang cố kết nối qua IPv6 (`::1`) nhưng Redis chỉ hỗ trợ IPv4.

**Cách fix:** Đảm bảo `REDIS_URL` trong file `.env` dùng `127.0.0.1`:

```env
REDIS_URL=redis://127.0.0.1:6379
```

❗ **KHÔNG** dùng `redis://localhost:6379`

---

### ❌ Lỗi `ECONNREFUSED 127.0.0.1:6379`

**Nguyên nhân:** Redis server chưa được khởi động.

**Cách fix:**
1. Chạy `start-redis.bat` hoặc `.\redis\redis-server.exe redis\redis.windows.conf`
2. Đảm bảo terminal Redis vẫn đang mở
3. Kiểm tra port 6379 chưa bị chiếm bởi ứng dụng khác:
   ```powershell
   netstat -ano | findstr :6379
   ```

---

### ❌ Lỗi `Could not create server TCP listening socket 127.0.0.1:6379: bind: No error`

**Nguyên nhân:** Đã có một instance Redis đang chạy trên port 6379.

**Cách fix:**
1. Đóng cửa sổ Redis cũ, hoặc
2. Kill process đang chiếm port:
   ```powershell
   # Tìm PID đang dùng port 6379
   netstat -ano | findstr :6379

   # Kill process (thay <PID> bằng số PID tìm được)
   taskkill /PID <PID> /F
   ```

---

### ❌ Lỗi `redis-server.exe không tìm thấy`

**Nguyên nhân:** Thư mục `redis/` chưa có hoặc file bị thiếu.

**Cách fix:**
1. Kiểm tra thư mục `redis/` có tồn tại ở root project không
2. Nếu không, tải theo hướng dẫn ở [Mục 2](#2-tải-redis-portable-cho-windows)

---

## 7. Dừng Redis Server

### Cách 1: Dùng Redis CLI

```powershell
cd redis
.\redis-cli.exe SHUTDOWN
```

### Cách 2: Đóng terminal

Nhấn `Ctrl + C` trong cửa sổ terminal đang chạy Redis server, sau đó nhấn `Y` để xác nhận.

---

## 📌 Tóm tắt nhanh — Quy trình khởi động dự án

Thứ tự khởi động các service khi bắt đầu code:

```
1️⃣  Khởi động Redis        →  double-click start-redis.bat
2️⃣  Khởi động Backend      →  cd server/backend && npm run dev
3️⃣  Khởi động Frontend     →  cd client/frontend && npm run dev
```

> [!TIP]
> Mở 3 terminal riêng biệt cho mỗi service để dễ theo dõi log.

---

## 📎 Tham khảo thêm

| Tài liệu                  | Link                                                     |
|---------------------------|----------------------------------------------------------|
| Redis Commands             | https://redis.io/commands                                |
| ioredis (Node.js client)   | https://github.com/redis/ioredis                         |
| Socket.IO Redis Adapter    | https://socket.io/docs/v4/redis-adapter/                 |
| Redis for Windows (MSOpenTech) | https://github.com/microsoftarchive/redis/releases   |
