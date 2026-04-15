# 🏟️ Sports Field Booking Platform

**Sports Field Booking Platform** là hệ thống quản lý và đặt sân thể thao hiện đại, cho phép người dùng dễ dàng tìm kiếm, xem thông tin và đặt các loại sân như: bóng đá, cầu lông, tennis, pickleball và bóng rổ. Hệ thống cung cấp thông tin về tình trạng sân theo thời gian thực, chi tiết từng sân và tích hợp AI Chatbot để hỗ trợ người dùng tìm kiếm, đặt sân cũng như trả lời các thắc mắc phổ biến.

---

## 🚀 Tính năng chính

- **Tìm kiếm thông minh**: Tìm sân theo loại hình thể thao, khu vực và thời gian rảnh.
- **Đặt sân trực tuyến**: Quy trình đặt sân nhanh chóng, hỗ trợ thanh toán trực tuyến.
- **Quản lý sân (dành cho Chủ sân)**: Giao diện dashboard hiện đại để quản lý lịch đặt, doanh thu và cấu hình sân.
- **Bản đồ tương tác**: Tích hợp Mapbox để hiển thị vị trí các sân và chỉ đường.
- **Thông báo thời gian thực**: Cập nhật trạng thái đặt sân ngay lập tức thông qua Socket.io.
- **AI Chatbot**: Hỗ trợ người dùng 24/7 trong việc tư vấn và đặt lịch.

---

## 🛠️ Công nghệ sử dụng

### Backend
- **Framework**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.io
- **Caching & Adapter**: Redis
- **Auth**: JWT, Google & Facebook Login

### Frontend
- **Framework**: Vue 3 (Vite)
- **Styling**: CSS / Bootstrap
- **Icons**: FontAwesome, Lucide
- **Maps**: Mapbox GL JS
- **State Management**: Vue Router, Pinia (nếu có)

---

## 🏗️ Cấu trúc thư mục

```text
├── client/frontend     # Mã nguồn ứng dụng phía người dùng & quản trị (Vue 3)
├── server/backend      # API Server & Logic xử lý dữ liệu (Next.js API)
├── docs/               # Tài liệu hướng dẫn cài đặt & thiết kế hệ thống
├── docker/             # Dockerfiles cho database và services
└── redis/              # Source cài đặt Redis cho môi trường Windows
```

---

## 🏁 Bắt đầu (Quick Start)

Bạn có thể chọn một trong hai cách sau để chạy hệ thống trên môi trường phát triển (Dev):

### Cách 1: Sử dụng Docker (Khuyên dùng)
Dành cho máy đã cài đặt Docker Desktop:
```bash
# Khởi chạy Postgres và Redis
docker compose -f docker-compose.dev.yml up -d postgres redis

# Hoặc khởi chạy toàn bộ hệ thống (dịch vụ có sẵn dockerfile)
docker compose -f docker-compose.dev.yml up -d
```

### Cách 2: Chạy Local (Native - Không dùng Docker)
Dành cho các cộng tác viên muốn chạy trực tiếp trên máy Mac/Windows.
- 🍏 **macOS**: Xem chi tiết tại [docs/local-setup-mac.md](./docs/local-setup-mac.md)
- 🪟 **Windows**: Xem chi tiết tại [docs/redis-setup-windows.md](./docs/redis-setup-windows.md)

---

## 🛡️ Biến môi trường (.env)

Hệ thống yêu cầu các biến môi trường được cấu hình tại:
1.  `server/backend/.env` (Dựa trên `.env.example`)
2.  `client/frontend/.env` (Dựa trên `.env.example`)

---

## 👥 Cộng tác viên

Dự án này được phát triển như một phần của đồ án tốt nghiệp năm 2026.

---

## 📄 Giấy phép

Hệ thống này được bảo mật và thuộc quyền sở hữu của nhóm phát triển.
