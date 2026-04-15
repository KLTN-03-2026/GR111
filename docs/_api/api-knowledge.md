# 🌐 Kiến thức về Tích hợp API trong Hệ thống

Tài liệu này tổng hợp kiến thức chuyên sâu về các API Nội bộ (Internal APIs) và các Dịch vụ của Bên thứ ba (External APIs) được sử dụng để xây dựng hệ thống Đặt sân Thể thao đa năng.

---

## 1. Kiến trúc Hệ thống REST API (RESTful Principles)

Hệ thống Backend được xây dựng tuân thủ chặt chẽ tiêu chuẩn **REST (Representational State Transfer)**, quản lý thông qua cơ chế **Route Handlers** của Next.js. Những nguyên lý nền tảng được áp dụng bao gồm:

### 1.1 Khái niệm về Tài nguyên (Resource-based URLs)
Mọi thực thể trong hệ thống (User, Club, Booking, Review...) đều được xem là một **Resource** và có một định danh (URI) mang tính danh từ số nhiều (Plural nouns), không dùng động từ.
- `GET /api/clubs`: Lấy danh sách (Collection) câu lạc bộ.
- `GET /api/clubs/club_001`: Lấy chi tiết một câu lạc bộ cụ thể.
- `GET /api/clubs/club_001/courts`: Lấy các sân con trực thuộc CLB đó (Nested resources).

### 1.2 Phương thức HTTP (HTTP Methods)
Các hành động CRUD (Create, Read, Update, Delete) được gắn chặt với các phương thức HTTP chuẩn mực:
- **`GET` (Read)**: Truy xuất thông tin. Hoàn toàn Idempotent (gọi bao nhiêu lần cũng không làm thay đổi Database).
- **`POST` (Create)**: Khởi tạo dữ liệu mới. Lệnh POST không mang tính Idempotent (gọi 2 lần sẽ sinh ra 2 đơn hàng).
- **`PUT` (Update - Full)**: Ghi đè cập nhật toàn bộ Resource.
- **`PATCH` (Update - Partial)**: Cập nhật một phần (Ví dụ: chỉ cập nhật `status` của Booking).
- **`DELETE` (Delete)**: Xóa resource (Hệ thống thường áp dụng Soft-delete bằng trường `deletedAt`).

### 1.3 Quy chuẩn HTTP Status Codes
Backend báo hiệu kết quả xử lý cho Frontend thông qua mã trạng thái HTTP:
- **`200 OK`**: Hành động (GET/PUT/PATCH/DELETE) thành công.
- **`201 Created`**: Lệnh POST đã tạo mới một resource thành công (Ví dụ: Đặt sân xong).
- **`400 Bad Request`**: Dữ liệu Client gửi lên bị sai format, thiếu trường bắt buộc (Vượt qua Zod Validation thất bại).
- **`401 Unauthorized`**: Token hết hạn hoặc không có Token đính kèm. Khách vô danh truy cập route riêng tư.
- **`403 Forbidden`**: Token hợp lệ nhưng Role không đủ quyền (Ví dụ: USER cố chỉnh sửa thông tin của CLB).
- **`404 Not Found`**: Dữ liệu hoặc URI không tồn tại (Nhập sai ID rác).
- **`422 Unprocessable Entity`**: Tham số đúng chuẩn logic cấu trúc nhưng nghiệp vụ bị sai (Ví dụ: Đặt lại cái Slot đã bị người khác đặt).
- **`500 Internal Server Error`**: Lỗi Logic, sập CSDL Prisma từ phía Server.

### 1.4 Phi trạng thái tĩnh (Statelessness)
Mỗi API Server xử lý Request độc lập, **không lưu trữ trạng thái (State)** của Client giữa các lần gọi liên tiếp. Thay vì dựa vào Cookie Session ở RAM, Server nhận JWT Token từ Headers trên mỗi Request để tự giải mã, xác định User hiện tại rồi bị hủy biến. Giúp Scale ngang hệ thống cực kỳ dễ.

### 1.5 Dữ liệu Trả về Chuẩn hóa (Standardized Envelope)
Tất cả các API tự xây dựng đều đi qua một lớp Interceptor bọc lại trong `src/lib/response.ts` để đảm bảo có định dạng (Envelope) nhất quán, giúp cho quá trình Try/Catch bên Client Frontend nhàn nhã:

**Kịch bản Thành công:**
```json
{
  "success": true,               // Dấu hiệu boolean
  "message": "Cập nhật giá sân thành công", 
  "data": { "courtId": "...", "price": 200000 } // Dữ liệu trả ra (nếu có)
}
```

**Kịch bản Thất bại (Zod Validation lỗi):**
```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": {
    "bookerPhone": "Số điện thoại phải có 10 chữ số"
  }
}
```

---

## 2. API Bên thứ ba (Third-party integrations)

Hệ thống phụ thuộc vào một số dịch vụ SaaS để xử lý các tác vụ phức tạp (Thanh toán, Trí tuệ nhân tạo, và Lưu trữ đám mây).

### 2.1 Trí tuệ Nhân tạo - Google Gemini AI 
*Được sử dụng cho: Trợ lý ảo CourtMate.*

Hệ thống sử dụng **Vercel AI SDK** kết hợp với model **Gemini 1.5 Pro / Flash** thông qua `@google/generative-ai`.
- **Luồng hoạt động**: 
  1. Frontend gửi mảng `messages` lên `/api/chat`.
  2. Backend gọi Gemini API với ngữ cảnh dữ liệu nội bộ (Prompt Engineering).
  3. API hỗ trợ **Tool Calling** (Calling Functions): AI tự quyết định khi nào cần gọi hàm "Tìm kiếm sân bóng", "Kiểm tra giờ trống" để query trực tiếp từ Database.
  4. Server trả về dữ liệu dưới dạng **Server-Sent Events (SSE)** để hiển thị hiệu ứng gõ phím mượt mà (Streaming) thay vì đợi phản hồi xong hoàn toàn.

### 2.2 Cổng Thanh toán Điện tử (Payment Gateways)
*Được sử dụng cho: Thanh toán đơn đặt sân online an toàn.*

#### VNPay API
- Hệ thống tạo một chuỗi URL có chứa các tham số được mã hóa HMAC-SHA512 bằng **Hash Secret**.
- Khách hàng điều hướng tới URL của VNPAY -> Thanh toán -> VNPAY gọi ngược lại Backend qua một đường dẫn **Webhook (IPN - Instant Payment Notification)** để tự động cập nhật trạng thái thẻ.

#### Momo API (Dùng làm ví dụ tương tự)
- Sử dụng mô hình gửi JSON Request chứa chữ ký (Signature) lên Endpoint của MoMo để lấy `payUrl`. Webhook cũng được dùng để bắt tín hiệu thanh toán thành công.

### 2.3 Lưu trữ đám mây - Cloudinary API
*Được sử dụng cho: Lưu trữ hình ảnh Avatar, Logo CLB, Review và CCCD (KYC).*

Thay vì lưu hình nặng lên ổ cứng máy chủ, hệ thống sử dụng **Cloudinary SDK**.
- Khi người dùng upload ảnh lên `/api/upload`, Server nhận file binary thành Buffer.
- Server gọi `cloudinary.uploader.upload_stream` để đẩy file thẳng lên server Cloudinary.
- API trả về một `secure_url` siêu tối ưu (hiệu năng load ảnh nhanh hơn qua CDN) để lưu vào PostgreSQL.

---

## 3. Kiến thức về Bảo mật API (API Security)

Hệ thống áp dụng các tiêu chuẩn an toàn ngặt nghèo trên toàn bộ API lưới:

### 3.1 Xác thực JSON Web Token (JWT)
- **Cơ chế**: Khách hàng đăng nhập thành công sẽ nhận được 1 chuỗi JWT. Khi gọi các API riêng tư (như đặt lịch), token này phải gắn trong Header `Authorization: Bearer <token>`.
- Token chứa ID người dùng và được mã hóa ký tự (Signed), giúp Server xác minh danh tính không cần truy vấn lại DB liên tục.

### 3.2 CORS (Cross-Origin Resource Sharing)
- Chỉ cấp phép (Whitelist) cho Frontend Web (`https://yourdomain.com`) được quyền thực hiện API Fetching tới Backend. Ai dùng Postman hay Domain khác để chọc vào sẽ bị trình duyệt chặn lập tức.

### 3.3 Phân quyền (Role-Based Access Control - RBAC)
- Middleware kiểm tra role `USER`, `OWNER`, `ADMIN` trước khi thực thi Logic. Chủ sân (OWNER) cố tình gọi API `/api/admin/users` sẽ bị trả về lỗi `403 Forbidden` ngay lập tức.
