# Hướng dẫn cài đặt và chạy Redis trên macOS

Tài liệu này hướng dẫn cách cài đặt và vận hành Redis cho hệ thống **Sports Field Booking Platform** trên hệ điều hành macOS.

> [!TIP]
> **Dành cho Collaborator không có Docker:** Nếu bạn không muốn sử dụng Docker, hãy sử dụng **Cách 2 (Sử dụng Homebrew)** để chạy Redis trực tiếp trên máy Mac của mình. Hướng dẫn chi tiết nằm ở phần dưới của file này.

---

## Cách 1: Sử dụng Docker (Khuyên dùng)

Đây là cách đơn giản nhất vì hệ thống đã có sẵn cấu hình Docker.

### 1. Yêu cầu
- Đã cài đặt [Docker Desktop cho Mac](https://www.docker.com/products/docker-desktop/).

### 2. Các bước thực hiện
Mở Terminal tại thư mục gốc của dự án và chạy lệnh sau:

```bash
# Chỉ khởi chạy riêng dịch vụ Redis trong file dev
docker compose -f docker-compose.dev.yml up -d redis
```

### 3. Kiểm tra trạng thái
```bash
docker ps | grep redis
```
Nếu thấy container `sports_booking_redis_dev` đang chạy là thành công.

---

## Cách 2: Cài đặt trực tiếp bằng Homebrew (Native)

Nếu bạn không muốn dùng Docker, bạn có thể cài đặt trực tiếp lên macOS.

### 1. Cài đặt Homebrew (nếu chưa có)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Cài đặt Redis
```bash
brew install redis
```

### 3. Khởi chạy Redis Service
Bạn có 2 lựa chọn:

- **Chạy như một dịch vụ ngầm (tự khởi động cùng máy):**
  ```bash
  brew services start redis
  ```

- **Chạy thủ công ở cửa sổ Terminal hiện tại:**
  ```bash
  redis-server
  ```

### 4. Kiểm tra kết nối
Mở một Terminal mới và gõ:
```bash
redis-cli ping
```
Nếu nhận được phản hồi `PONG`, Redis đã sẵn sàng.

---

## Cấu hình biến môi trường (.env)

Sau khi Redis đã chạy, hãy đảm bảo các file cấu hình backend được trỏ đến đúng địa chỉ:

- **Nếu dùng Docker cho cả Backend:**
  Sử dụng hostname `redis` (đã được cấu hình trong `docker-compose.dev.yml`):
  ```env
  REDIS_URL=redis://redis:6379
  ```

- **Nếu chạy Backend trực tiếp trên máy (npm run dev):**
  Sử dụng `localhost`:
  ```env
  REDIS_URL=redis://localhost:6379
  ```

---

## Xử lý sự cố thường gặp

### Lỗi: Port 6379 already in use
Nếu bạn gặp lỗi này, có nghĩa là đã có một phiên bản Redis khác đang chạy.
- Tìm Process ID: `lsof -i :6379`
- Tắt process đó: `kill -9 <PID>`

### Xem log của Redis (Docker)
```bash
docker compose -f docker-compose.dev.yml logs -f redis
```
