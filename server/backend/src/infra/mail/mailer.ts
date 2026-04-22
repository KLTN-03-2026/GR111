import nodemailer from "nodemailer";
import { env } from "@/core/config/env";

/** Inline-email palette aligned with client/frontend/src/assets/booking.css (.booking-page) */
const MAIL_UI = {
  green: "#16a34a",
  greenDark: "#0f7636",
  onGreenMuted: "#bbf7d0",
  greenTintBg: "#f0fdf4",
  greenTintBorder: "#bbf7d0",
  text: "#111827",
  textBody: "#4b5563",
  muted: "#6b7280",
  mutedLight: "#9ca3af",
  border: "#e5e7eb",
  pageBg: "#f4f5f7",
  white: "#ffffff",
  tableHead: "#f3f4f6",
  rowLine: "#f0f0f0",
  /** Pending / bank transfer — matches checkout warning accents */
  amber: "#f59e0b",
  amberDark: "#d97706",
  onAmberMuted: "#fef3c7",
  amberSurface: "#fffbeb",
  amberBorder: "#fde68a",
  amberHeading: "#92400e",
  danger: "#ef4444",
  divider: "#eeeeee",
} as const;

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer configuration error:", error);
  } else {
    console.log("✅ Mailer is ready to take our messages");
  }
});

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Playfinder Support" <${env.SMTP_USER ?? "no-reply@playfinder.local"}>`,
    to: email,
    subject: "Đặt lại mật khẩu - Playfinder",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px 20px; border: 1px solid ${MAIL_UI.border}; border-radius: 10px; background: ${MAIL_UI.white}; color: ${MAIL_UI.text};">
        <h2 style="color: ${MAIL_UI.green}; text-align: center; margin-top: 0;">Đặt lại mật khẩu của bạn</h2>
        <p style="color: ${MAIL_UI.textBody};">Xin chào,</p>
        <p style="color: ${MAIL_UI.textBody};">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này.</p>
        <p style="color: ${MAIL_UI.textBody};">Vui lòng nhấn vào nút bên dưới để tiến hành thay đổi mật khẩu. Liên kết này sẽ hết hạn trong vòng <strong>1 giờ</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, ${MAIL_UI.green}, ${MAIL_UI.greenDark}); color: ${MAIL_UI.white}; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
        </div>
        <p style="color: ${MAIL_UI.textBody};">Nếu bạn không yêu cầu thay đổi này, bạn có thể bỏ qua email này một cách an toàn.</p>
        <hr style="border: none; border-top: 1px solid ${MAIL_UI.divider}; margin: 20px 0;">
        <p style="font-size: 12px; color: ${MAIL_UI.muted}; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("EMAIL_SEND_FAILED");
  }
}

export interface BookingEmailData {
  bookingId: string;
  bookerName: string;
  bookerEmail: string;
  bookerPhone?: string;
  bookingCode: string;
  clubName: string;
  courtName: string;
  slots: { date: string; time: string }[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  cancelSupportToken?: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const slotRows = data.slots
    .map(
      (slot) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${MAIL_UI.rowLine}; color: ${MAIL_UI.text};">${slot.date}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${MAIL_UI.rowLine}; color: ${MAIL_UI.text};">${slot.time}</td>
      </tr>`
    )
    .join("");

  const mailOptions = {
    from: `"Playfinder" <${env.SMTP_USER ?? "no-reply@playfinder.local"}>`,
    to: data.bookerEmail,
    subject: `✅ Đặt sân thành công - ${data.bookingCode}`,
    html: `
      <div style="font-family: 'Barlow', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${MAIL_UI.white};">
        <div style="background: linear-gradient(135deg, ${MAIL_UI.green}, ${MAIL_UI.greenDark}); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: ${MAIL_UI.white}; margin: 0; font-size: 24px;">🎉 Đặt sân thành công!</h1>
          <p style="color: ${MAIL_UI.onGreenMuted}; margin: 8px 0 0; font-size: 14px;">Mã đơn: <strong style="color: ${MAIL_UI.white};">${data.bookingCode}</strong></p>
        </div>

        <div style="padding: 24px 20px; border: 1px solid ${MAIL_UI.border}; border-top: none;">
          <p style="font-size: 16px; color: ${MAIL_UI.text};">Xin chào <strong>${data.bookerName}</strong>,</p>
          <p style="color: ${MAIL_UI.textBody};">Cảm ơn bạn đã đặt sân tại <strong style="color: ${MAIL_UI.text};">${data.clubName}</strong>. Dưới đây là chi tiết đơn đặt sân của bạn:</p>

          <div style="background: ${MAIL_UI.pageBg}; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: ${MAIL_UI.green}; font-size: 16px;">📋 Thông tin đơn đặt sân</h3>
            <table style="width: 100%; font-size: 14px; color: ${MAIL_UI.text};">
              <tr>
                <td style="padding: 4px 0; color: ${MAIL_UI.muted};">Sân:</td>
                <td style="padding: 4px 0; font-weight: 600;">${data.courtName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: ${MAIL_UI.muted};">Phương thức thanh toán:</td>
                <td style="padding: 4px 0; font-weight: 600;">${data.paymentMethod}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: ${MAIL_UI.green}; font-size: 16px;">⏰ Khung giờ đã đặt</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: ${MAIL_UI.tableHead};">
                  <th style="padding: 10px 12px; text-align: left; color: ${MAIL_UI.muted}; font-weight: 600;">Ngày</th>
                  <th style="padding: 10px 12px; text-align: left; color: ${MAIL_UI.muted}; font-weight: 600;">Giờ</th>
                </tr>
              </thead>
              <tbody>${slotRows}</tbody>
            </table>
          </div>

          <div style="background: ${MAIL_UI.greenTintBg}; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid ${MAIL_UI.greenTintBorder};">
            <h3 style="margin: 0 0 12px; color: ${MAIL_UI.green}; font-size: 16px;">💰 Chi tiết thanh toán</h3>
            <table style="width: 100%; font-size: 14px; color: ${MAIL_UI.text};">
              <tr>
                <td style="padding: 4px 0;">Tạm tính:</td>
                <td style="padding: 4px 0; text-align: right;">${formatCurrency(data.totalAmount)}</td>
              </tr>
              ${data.discountAmount > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: ${MAIL_UI.green};">Giảm giá:</td>
                <td style="padding: 4px 0; text-align: right; color: ${MAIL_UI.green};">-${formatCurrency(data.discountAmount)}</td>
              </tr>` : ""}
              <tr style="border-top: 2px solid ${MAIL_UI.green};">
                <td style="padding: 8px 0; font-weight: 700; font-size: 16px;">Tổng thanh toán:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 16px; color: ${MAIL_UI.green};">${formatCurrency(data.finalAmount)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 13px; color: ${MAIL_UI.muted}; margin-bottom: 12px;">Bạn cần hủy hoặc thay đổi lịch? Nhấn vào đây để xem thông tin liên hệ chủ sân:</p>
            <a href="${data.cancelSupportToken
              ? `${env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"}/booking-cancel-support?token=${encodeURIComponent(data.cancelSupportToken)}`
              : `${env.NEXT_PUBLIC_APP_URL || "http://localhost:5173"}/order`}"
               style="background-color: ${MAIL_UI.danger}; color: ${MAIL_UI.white}; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Yêu cầu hủy / Liên hệ chủ sân
            </a>
          </div>

          <p style="font-size: 13px; color: ${MAIL_UI.mutedLight}; text-align: center; margin-top: 24px;">
            Nếu bạn cần hỗ trợ, vui lòng liên hệ <a href="mailto:support@sportsfield.vn" style="color: ${MAIL_UI.green}; font-weight: 600;">support@sportsfield.vn</a>
          </p>
        </div>

        <div style="background: ${MAIL_UI.pageBg}; padding: 16px 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid ${MAIL_UI.border}; border-top: none;">
          <p style="font-size: 12px; color: ${MAIL_UI.mutedLight}; margin: 0;">© 2026 Playfinder. Đây là email tự động, vui lòng không phản hồi.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${data.bookerEmail}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
    return false;
  }
}

export async function sendBookingWaitingPaymentEmail(data: BookingEmailData) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const slotRows = data.slots
    .map(
      (slot) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${MAIL_UI.rowLine}; color: ${MAIL_UI.text};">${slot.date}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${MAIL_UI.rowLine}; color: ${MAIL_UI.text};">${slot.time}</td>
      </tr>`
    )
    .join("");

  const mailOptions = {
    from: `"Playfinder" <${env.SMTP_USER ?? "no-reply@playfinder.local"}>`,
    to: data.bookerEmail,
    subject: `🕒 Đang chờ thanh toán - ${data.bookingCode}`,
    html: `
      <div style="font-family: 'Barlow', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${MAIL_UI.white};">
        <div style="background: linear-gradient(135deg, ${MAIL_UI.amber}, ${MAIL_UI.amberDark}); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: ${MAIL_UI.white}; margin: 0; font-size: 24px;">📝 Đã nhận đơn đặt sân!</h1>
          <p style="color: ${MAIL_UI.onAmberMuted}; margin: 8px 0 0; font-size: 14px;">Mã đơn: <strong style="color: ${MAIL_UI.white};">${data.bookingCode}</strong></p>
        </div>

        <div style="padding: 24px 20px; border: 1px solid ${MAIL_UI.border}; border-top: none;">
          <p style="font-size: 16px; color: ${MAIL_UI.text};">Xin chào <strong>${data.bookerName}</strong>,</p>
          <p style="color: ${MAIL_UI.textBody};">Chúng tôi đã nhận được yêu cầu đặt sân của bạn tại <strong style="color: ${MAIL_UI.text};">${data.clubName}</strong>. Vui lòng hoàn tất thanh toán chuyển khoản để chính thức nhận sân.</p>

          <div style="background: ${MAIL_UI.amberSurface}; border: 1px solid ${MAIL_UI.amberBorder}; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: ${MAIL_UI.amberHeading}; font-size: 16px;">🏦 Thông tin chuyển khoản</h3>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Ngân hàng:</strong> VietcomBank</p>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Số tài khoản:</strong> 1234567890</p>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Chủ tài khoản:</strong> NGUYEN DINH VI</p>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Nội dung:</strong> <span style="color: ${MAIL_UI.danger}; font-weight: 800;">${data.bookingCode}</span></p>
            <p style="margin: 12px 0 0; font-size: 13px; color: ${MAIL_UI.amberDark};">* Vui lòng chuyển đúng nội dung để hệ thống tự động xác nhận nhanh nhất.</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: ${MAIL_UI.amber}; font-size: 16px;">⏰ Chi tiết khung giờ</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead style="background: ${MAIL_UI.tableHead};">
                <tr>
                  <th style="padding: 10px 12px; text-align: left; color: ${MAIL_UI.muted};">Ngày</th>
                  <th style="padding: 10px 12px; text-align: left; color: ${MAIL_UI.muted};">Giờ</th>
                </tr>
              </thead>
              <tbody>${slotRows}</tbody>
            </table>
          </div>

          <div style="background: ${MAIL_UI.pageBg}; border-radius: 8px; padding: 16px; margin: 20px 0;">
             <table style="width: 100%; font-size: 14px; color: ${MAIL_UI.text};">
               <tr>
                 <td>Tổng thanh toán:</td>
                 <td style="text-align: right; font-weight: 700; color: ${MAIL_UI.amber}; font-size: 18px;">${formatCurrency(data.finalAmount)}</td>
               </tr>
             </table>
          </div>

          <p style="font-size: 12px; color: ${MAIL_UI.mutedLight}; text-align: center; margin-top: 24px;">
            Hệ thống sẽ giữ chỗ cho bạn trong vòng 15 phút. Sau thời gian này nếu chưa nhận được thanh toán, đơn sẽ tự động bị hủy.
          </p>
        </div>

        <div style="background: ${MAIL_UI.pageBg}; padding: 16px 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid ${MAIL_UI.border}; border-top: none;">
          <p style="font-size: 12px; color: ${MAIL_UI.mutedLight}; margin: 0;">© 2026 Playfinder. Cần hỗ trợ? Phản hồi email này.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Waiting payment email sent to ${data.bookerEmail}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("Failed to send waiting payment email:", error);
    return false;
  }
}

export interface OwnerNewBookingEmailData {
  ownerEmail: string;
  ownerName: string;
  bookerName: string;
  bookerEmail?: string;
  bookerPhone?: string;
  bookingCode: string;
  clubName: string;
  courtName: string;
  slots: { date: string; time: string }[];
  finalAmount: number;
  paymentMethod: string;
}

export async function sendOwnerNewBookingEmail(data: OwnerNewBookingEmailData) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const slotRows = data.slots
    .map(
      (slot) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${MAIL_UI.rowLine}; color: ${MAIL_UI.text};">${slot.date}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${MAIL_UI.rowLine}; color: ${MAIL_UI.text};">${slot.time}</td>
      </tr>`
    )
    .join("");

  const mailOptions = {
    from: `"Playfinder" <${env.SMTP_USER ?? "no-reply@playfinder.local"}>`,
    to: data.ownerEmail,
    subject: `📥 Đơn đặt sân mới - ${data.bookingCode}`,
    html: `
      <div style="font-family: 'Barlow', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${MAIL_UI.white};">
        <div style="background: linear-gradient(135deg, ${MAIL_UI.green}, ${MAIL_UI.greenDark}); padding: 24px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: ${MAIL_UI.white}; margin: 0; font-size: 22px;">📥 Bạn có đơn đặt sân mới</h1>
          <p style="color: ${MAIL_UI.onGreenMuted}; margin: 8px 0 0; font-size: 14px;">Mã đơn: <strong style="color: ${MAIL_UI.white};">${data.bookingCode}</strong></p>
        </div>

        <div style="padding: 24px 20px; border: 1px solid ${MAIL_UI.border}; border-top: none;">
          <p style="font-size: 16px; color: ${MAIL_UI.text};">Xin chào <strong>${data.ownerName}</strong>,</p>
          <p style="color: ${MAIL_UI.textBody};">Hệ thống vừa ghi nhận một đơn đặt sân mới tại <strong style="color: ${MAIL_UI.text};">${data.clubName}</strong>.</p>

          <div style="background: ${MAIL_UI.pageBg}; border-radius: 8px; padding: 16px; margin: 18px 0;">
            <h3 style="margin: 0 0 10px; color: ${MAIL_UI.green}; font-size: 16px;">👤 Thông tin người đặt</h3>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Họ tên:</strong> ${data.bookerName}</p>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Email:</strong> ${data.bookerEmail || "Không có"}</p>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Số điện thoại:</strong> ${data.bookerPhone || "Không có"}</p>
          </div>

          <div style="background: ${MAIL_UI.pageBg}; border-radius: 8px; padding: 16px; margin: 18px 0;">
            <h3 style="margin: 0 0 10px; color: ${MAIL_UI.green}; font-size: 16px;">📋 Thông tin đơn</h3>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Sân:</strong> ${data.courtName}</p>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Phương thức:</strong> ${data.paymentMethod}</p>
            <p style="margin: 4px 0; font-size: 14px; color: ${MAIL_UI.text};"><strong>Tổng tiền:</strong> <span style="font-weight: 700; color: ${MAIL_UI.green};">${formatCurrency(data.finalAmount)}</span></p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: ${MAIL_UI.green}; font-size: 16px;">⏰ Khung giờ đã đặt</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: ${MAIL_UI.tableHead};">
                  <th style="padding: 10px 12px; text-align: left; color: ${MAIL_UI.muted}; font-weight: 600;">Ngày</th>
                  <th style="padding: 10px 12px; text-align: left; color: ${MAIL_UI.muted}; font-weight: 600;">Giờ</th>
                </tr>
              </thead>
              <tbody>${slotRows}</tbody>
            </table>
          </div>
        </div>

        <div style="background: ${MAIL_UI.pageBg}; padding: 14px 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid ${MAIL_UI.border}; border-top: none;">
          <p style="font-size: 12px; color: ${MAIL_UI.mutedLight}; margin: 0;">© 2026 Playfinder. Đây là email tự động, vui lòng không phản hồi.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`New booking email sent to owner ${data.ownerEmail}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("Failed to send owner new booking email:", error);
    return false;
  }
}
