# ERD – Tài liệu mô tả Schema Database

> **Database:** PostgreSQL  
> **ORM:** Prisma  
> **Extensions:** Full-text Search (Postgres), PostgreSQL Extensions  

---

## Mục lục

1. [Enums](#enums)
2. [User & Auth](#user--auth)
3. [Club & Court](#club--court)
4. [Booking & Payment](#booking--payment)
5. [Voucher & Review](#voucher--review)
6. [Notification & Post](#notification--post)
7. [Misc & System](#misc--system)
8. [Sơ đồ quan hệ](#sơ-đồ-quan-hệ)

---

## Enums

### `Role` – Vai trò người dùng
| Giá trị | Mô tả |
|---------|-------|
| `USER` | Người dùng thông thường |
| `OWNER` | Chủ sân / câu lạc bộ |
| `ADMIN` | Quản trị viên hệ thống |

### `SportType` – Loại thể thao
| Giá trị | Mô tả |
|---------|-------|
| `FOOTBALL` | Bóng đá |
| `BADMINTON` | Cầu lông |
| `TENNIS` | Tennis |
| `PICKLEBALL` | Pickleball |
| `BASKETBALL` | Bóng rổ |
| `VOLLEYBALL` | Bóng chuyền |
| `OTHER` | Khác |

### `CourtStatus` – Trạng thái sân
| Giá trị | Mô tả |
|---------|-------|
| `ACTIVE` | Sân đang hoạt động |
| `INACTIVE` | Sân tạm ngưng |
| `MAINTENANCE` | Đang bảo trì |
| `PENDING_APPROVAL` | Chờ duyệt |
| `SUSPENDED` | Bị đình chỉ |

### `TimeSlotStatus` – Trạng thái khung giờ
| Giá trị | Mô tả |
|---------|-------|
| `AVAILABLE` | Còn trống |
| `BOOKED` | Đã được đặt |
| `LOCKED` | Bị khóa (đang xử lý giao dịch) |

### `BookingStatus` – Trạng thái đặt sân
| Giá trị | Mô tả |
|---------|-------|
| `PENDING` | Chờ xử lý |
| `WAITING_PAYMENT` | Chờ thanh toán |
| `CONFIRMED` | Đã xác nhận |
| `CANCELLED` | Đã hủy |
| `COMPLETED` | Hoàn thành |

### `PaymentMethod` – Phương thức thanh toán
| Giá trị | Mô tả |
|---------|-------|
| `BANK_TRANSFER` | Chuyển khoản ngân hàng |
| `CREDIT_CARD` | Thẻ tín dụng |
| `MOMO` | Ví MoMo |
| `VNPAY` | VNPay |
| `CASH` | Tiền mặt |

### `PaymentStatus` – Trạng thái thanh toán
| Giá trị | Mô tả |
|---------|-------|
| `PENDING` | Chờ xử lý |
| `WAITING_PAYMENT` | Chờ thanh toán |
| `CONFIRMED` | Đã xác nhận |
| `CANCELLED` | Đã hủy |
| `REFUNDED` | Đã hoàn tiền |

### `RefundStatus` – Trạng thái hoàn tiền
| Giá trị | Mô tả |
|---------|-------|
| `NONE` | Không có yêu cầu hoàn tiền |
| `REQUESTED` | Đã gửi yêu cầu hoàn tiền |
| `APPROVED` | Yêu cầu được duyệt |
| `REJECTED` | Yêu cầu bị từ chối |
| `COMPLETED` | Hoàn tiền hoàn tất |

### `ApprovalStatus` – Trạng thái phê duyệt
| Giá trị | Mô tả |
|---------|-------|
| `PENDING` | Chờ duyệt |
| `APPROVED` | Đã duyệt |
| `REJECTED` | Bị từ chối |

### `VoucherType` – Loại voucher
| Giá trị | Mô tả |
|---------|-------|
| `PERCENTAGE` | Giảm theo phần trăm |
| `FIXED_AMOUNT` | Giảm số tiền cố định |

### `CustomerTier` – Hạng khách hàng
| Giá trị | Mô tả |
|---------|-------|
| `NORMAL` | Khách thường |
| `SILVER` | Bạc |
| `GOLD` | Vàng |
| `VIP` | VIP |

### `NotificationType` – Loại thông báo
| Giá trị | Mô tả |
|---------|-------|
| `BOOKING_REMINDER` | Nhắc nhở lịch đặt sân |
| `BOOKING_CONFIRMED` | Xác nhận đặt sân |
| `BOOKING_CANCELLED` | Hủy đặt sân |
| `PAYMENT_SUCCESS` | Thanh toán thành công |
| `PAYMENT_FAILED` | Thanh toán thất bại |
| `SCHEDULE_CHANGED` | Lịch thay đổi |
| `PROMOTION` | Khuyến mãi |
| `SYSTEM` | Hệ thống |
| `NEWS_FEED` | Tin tức / bảng tin |

### `PostType` – Loại bài đăng
| Giá trị | Mô tả |
|---------|-------|
| `AVAILABLE_SLOT` | Sân trống cần ghép |
| `DISCOUNT` | Khuyến mãi |
| `EVENT` | Sự kiện |
| `TEAM_MATCHING` | Tìm đối / ghép đội |
| `ANNOUNCEMENT` | Thông báo chung |

### `PostStatus` – Trạng thái bài đăng
| Giá trị | Mô tả |
|---------|-------|
| `ACTIVE` | Đang hiển thị |
| `HIDDEN` | Bị ẩn |
| `EXPIRED` | Hết hạn |

---

## User & Auth

### `users` – Tài khoản người dùng

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `email` | String | ✅ UNIQUE | Địa chỉ email đăng nhập |
| `phone` | String | ❌ UNIQUE | Số điện thoại |
| `passwordHash` | String | ❌ | Mật khẩu đã mã hóa (bcrypt) |
| `fullName` | String | ✅ | Họ và tên đầy đủ |
| `avatarUrl` | String | ❌ | URL ảnh đại diện |
| `role` | Role | ✅ | Vai trò: `USER` / `OWNER` / `ADMIN` |
| `isActive` | Boolean | ✅ | Tài khoản đang hoạt động hay không |
| `isEmailVerified` | Boolean | ✅ | Email đã xác minh chưa |
| `googleId` | String | ❌ UNIQUE | ID tài khoản Google (OAuth) |
| `facebookId` | String | ❌ UNIQUE | ID tài khoản Facebook (OAuth) |
| `createdAt` | DateTime | ✅ | Thời điểm tạo tài khoản |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật gần nhất |
| `lastLoginAt` | DateTime | ❌ | Thời điểm đăng nhập lần cuối |
| `isVerified` | Boolean | ✅ | Tài khoản đã được xác minh danh tính |
| `deletedAt` | DateTime | ❌ | Thời điểm xóa mềm (soft delete) |
| `failedLoginAttempts` | Int | ✅ | Số lần đăng nhập thất bại liên tiếp |
| `lastLoginIp` | String | ❌ | IP đăng nhập lần cuối |
| `lastPasswordChangeAt` | DateTime | ❌ | Thời điểm đổi mật khẩu lần cuối |
| `lockoutUntil` | DateTime | ❌ | Tài khoản bị khóa đến thời điểm này |

**Quan hệ:** `UserProfile` (1-1), `Session` (1-n), `PasswordReset` (1-n), `Club` (1-n), `Booking` (1-n), `Review` (1-n), `Notification` (1-n), `FavoriteClub` (1-n), `FavoriteCourt` (1-n), `ClubCustomer` (1-n), `OwnerProfile` (1-1), `VoucherUsage` (1-n), `AuditLog` (1-n)

---

### `user_profiles` – Hồ sơ mở rộng người dùng

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ UNIQUE FK | Liên kết tới `users.id` |
| `address` | String | ❌ | Địa chỉ thường trú |
| `dateOfBirth` | DateTime | ❌ | Ngày sinh |
| `gender` | String | ❌ | Giới tính |
| `bio` | String | ❌ | Giới thiệu bản thân |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật gần nhất |

---

### `sessions` – Phiên đăng nhập

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ FK | Liên kết tới `users.id` |
| `token` | String | ✅ UNIQUE | Token phiên (JWT hoặc random) |
| `ipAddress` | String | ❌ | Địa chỉ IP của thiết bị |
| `userAgent` | String | ❌ | Thông tin trình duyệt / thiết bị |
| `expiresAt` | DateTime | ✅ | Thời điểm hết hạn phiên |
| `createdAt` | DateTime | ✅ | Thời điểm tạo phiên |
| `isRevoked` | Boolean | ✅ | Phiên đã bị thu hồi chưa |

---

### `password_resets` – Yêu cầu đặt lại mật khẩu

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ FK | Liên kết tới `users.id` |
| `token` | String | ✅ UNIQUE | Token đặt lại mật khẩu (one-time) |
| `expiresAt` | DateTime | ✅ | Thời điểm token hết hạn |
| `used` | Boolean | ✅ | Token đã được sử dụng chưa |
| `createdAt` | DateTime | ✅ | Thời điểm tạo yêu cầu |

---

### `owner_profiles` – Hồ sơ chủ sân

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ UNIQUE FK | Liên kết tới `users.id` |
| `idCardNumber` | String | ❌ | Số CCCD / CMT |
| `idCardFrontUrl` | String | ❌ | URL ảnh mặt trước CCCD |
| `idCardBackUrl` | String | ❌ | URL ảnh mặt sau CCCD |
| `businessLicenseUrl` | String | ❌ | URL giấy phép kinh doanh |
| `taxCode` | String | ❌ | Mã số thuế doanh nghiệp |
| `bankName` | String | ❌ | Tên ngân hàng |
| `bankAccountNumber` | String | ❌ | Số tài khoản ngân hàng |
| `bankAccountName` | String | ❌ | Tên chủ tài khoản ngân hàng |
| `cancellationPolicy` | String | ❌ | Chính sách hủy đặt sân của chủ |
| `kycStatus` | ApprovalStatus | ✅ | Trạng thái xác minh danh tính (KYC) |
| `kycReviewedAt` | DateTime | ❌ | Thời điểm admin duyệt KYC |
| `kycReviewedBy` | String | ❌ | ID admin đã duyệt KYC |
| `kycNote` | String | ❌ | Ghi chú của admin về KYC |
| `createdAt` | DateTime | ✅ | Thời điểm tạo hồ sơ |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật gần nhất |

---

## Club & Court

### `clubs` – Câu lạc bộ / Cơ sở thể thao

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `ownerId` | String | ✅ FK | Liên kết tới `users.id` (chủ sân) |
| `name` | String | ✅ | Tên câu lạc bộ |
| `slug` | String | ✅ UNIQUE | Đường dẫn URL thân thiện |
| `description` | String | ❌ | Mô tả về câu lạc bộ |
| `address` | String | ✅ | Địa chỉ chi tiết |
| `ward` | String | ❌ | Phường / Xã |
| `district` | String | ✅ | Quận / Huyện |
| `city` | String | ✅ | Thành phố / Tỉnh |
| `latitude` | Float | ❌ | Vĩ độ (tọa độ GPS) |
| `longitude` | Float | ❌ | Kinh độ (tọa độ GPS) |
| `phone` | String | ❌ | Số điện thoại liên hệ |
| `email` | String | ❌ | Email liên hệ |
| `website` | String | ❌ | Website câu lạc bộ |
| `logoUrl` | String | ❌ | URL logo câu lạc bộ |
| `coverImageUrl` | String | ❌ | URL ảnh bìa câu lạc bộ |
| `approvalStatus` | ApprovalStatus | ✅ | Trạng thái được admin duyệt |
| `isActive` | Boolean | ✅ | Câu lạc bộ đang hoạt động không |
| `slotDuration` | Int | ✅ | Thời lượng mỗi slot đặt sân (phút, mặc định 60) |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |
| `deletedAt` | DateTime | ❌ | Thời điểm xóa mềm |

**Index:** `name`, `address`, `slug`  
**Quan hệ:** `Court` (1-n), `ClubImage` (1-n), `OpeningHour` (1-n), `ClubAmenity` (1-n), `Booking` (1-n), `ClubCustomer` (1-n), `FavoriteClub` (1-n), `Post` (1-n), `Voucher` (1-n)

---

### `club_images` – Ảnh câu lạc bộ

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `clubId` | String | ✅ FK | Liên kết tới `clubs.id` |
| `url` | String | ✅ | URL ảnh |
| `caption` | String | ❌ | Chú thích ảnh |
| `sortOrder` | Int | ✅ | Thứ tự hiển thị ảnh |
| `createdAt` | DateTime | ✅ | Thời điểm thêm ảnh |

---

### `opening_hours` – Giờ mở cửa

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `clubId` | String | ✅ FK | Liên kết tới `clubs.id` |
| `dayOfWeek` | Int | ✅ | Thứ trong tuần (0 = CN, 1–6 = Thứ 2–7) |
| `openTime` | DateTime (Time) | ✅ | Giờ mở cửa |
| `closeTime` | DateTime (Time) | ✅ | Giờ đóng cửa |
| `isClosed` | Boolean | ✅ | Ngày này đóng cửa không |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |

**Unique:** `[clubId, dayOfWeek]`

---

### `amenities` – Tiện ích / Dịch vụ

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `name` | String | ✅ UNIQUE | Tên tiện ích (vd: Thuê vợt, Nước uống) |
| `icon` | String | ❌ | Icon đại diện (class name hoặc URL) |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |

**Quan hệ:** Liên kết tới `ClubAmenity` (n-n với Club) và `BookingService` (n-n với Booking)

---

### `club_amenities` – Tiện ích của từng câu lạc bộ

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `clubId` | String | ✅ FK | Liên kết tới `clubs.id` |
| `amenityId` | String | ✅ FK | Liên kết tới `amenities.id` |
| `note` | String | ❌ | Ghi chú về tiện ích tại câu lạc bộ này |
| `price` | Decimal(12,2) | ✅ | Giá tiện ích (0 = miễn phí) |
| `createdAt` | DateTime | ✅ | Thời điểm thêm |

**Unique:** `[clubId, amenityId]`

---

### `courts` – Sân thể thao

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `clubId` | String | ✅ FK | Liên kết tới `clubs.id` |
| `name` | String | ✅ | Tên sân (vd: Sân A, Sân 1) |
| `description` | String | ❌ | Mô tả chi tiết sân |
| `sportType` | SportType | ✅ | Loại thể thao |
| `status` | CourtStatus | ✅ | Trạng thái sân |
| `capacity` | Int | ❌ | Sức chứa tối đa (người) |
| `surface` | String | ❌ | Loại mặt sân (vd: Cỏ nhân tạo, Gỗ) |
| `indoorOutdoor` | String | ❌ | Trong nhà hay ngoài trời |
| `sortOrder` | Int | ✅ | Thứ tự hiển thị |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |
| `deletedAt` | DateTime | ❌ | Thời điểm xóa mềm |

**Index:** `name`  
**Quan hệ:** `CourtImage` (1-n), `CourtPricing` (1-n), `SpecialDatePricing` (1-n), `TimeSlot` (1-n), `FavoriteCourt` (1-n), `Booking` (1-n)

---

### `court_images` – Ảnh sân

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `courtId` | String | ✅ FK | Liên kết tới `courts.id` |
| `url` | String | ✅ | URL ảnh |
| `caption` | String | ❌ | Chú thích ảnh |
| `sortOrder` | Int | ✅ | Thứ tự hiển thị |
| `createdAt` | DateTime | ✅ | Thời điểm thêm |

---

### `court_pricings` – Bảng giá sân theo ngày / giờ

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `courtId` | String | ✅ FK | Liên kết tới `courts.id` |
| `dayOfWeek` | Int | ❌ | Thứ trong tuần áp dụng (null = mọi ngày) |
| `startTime` | DateTime (Time) | ✅ | Giờ bắt đầu áp dụng giá |
| `endTime` | DateTime (Time) | ✅ | Giờ kết thúc áp dụng giá |
| `pricePerHour` | Decimal(12,2) | ✅ | Giá mỗi giờ |
| `label` | String | ❌ | Nhãn mô tả khung giá (vd: Giờ vàng) |
| `isActive` | Boolean | ✅ | Bảng giá này đang áp dụng không |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |

---

### `special_date_pricings` – Giá đặc biệt theo ngày cụ thể

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `courtId` | String | ✅ FK | Liên kết tới `courts.id` |
| `specificDate` | DateTime (Date) | ✅ | Ngày cụ thể áp dụng giá |
| `startTime` | DateTime (Time) | ✅ | Giờ bắt đầu |
| `endTime` | DateTime (Time) | ✅ | Giờ kết thúc |
| `pricePerHour` | Decimal(12,2) | ✅ | Giá mỗi giờ cho ngày đặc biệt |
| `note` | String | ❌ | Ghi chú (vd: Ngày lễ, Sự kiện) |
| `isActive` | Boolean | ✅ | Đang áp dụng không |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |

---

### `time_slots` – Khung giờ đặt sân

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `courtId` | String | ✅ FK | Liên kết tới `courts.id` |
| `startTime` | DateTime | ✅ | Thời điểm bắt đầu slot |
| `endTime` | DateTime | ✅ | Thời điểm kết thúc slot |
| `status` | TimeSlotStatus | ✅ | Trạng thái: AVAILABLE / BOOKED / LOCKED |
| `lockedBy` | String | ❌ | ID người dùng đang giữ slot (khi LOCKED) |
| `lockedAt` | DateTime | ❌ | Thời điểm slot bị khóa |
| `note` | String | ❌ | Ghi chú |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |

**Unique:** `[courtId, startTime]`

---

## Booking & Payment

### `bookings` – Đơn đặt sân

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ FK | Người đặt sân – liên kết `users.id` |
| `courtId` | String | ❌ FK | Sân được đặt – liên kết `courts.id` |
| `clubId` | String | ❌ FK | Câu lạc bộ – liên kết `clubs.id` |
| `bookingCode` | String | ✅ UNIQUE | Mã đặt sân duy nhất (hiển thị cho user) |
| `status` | BookingStatus | ✅ | Trạng thái đơn đặt |
| `totalAmount` | Decimal(12,2) | ✅ | Tổng tiền trước giảm giá |
| `discountAmount` | Decimal(12,2) | ✅ | Số tiền được giảm |
| `finalAmount` | Decimal(12,2) | ✅ | Số tiền thực tế cần thanh toán |
| `note` | String | ❌ | Ghi chú từ khách |
| `voucherId` | String | ❌ FK | Voucher áp dụng – liên kết `vouchers.id` |
| `bookerName` | String | ✅ | Tên người đặt |
| `bookerPhone` | String | ✅ | Số điện thoại người đặt |
| `bookerEmail` | String | ❌ | Email người đặt |
| `createdAt` | DateTime | ✅ | Thời điểm tạo đơn |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |
| `deletedAt` | DateTime | ❌ | Thời điểm xóa mềm |

**Quan hệ:** `BookingItem` (1-n), `BookingService` (1-n), `BookingStatusHistory` (1-n), `Payment` (1-1), `Review` (1-1), `Notification` (1-n)

---

### `booking_items` – Chi tiết slot trong đơn đặt

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `bookingId` | String | ✅ FK | Liên kết tới `bookings.id` |
| `timeSlotId` | String | ✅ FK | Liên kết tới `time_slots.id` |
| `price` | Decimal(12,2) | ✅ | Giá của slot này tại thời điểm đặt |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |

**Unique:** `[bookingId, timeSlotId]`

---

### `booking_services` – Dịch vụ đi kèm trong đơn đặt

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `bookingId` | String | ✅ FK | Liên kết tới `bookings.id` |
| `amenityId` | String | ✅ FK | Tiện ích – liên kết `amenities.id` |
| `price` | Decimal(12,2) | ✅ | Giá dịch vụ tại thời điểm đặt |
| `quantity` | Int | ✅ | Số lượng |

**Unique:** `[bookingId, amenityId]`

---

### `booking_status_history` – Lịch sử thay đổi trạng thái đơn

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `bookingId` | String | ✅ FK | Liên kết tới `bookings.id` |
| `status` | BookingStatus | ✅ | Trạng thái mới |
| `note` | String | ❌ | Ghi chú về thay đổi |
| `changedBy` | String | ❌ | ID người thực hiện thay đổi |
| `createdAt` | DateTime | ✅ | Thời điểm thay đổi |

---

### `payments` – Thanh toán

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `bookingId` | String | ✅ UNIQUE FK | Liên kết tới `bookings.id` (1-1) |
| `method` | PaymentMethod | ✅ | Phương thức thanh toán |
| `status` | PaymentStatus | ✅ | Trạng thái thanh toán |
| `amount` | Decimal(12,2) | ✅ | Số tiền thanh toán |
| `transactionRef` | String | ❌ UNIQUE | Mã tham chiếu giao dịch từ cổng thanh toán |
| `bankName` | String | ❌ | Tên ngân hàng (nếu chuyển khoản) |
| `accountNumber` | String | ❌ | Số tài khoản ngân hàng |
| `transferContent` | String | ❌ | Nội dung chuyển khoản |
| `proofImageUrl` | String | ❌ | URL ảnh chứng từ chuyển khoản |
| `paidAt` | DateTime | ❌ | Thời điểm thanh toán thành công |
| `confirmedAt` | DateTime | ❌ | Thời điểm admin xác nhận |
| `confirmedBy` | String | ❌ | ID admin đã xác nhận |
| `note` | String | ❌ | Ghi chú |
| `refundStatus` | RefundStatus | ✅ | Trạng thái hoàn tiền |
| `refundAmount` | Decimal(12,2) | ❌ | Số tiền hoàn |
| `refundReason` | String | ❌ | Lý do hoàn tiền |
| `refundNote` | String | ❌ | Ghi chú thêm về hoàn tiền |
| `refundRequestAt` | DateTime | ❌ | Thời điểm gửi yêu cầu hoàn tiền |
| `refundReviewAt` | DateTime | ❌ | Thời điểm admin xét duyệt hoàn tiền |
| `refundReviewBy` | String | ❌ | ID admin đã xét duyệt hoàn tiền |
| `refundedAt` | DateTime | ❌ | Thời điểm hoàn tiền hoàn tất |
| `createdAt` | DateTime | ✅ | Thời điểm tạo bản ghi |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |

---

## Voucher & Review

### `vouchers` – Mã giảm giá

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `clubId` | String | ❌ FK | Câu lạc bộ phát hành (null = toàn hệ thống) |
| `code` | String | ✅ UNIQUE | Mã voucher người dùng nhập |
| `title` | String | ✅ | Tên voucher |
| `description` | String | ❌ | Mô tả chi tiết |
| `type` | VoucherType | ✅ | Loại: PERCENTAGE hoặc FIXED_AMOUNT |
| `value` | Decimal(12,2) | ✅ | Giá trị giảm (% hoặc số tiền) |
| `minOrderAmount` | Decimal(12,2) | ❌ | Giá trị đơn tối thiểu để áp dụng |
| `maxDiscount` | Decimal(12,2) | ❌ | Giảm tối đa (dùng cho loại PERCENTAGE) |
| `usageLimit` | Int | ❌ | Số lần dùng tối đa toàn hệ thống |
| `usagePerUser` | Int | ✅ | Số lần mỗi user được dùng |
| `usedCount` | Int | ✅ | Tổng số lần đã dùng |
| `startDate` | DateTime | ✅ | Ngày bắt đầu hiệu lực |
| `endDate` | DateTime | ✅ | Ngày hết hạn |
| `isActive` | Boolean | ✅ | Voucher đang kích hoạt không |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |
| `deletedAt` | DateTime | ❌ | Thời điểm xóa mềm |

---

### `voucher_usages` – Lịch sử sử dụng voucher

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `voucherId` | String | ✅ FK | Liên kết tới `vouchers.id` |
| `userId` | String | ✅ FK | Liên kết tới `users.id` |
| `usedAt` | DateTime | ✅ | Thời điểm sử dụng |

**Unique:** `[voucherId, userId]`

---

### `reviews` – Đánh giá

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ FK | Người đánh giá – liên kết `users.id` |
| `bookingId` | String | ✅ UNIQUE FK | Đơn đặt được đánh giá (1 đơn 1 review) |
| `courtId` | String | ❌ | ID sân được đánh giá |
| `clubId` | String | ❌ | ID câu lạc bộ được đánh giá |
| `rating` | Int | ✅ | Điểm đánh giá (thường 1–5) |
| `comment` | String | ❌ | Nội dung nhận xét |
| `isVisible` | Boolean | ✅ | Hiển thị công khai không |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |
| `deletedAt` | DateTime | ❌ | Thời điểm xóa mềm |

---

### `review_images` – Ảnh kèm đánh giá

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `reviewId` | String | ✅ FK | Liên kết tới `reviews.id` |
| `url` | String | ✅ | URL ảnh |
| `sortOrder` | Int | ✅ | Thứ tự hiển thị |
| `createdAt` | DateTime | ✅ | Thời điểm thêm |

---

## Notification & Post

### `notifications` – Thông báo

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ FK | Người nhận thông báo |
| `type` | NotificationType | ✅ | Loại thông báo |
| `title` | String | ✅ | Tiêu đề thông báo |
| `body` | String | ✅ | Nội dung thông báo |
| `bookingId` | String | ❌ FK | Đơn đặt liên quan (nếu có) |
| `isRead` | Boolean | ✅ | Đã đọc chưa |
| `readAt` | DateTime | ❌ | Thời điểm đọc |
| `createdAt` | DateTime | ✅ | Thời điểm tạo |

---

### `posts` – Bài đăng của câu lạc bộ

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `clubId` | String | ✅ FK | Câu lạc bộ đăng bài |
| `type` | PostType | ✅ | Loại bài: sân trống, khuyến mãi, sự kiện… |
| `status` | PostStatus | ✅ | Trạng thái bài đăng |
| `title` | String | ✅ | Tiêu đề bài |
| `content` | String | ✅ | Nội dung bài |
| `imageUrl` | String | ❌ | URL ảnh đính kèm |
| `linkedCourtId` | String | ❌ | Sân liên quan đến bài đăng |
| `linkedDate` | DateTime | ❌ | Ngày liên quan (vd: ngày sân trống) |
| `expiresAt` | DateTime | ❌ | Thời điểm bài hết hạn |
| `viewCount` | Int | ✅ | Số lượt xem |
| `createdAt` | DateTime | ✅ | Thời điểm đăng |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |
| `deletedAt` | DateTime | ❌ | Thời điểm xóa mềm |

---

## Misc & System

### `favorite_clubs` – Câu lạc bộ yêu thích

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ FK | Người dùng – liên kết `users.id` |
| `clubId` | String | ✅ FK | Câu lạc bộ – liên kết `clubs.id` |
| `createdAt` | DateTime | ✅ | Thời điểm thêm vào yêu thích |

**Unique:** `[userId, clubId]`

---

### `favorite_courts` – Sân yêu thích

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ✅ FK | Người dùng – liên kết `users.id` |
| `courtId` | String | ✅ FK | Sân – liên kết `courts.id` |
| `createdAt` | DateTime | ✅ | Thời điểm thêm vào yêu thích |

**Unique:** `[userId, courtId]`

---

### `club_customers` – Hồ sơ khách hàng tại câu lạc bộ

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `clubId` | String | ✅ FK | Câu lạc bộ – liên kết `clubs.id` |
| `userId` | String | ✅ FK | Khách hàng – liên kết `users.id` |
| `tier` | CustomerTier | ✅ | Hạng khách: NORMAL / SILVER / GOLD / VIP |
| `totalBookings` | Int | ✅ | Tổng số lần đặt sân tại CLB này |
| `totalCancels` | Int | ✅ | Tổng số lần hủy |
| `totalSpent` | Decimal(14,2) | ✅ | Tổng số tiền đã chi tại CLB này |
| `notes` | String | ❌ | Ghi chú nội bộ của chủ sân về khách |
| `createdAt` | DateTime | ✅ | Thời điểm trở thành khách hàng |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |

**Unique:** `[clubId, userId]`

---

### `audit_logs` – Nhật ký hoạt động hệ thống

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `userId` | String | ❌ FK | Người thực hiện hành động |
| `action` | String | ✅ | Hành động (vd: CREATE, UPDATE, DELETE) |
| `entity` | String | ✅ | Đối tượng bị tác động (vd: Booking, Club) |
| `entityId` | String | ❌ | ID của đối tượng bị tác động |
| `details` | Json | ❌ | Chi tiết thay đổi (before/after) |
| `ipAddress` | String | ❌ | IP thực hiện hành động |
| `userAgent` | String | ❌ | Trình duyệt / thiết bị |
| `createdAt` | DateTime | ✅ | Thời điểm ghi log |

---

### `system_configs` – Cấu hình hệ thống

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `id` | String (cuid) | ✅ PK | Định danh duy nhất |
| `key` | String | ✅ UNIQUE | Tên cấu hình (vd: `MAX_BOOKING_DAYS`) |
| `value` | String | ✅ | Giá trị cấu hình |
| `description` | String | ❌ | Mô tả mục đích cấu hình |
| `updatedAt` | DateTime | ✅ | Thời điểm cập nhật |

---

## Sơ đồ quan hệ

```
User ──────────────────────────────────────────────────────────┐
 │                                                              │
 ├─(1:1)── UserProfile                                         │
 ├─(1:n)── Session                                             │
 ├─(1:n)── PasswordReset                                       │
 ├─(1:1)── OwnerProfile                                        │
 ├─(1:n)── Club ──────────────────────────────────────────┐    │
 │           ├─(1:n)── ClubImage                          │    │
 │           ├─(1:n)── OpeningHour                        │    │
 │           ├─(1:n)── ClubAmenity ── Amenity             │    │
 │           ├─(1:n)── Court ─────────────────────────┐   │    │
 │           │           ├─(1:n)── CourtImage          │   │    │
 │           │           ├─(1:n)── CourtPricing        │   │    │
 │           │           ├─(1:n)── SpecialDatePricing  │   │    │
 │           │           └─(1:n)── TimeSlot ───────────┼───┼──┐ │
 │           ├─(1:n)── Post                            │   │  │ │
 │           └─(1:n)── Voucher                         │   │  │ │
 │                         └─(1:n)── VoucherUsage      │   │  │ │
 │                                                      │   │  │ │
 ├─(1:n)── Booking ────────────────────────────────────┘   │  │ │
 │           ├─(n:1)── Club                                 │  │ │
 │           ├─(n:1)── Court                                │  │ │
 │           ├─(n:1)── Voucher                              │  │ │
 │           ├─(1:n)── BookingItem ────────────────────────┘  │ │
 │           │                                                  │ │
 │           ├─(1:n)── BookingService ── Amenity               │ │
 │           ├─(1:n)── BookingStatusHistory                    │ │
 │           ├─(1:1)── Payment                                 │ │
 │           ├─(1:1)── Review ─── ReviewImage                  │ │
 │           └─(1:n)── Notification                            │ │
 │                                                              │ │
 ├─(1:n)── FavoriteClub ────────────────────────────────────── ┘ │
 ├─(1:n)── FavoriteCourt ─────────────────────────────────────── ┘
 ├─(1:n)── ClubCustomer
 └─(1:n)── AuditLog
```
