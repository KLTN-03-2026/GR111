# 🗄️ Database Design - Sports Field Booking Platform

Tài liệu này mô tả chi tiết kiến trúc cơ sở dữ liệu của hệ thống, bao gồm các model, mối quan hệ và ý nghĩa nghiệp vụ của từng bảng.

---

## 🏗️ 1. Module Người dùng & Xác thực (User & Auth)

Hệ thống quản lý người dùng với cơ chế phân quyền RBAC (Role-Based Access Control).

- **User**: Table trung tâm lưu giữ thông tin tài khoản, email, mật khẩu và vai trò (`USER`, `OWNER`, `OWNER`). Hỗ trợ đăng nhập qua Google/Facebook.
- **UserProfile**: Lưu trữ thông tin mở rộng của người dùng (địa chỉ, ngày sinh, bio, giới tính).
- **Session**: Quản lý phiên đăng nhập, hỗ trợ thu hồi token (`isRevoked`) và theo dõi thiết bị.
- **PasswordReset**: Lưu trữ mã token khôi phục mật khẩu và thời gian hết hạn.

---

## 🏟️ 2. Module Câu lạc bộ (Club Management)

Quản lý thông tin về các cơ sở thể thao.

- **Club**: Đại diện cho một trung tâm thể thao. Chứa thông tin vị trí (`lat`, `lng`), thông tin liên hệ và trạng thái phê duyệt (`ApprovalStatus`).
- **ClubImage**: Thư viện ảnh của câu lạc bộ, hỗ trợ sắp xếp thứ tự hiển thị.
- **OpeningHour**: Định nghĩa khung giờ mở/đóng cửa cho từng ngày trong tuần (0-6).
- **Amenity**: Danh mục tiện ích dùng chung (Wifi, Gửi xe, Tắm rửa...).
- **ClubAmenity**: Mối quan hệ N-N giữa Club và Amenity, có thể đính kèm phí dịch vụ cho từng tiện ích tại CLB đó.
- **OwnerProfile**: Chứa thông tin KYC của chủ sân (CCCD, giấy phép kinh doanh, thông tin ngân hàng) để hệ thống đối soát và chi trả.

---

## 🎾 3. Module Sân & Giá (Court & Pricing)

Quản lý chi tiết từng sân con và cơ chế giá linh hoạt.

- **Court**: Từng sân cụ thể trong một Club (Ví dụ: Sân 5 số 1, Sân 7...). Phân loại theo `SportType` (Bóng đá, Cầu lông, Tennis...).
- **CourtPricing**: Bảng giá cố định theo khung giờ hàng tuần (Ví dụ: 17h-21h thứ 2-6 giá cao hơn).
- **SpecialDatePricing**: Cho phép ghi đè giá vào các ngày đặc biệt (Lễ, Tết) mà không ảnh hưởng đến bảng giá tuần.
- **TimeSlot**: Đơn vị hàng tồn kho nhỏ nhất. Mỗi TimeSlot đại diện cho một khung giờ cụ thể của một sân vào một ngày (Ví dụ: Sân 1, 08:00 - 09:00, ngày 15/04).

---

## 📅 4. Module Đặt sân & Thanh toán (Booking & Payment)

Trái tim của hệ thống xử lý giao dịch.

- **Booking**: Lưu thông tin tổng quát của đơn hàng, tổng tiền, chiết khấu và trạng thái (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
- **BookingItem**: Liên kết Booking với một hoặc nhiều `TimeSlot`. Lưu giá tại thời điểm đặt để tránh biến động giá sau này.
- **BookingService**: Các dịch vụ đi kèm (thuê nước, thuê vợt) được chọn khi đặt sân.
- **Payment**: Quản lý giao dịch thanh toán. Hỗ trợ nhiều phương thức (`VNPAY`, `MOMO`, `BANK_TRANSFER`). Theo dõi cả quy trình hoàn tiền (`RefundStatus`).
- **BookingStatusHistory**: Nhật ký thay đổi trạng thái đơn hàng để phục vụ đối soát và khiếu nại.

---

## ⭐️ 5. Module Tương tác & Marketing (Social & Marketing)

Tăng cường trải nghiệm và giữ chân người dùng.

- **Review**: Đánh giá của người dùng sau khi hoàn thành đơn đặt sân. Bao gồm số sao (`rating`) và bình luận.
- **ReviewImage**: Hình ảnh thực tế đính kèm trong bài đánh giá.
- **FavoriteClub / FavoriteCourt**: Danh sách quan tâm của người dùng.
- **Post**: Bản tin của CLB (Khuyến mãi, tìm đối, thông báo sửa chữa...).
- **Voucher**: Định nghĩa các mã giảm giá, hỗ trợ giảm theo % hoặc số tiền mặt, có điều kiện đơn hàng tối thiểu.
- **VoucherUsage**: Theo dõi việc sử dụng voucher của từng User để đảm bảo giới hạn lượt dùng.

---

## ⚙️ 6. Module Hệ thống (System)

- **Notification**: Thông báo đẩy/in-app cho người dùng về trạng thái đơn hàng hoặc tin tức.
- **AuditLog**: Ghi lại mọi tác động nhạy cảm vào hệ thống (thay đổi giá, hủy đơn, cập nhật KYC) để phục vụ bảo mật.
- **SystemConfig**: Các cấu hình động của hệ thống (phí sàn, thời gian giữ chỗ tự động...).

---

## 🔄 Luồng hoạt động chính (Workflows)

1.  **Chủ sân**: Đăng ký -> Hoàn thiện OwnerProfile -> Tạo Club -> Tạo Courts & Pricings -> Chờ Admin duyệt.
2.  **Khách hàng**: Tìm kiếm Club -> Chọn Court -> Xem TimeSlot trống -> Đặt sân & Thanh toán -> Nhận Notification.
3.  **Hệ thống**: Tự động tạo TimeSlot dựa trên OpeningHour -> Khóa Slot khi có người bắt đầu đặt -> Hủy Slot nếu quá hạn thanh toán.
4.  **Hậu mãi**: Khách hàng chơi xong -> Đánh giá Review -> Tích lũy điểm tại ClubCustomer.
