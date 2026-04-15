# 🏗️ Cấu trúc Kiến trúc Hệ thống Chi tiết (Detailed System Architecture)

Tài liệu này trình bày chuyên sâu về sơ đồ phân cấp mã nguồn, kiến trúc phần mềm, và công nghệ cốt lõi cấu thành nền tảng Đặt sân Thể thao.

---

## 💻 1. Môi trường Frontend (Client)
👉 **Đường dẫn:** `/client/frontend`

Được phát triển bằng **Vue.js 3**, bundling với **Vite** để tối ưu hóa tốc độ build, và sử dụng kiến trúc CSS thuần (**Vanilla CSS**) tuân thủ thiết kế hiện đại (Glassmorphism, Dark Mode). Quản lý state toàn cục bằng **Pinia** và hỗ trợ điều hướng với **Vue Router**.

### 1.1 Cấu trúc Thư mục Frontend
- **`/src/api`**: Triển khai các API client để giao tiếp với backend. Sử dụng axios hoặc fetch API, chuẩn hóa các request/response interceptors để xử lý token (JWT).
- **`/src/assets`**: Quản lý ảnh tĩnh, icons, phông chữ (fonts) và CSS Tokens cốt lõi (color variables, spacing).
- **`/src/components`**: Chứa các UI Component dùng chung, phân tầng rõ ràng:
  - *Base Components*: Các thành phần nhỏ giọt (Buttons, Inputs, Modals).
  - *Domain Components*: Thành phần gắn liền nghiệp vụ (ChatAI, SlotPicker, ClubCard, ReviewForm).
- **`/src/composables`**: Khai báo các Vue Composables (Composition API) để chia sẻ logic phức tạp như `useAuth`, `useBookingStatus`.
- **`/src/layouts`**: Layout bọc ngoài cho các giao diện khác nhau:
  - `ClientLayout`: Giao diện khách hàng vãng lai/người dùng đặt sân.
  - `AdminLayout` / `OwnerLayout`: Giao diện quản trị biểu đồ và danh sách cho Chủ sân.
- **`/src/services`**: Chứa các service xử lý logic bên thứ ba như thanh toán (VNPAY/MOMO) trước khi điều hướng.
- **`/src/stores`**: (Pinia) Quản lý phiên đăng nhập (`authStore`), giỏ hàng/đặt sân (`bookingStore`).
- **`/src/views`**: Các trang nguyên khối (Pages) cấu thành nên Routing (Home, Search, BookingDetail, OwnerDashboard).

---

## ⚙️ 2. Môi trường Backend (Server)
👉 **Đường dẫn:** `/server/backend`

Xây dựng trên nền tảng **Next.js (App Router)** hoạt động như một RESTful API server hoàn chỉnh. Quản trị cơ sở dữ liệu bằng **Prisma ORM** và tích hợp bộ công cụ kiểm thử (Vitest).

### 2.1 Lớp API (Controller Layer) - `/src/app/api`
Định nghĩa các điểm tiếp nhận request từ Client. Mỗi thư mục tương ứng với một Endpoint logic:
- `auth`: Đăng nhập, đăng ký, quên/đổi mật khẩu.
- `bookings`: Đặt sân, hủy sân, kiểm tra slot.
- `chat`: API Streaming tích hợp AI SDK (Google Gemini) cho trợ lý ảo CourtMate.
- `clubs` / `courts`: Lọc danh sách, chi tiết câu lạc bộ, quản lý từng sân con.
- `reviews` / `favorites`: Hệ thống đánh giá, phản hồi và danh sách yêu thích.
- `notifications`: WebSockets hoặc Polling cho thông báo thời gian thực.
- `owner` / `admin`: Cổng API đặc quyền yêu cầu Authorization (RBAC) mức độ cao.
- `payments`: Giao tiếp cổng thanh toán, Webhook lắng nghe callback nội bộ.
- `vouchers`: Xác thực, áp dụng và giới hạn mã giảm giá.

### 2.2 Lớp Dịch vụ (Service Layer) - `/src/modules`
Đây là **Trái tim của hệ thống**, chứa toàn bộ business logic. Được chia nhỏ theo Domain-Driven Design (DDD):
- `admin`: Các tác vụ của quản trị viên hệ thống (Kiểm duyệt KYC, thống kê tổng).
- `booking`: Thuật toán sinh Slot (TimeSlots), tính tiền, khóa Slot tránh Double-booking.
- `club`: Logic liên quan Club, Court, Operating Hours (Khung giờ mở cửa).
- `crm`: Quản lý hạng khách hàng (Customer Tiers) và Loyalty.
- `marketing`: Tạo và xác thực logic Voucher, giới hạn cho từng người.
- `payment`: Đối soát doanh thu, xử lý Refund và Webhooks.
- `review`: Cập nhật điểm rating của Club, phân vùng đánh giá (hiện/ẩn).
- `slot`: Logic quản trị tình trạng từng ô trống nhỏ trong ngày.
- `user`: Thông tin Profile cá nhân, cấu hình Session.

### 2.3 Công cụ và Lớp Lõi (Core/Lib Layer) - `/src/lib` & `/src/middlewares`
- **`/lib`**: 
  - `prisma.ts`: Khởi tạo Singleton Database Connection để tránh cạn kiệt connection pool.
  - `response.ts`: Hàm bọc Response chuẩn format của hệ thống (Success/Error Builder).
  - Tích hợp bên thứ ba: Cloudinary (upload), Mailer (gửi email).
- **`/middlewares`**: `auth.middleware.ts` xử lý giải mã JWT, phân tách quyền (Role check) ngay từ vòng ngoài trước khi vào Route Handler.
- **`/validations`**: Sử dụng thư viện Schema Validator (như Zod hoặc Yup) để kiểm chứng payload của request.

---

## 🗄️ 3. Cơ sở hạ tầng và DevOps (Infrastructure & DevOps)
👉 **Đường dẫn:** `/docker`, `/script`, `/redis`

- **Dockerization (`/docker` & `docker-compose.yml`)**: 
  Đóng gói hệ thống cho cả môi trường DEV (có hot-reload) và PROD (tối ưu hiệu suất). Chứa cấu hình cho Node.js, PostgreSQL 14+, và Redis 6+.
- **Database & Prisma (`/server/backend/prisma`)**:
  - `schema.prisma`: Định nghĩa trên 20+ Models bao phủ toàn bộ luồng hoạt động kinh doanh đan xen.
  - `migrations`: Bộ rễ lưu giữ lịch sử phát triển thay đổi DB.
- **Redis (`/redis`)**: Cache query nặng (danh sách club), trạng thái Rate-limit và khóa quá trình đặt (Distributed Locks) khi người dùng vào tranh slot.
- **Scripts (`/script`)**: Shell/Bash/Node scripts phục vụ việc Seed dữ liệu ban đầu, truncate table để test tự động (Vitest E2E Testing).

---

## 🔄 4. Chi tiết Luồng xử lý dữ liệu (Data Flow Lifecycle)

Một vòng đời Request chuẩn trong hệ thống tuân theo mô hình **MVC-Layered Architecture**:

1. **Giao tiếp Client**: VueJS Component (ví dụ `BookingModal`) gọi hàm tới `/api/bookings` thông qua Axios (có đính kèm Bearer Token JWT).
2. **Gateway & Middlewares phân vùng**: 
   - Truy cập vào API gốc tại Next.js `route.ts`.
   - Hàm `getAuthUser` được gọi để decode JWT, kiểm tra Role xem có quyền Đặt Sân hay không.
3. **Kiểm duyệt Input**: Payload body truyền qua lớp Validation (Zod Schema) để kiểm soát kiểu dữ liệu.
4. **Nghiệp vụ cốt lõi (Service)**: 
   - Route gọi vào `booking.service.ts`.
   - Service sẽ thực hiện: Kiểm tra slot trống -> Khởi tạo prisma Transaction -> Tính Voucher -> Lưu trạng thái `WAITING_PAYMENT`.
5. **Database I/O**: Các câu truy vấn song song được Prisma nạp vào PostgreSQL. Kết quả trả về.
6. **Thanh toán & Hậu kỳ (Async)**: Sinh Payment URL trả lại Frontend.
7. **Phản hồi chuẩn hóa**: Dịch vụ `successResponse` định dạng data theo chuẩn `{success, data, message}` để Client dễ bắt (Catch).
