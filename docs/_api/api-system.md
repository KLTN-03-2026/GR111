# 📘 Tài liệu Hướng dẫn API Hệ thống Đặt sân (Toàn tập)

Tài liệu này cung cấp đầy đủ thông tin về các endpoint, phương thức, yêu cầu tham số (Request) và dữ liệu trả về (Response) dành cho bộ phận Frontend và Mobile tích hợp.

---

## 🏛️ 1. Quy chuẩn Chung (General Rules)

### Cấu trúc Response chuẩn
Tất cả các API đều trả về kết quả theo định dạng JSON thống nhất:

**Thành công (2xx):**
```json
{
  "success": true,
  "message": "Thông báo thao tác thành công",
  "data": { ... } // Dữ liệu trả về (Object, Array, hoặc null)
}
```

**Thất bại (4xx, 5xx):**
```json
{
  "success": false,
  "message": "Tên email đã tồn tại trong hệ thống.",
  "errors": { "email": "Email đã được đăng ký" } 
}
```

### Xác thực (Authentication)
Gắn Token vào Headers của request:
`Authorization: Bearer <Your_JWT_Token>`

---

## 🔐 2. Xác thực & Tài khoản (Auth & Profiles)

### 2.1 Đăng nhập (Login)
- **Endpoint**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "user": {
        "id": "usr_12345",
        "email": "user@example.com",
        "fullName": "Nguyễn Văn A",
        "role": "USER",
        "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR..."
    }
  }
  ```

### 2.2 Lấy thông tin cá nhân (Profile)
- **Endpoint**: `/api/users/me`
- **Method**: `GET` (Yêu cầu Token)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin người dùng thành công",
    "data": {
      "id": "usr_12345",
      "fullName": "Nguyễn Văn A",
      "phone": "0987654321",
      "profile": {
        "address": "123 Lê Lợi, Quận 1",
        "gender": "MALE",
        "bio": "Yêu thích bóng đá"
      }
    }
  }
  ```

---

## 🏟️ 3. Tìm kiếm & Câu lạc bộ (Public Clubs)

### 3.1 Tìm kiếm danh sách CLB
- **Endpoint**: `/api/clubs`
- **Method**: `GET`
- **Query Params**: `sport=FOOTBALL&city=HCM&limit=10`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách cơ sở thể thao thành công",
    "data": [
      {
        "id": "club_001",
        "name": "Sân Bóng Chảo Lửa",
        "slug": "san-bong-chao-lua",
        "address": "100 Cộng Hòa, Tân Bình",
        "coverImageUrl": "https://...",
        "rating": 4.8,
        "minPrice": 150000,
        "amenities": ["WIFI", "PARKING"]
      }
    ]
  }
  ```

### 3.2 Chi tiết Câu lạc bộ (Slug)
- **Endpoint**: `/api/clubs/[slug]`
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy chi tiết CLB",
    "data": {
      "id": "club_001",
      "name": "Sân Bóng Chảo Lửa",
      "description": "Cụm sân cỏ nhân tạo đạt chuẩn FIFA...",
      "openingHours": [
        { "dayOfWeek": 1, "openTime": "06:00:00", "closeTime": "22:00:00" }
      ],
      "courts": [
        { "id": "court_A", "name": "Sân số 1", "sportType": "FOOTBALL" }
      ],
      "images": [...]
    }
  }
  ```

---

## 📅 4. Đặt sân - Người dùng (User Bookings)

### 4.1 Tạo đơn đặt sân (Checkout)
- **Endpoint**: `/api/bookings`
- **Method**: `POST` (Yêu cầu Token)
- **Request Body**:
  ```json
  {
    "clubId": "club_001",
    "timeSlotIds": ["ts_001", "ts_002"],
    "bookerName": "Nguyễn Văn A",
    "bookerPhone": "0987654321",
    "paymentMethod": "VNPAY",
    "voucherCode": "CHAOBANMOI" 
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Đơn hàng đã được tạo thành công",
    "data": {
      "bookingId": "ord_9999",
      "bookingCode": "BK-XHY8",
      "totalAmount": 300000,
      "discountAmount": 50000,
      "finalAmount": 250000,
      "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
    }
  }
  ```

---

## ⭐️ 5. Đánh giá & Yêu thích (Reviews & Favorites)

### 5.1 Tạo đánh giá mới (Create Review)
- **Endpoint**: `/api/reviews`
- **Method**: `POST` (Yêu cầu Token)
- **Request Body**:
  ```json
  {
    "bookingId": "ord_9999",
    "rating": 5,
    "comment": "Sân rất đẹp, mặt cỏ êm, chủ sân nhiệt tình!",
    "images": ["https://.../review1.jpg"] 
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Đánh giá của bạn đã được ghi nhận",
    "data": {
      "id": "rev_123",
      "rating": 5,
      "isVisible": true
    }
  }
  ```

### 5.2 Toggle Yêu thích (Favorite)
- **Endpoint**: `/api/favorites`
- **Method**: `POST` (Yêu cầu Token)
- **Request Body**:
  ```json
  { "clubId": "club_001" }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Đã thêm vào danh sách yêu thích",
    "data": { "isFavorite": true }
  }
  ```

---

## 🔔 6. Thông báo & Marketing (Notifications & Vouchers)

### 6.1 Kiểm tra Mã Giảm Giá (Validate Voucher)
- **Endpoint**: `/api/vouchers/validate`
- **Method**: `POST` (Yêu cầu Token)
- **Request Body**:
  ```json
  {
    "code": "CHAOBANMOI",
    "clubId": "club_001",
    "orderAmount": 300000
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Mã giảm giá hợp lệ",
    "data": {
      "code": "CHAOBANMOI",
      "type": "PERCENTAGE",
      "value": 15,
      "minOrderAmount": 200000,
      "maxDiscountAmount": 50000
    }
  }
  ```

---

## 🛠️ 7. Quản lý dành cho Chủ sân (Owner Management)

### 7.1 Xác nhận Thanh toán Trực tiếp (Cash Payment)
- **Endpoint**: `/api/owner/bookings/[bookingId]/confirm-payment`
- **Method**: `POST` (Yêu cầu Token cấp OWNER)
- **Request Body**: *(Không bắt buộc)*
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Đã xác nhận thanh toán tiền mặt thành công",
    "data": {
      "bookingId": "ord_9999",
      "status": "CONFIRMED",
      "paymentStatus": "CONFIRMED"
    }
  }
  ```

## 📂 8. Tiện ích Upload Hình Ảnh
- **Endpoint**: `/api/upload`
- **Method**: `POST` (Hỗ trợ `multipart/form-data`)
- **FormData**: 
  - `file`: (Tệp ảnh)
  - `type`: `club-gallery`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Upload thành công",
    "data": {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1/club-gallery/xyz.jpg"
    }
  }
  ```
