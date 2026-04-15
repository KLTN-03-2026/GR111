import { eventEmitter } from "@/lib/events";
import { notifyNewBooking, notifyBookingStatusChanged } from "@/lib/socket";
import {
  sendBookingConfirmationEmail,
  sendBookingWaitingPaymentEmail,
  sendBookingCancelledEmail,
} from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CREDIT_CARD: 'Thẻ tín dụng',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
  CASH: 'Tiền mặt',
};

/**
 * Booking Event Listener
 * Connects domain events ('booking.created', 'booking.cancelled', etc.) 
 * to side effects like real-time notifications or email sending.
 * This keeps the business logic in the service completely agnostic of these triggers.
 */
export const initBookingListeners = () => {
  /**
   * Listen for new booking creation.
   * Sends appropriate email based on payment method:
   *   - BANK_TRANSFER → email hướng dẫn chuyển khoản (chờ thanh toán)
   *   - CASH          → email xác nhận đặt chỗ thành công (thanh toán tại sân)
   *   - MOMO/VNPAY/CREDIT_CARD → email thông báo đang xử lý thanh toán
   */
  eventEmitter.on('booking.created', async ({ clubId, booking, type }) => {
    // 1. Real-time Socket notification (cho Owner dashboard)
    if (clubId) {
      await notifyNewBooking(clubId, {
        booking,
        type: type || 'new-booking'
      });
    }

    // 2. Gửi email xác nhận/thông tin thanh toán
    try {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          club: { select: { name: true } },
          items: {
            include: {
              timeSlot: {
                include: { court: { select: { name: true } } }
              }
            }
          },
          payment: { select: { method: true } }
        }
      });

      if (fullBooking && fullBooking.bookerEmail) {
        const courtNames = [...new Set(
          fullBooking.items.map(item => item.timeSlot.court.name)
        )].join(', ');

        const slots = fullBooking.items.map(item => {
          const start = new Date(item.timeSlot.startTime);
          const end   = new Date(item.timeSlot.endTime);
          return {
            date: start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          };
        });

        const emailData = {
          bookingId:     fullBooking.id,
          bookerName:    fullBooking.bookerName,
          bookerEmail:   fullBooking.bookerEmail,
          bookingCode:   fullBooking.bookingCode,
          clubName:      fullBooking.club?.name || 'N/A',
          courtName:     courtNames,
          slots,
          totalAmount:   Number(fullBooking.totalAmount),
          discountAmount: Number(fullBooking.discountAmount),
          finalAmount:   Number(fullBooking.finalAmount),
          paymentMethod: PAYMENT_METHOD_LABELS[fullBooking.payment?.method || ''] || fullBooking.payment?.method || 'N/A',
        };

        const method = fullBooking.payment?.method;

        if (method === 'BANK_TRANSFER') {
          // Chuyển khoản: hướng dẫn thanh toán, giữ chỗ 15 phút
          await sendBookingWaitingPaymentEmail(emailData);
        } else if (method === 'CASH') {
          // Tiền mặt (đặt lịch thủ công, thanh toán tại sân): xác nhận giữ chỗ
          await sendBookingConfirmationEmail(emailData);
        } else {
          // MoMo, VNPay, Credit Card: đang xử lý thanh toán online → gửi email chờ
          await sendBookingWaitingPaymentEmail(emailData);
        }

        console.log(`📧 [booking.created] email sent → ${fullBooking.bookerEmail} (method: ${method})`);
      }
    } catch (error) {
      console.error('⚠️ Lỗi khi gửi email khởi tạo booking:', error);
    }
  });

  /**
   * Listen for booking status changes.
   * CONFIRMED → gửi email hóa đơn xác nhận thành công.
   */
  eventEmitter.on('booking.status_updated', async ({ clubId, booking, type }) => {
    // 1. Thông báo cho Owner dashboard (venue room)
    if (clubId) {
      await notifyNewBooking(clubId, {
        booking,
        type: type || 'booking-status-updated'
      });
    }

    // 2. Thông báo real-time cho khách hàng
    if (booking?.id) {
      notifyBookingStatusChanged(booking.id, {
        bookingId: booking.id,
        status:    booking.status,
        type:      type || 'booking-status-updated'
      });
    }

    // 3. CONFIRMED (thanh toán thành công) → Gửi email hóa đơn xác nhận
    if (booking?.status === 'CONFIRMED') {
      try {
        await sendInvoiceEmail(booking.id);
      } catch (err) {
        console.error('⚠️ Lỗi khi gửi hóa đơn thanh toán:', err);
      }
    }
  });

  /**
   * Listen for cancellations — gửi email thông báo huỷ cho khách.
   */
  eventEmitter.on('booking.cancelled', async ({ clubId, booking }) => {
    // 1. Thông báo real-time cho Owner
    if (clubId) {
      await notifyNewBooking(clubId, {
        booking,
        type: 'booking-cancelled'
      });
    }

    // 2. Gửi email thông báo huỷ đơn cho khách
    try {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          club:  { select: { name: true } },
          items: {
            include: {
              timeSlot: {
                include: { court: { select: { name: true } } }
              }
            }
          },
        }
      });

      if (fullBooking?.bookerEmail) {
        const courtNames = [...new Set(
          fullBooking.items.map(item => item.timeSlot.court.name)
        )].join(', ');

        const slots = fullBooking.items.map(item => {
          const start = new Date(item.timeSlot.startTime);
          const end   = new Date(item.timeSlot.endTime);
          return {
            date: start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          };
        });

        await sendBookingCancelledEmail({
          bookerName:  fullBooking.bookerName,
          bookerEmail: fullBooking.bookerEmail,
          bookingCode: fullBooking.bookingCode,
          clubName:    fullBooking.club?.name || 'N/A',
          courtName:   courtNames,
          slots,
          finalAmount: Number(fullBooking.finalAmount),
        });

        console.log(`📧 [booking.cancelled] email sent → ${fullBooking.bookerEmail}`);
      }
    } catch (error) {
      console.error('⚠️ Lỗi khi gửi email hủy booking:', error);
    }
  });
};

/**
 * Hàm hỗ trợ: gửi email hóa đơn sau khi thanh toán được xác nhận
 */
async function sendInvoiceEmail(bookingId: string) {
  const fullBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      club:  { select: { name: true } },
      items: {
        include: {
          timeSlot: {
            include: { court: { select: { name: true } } }
          }
        }
      },
      payment: { select: { method: true } }
    }
  });

  if (fullBooking && fullBooking.bookerEmail) {
    const courtNames = [...new Set(
      fullBooking.items.map(item => item.timeSlot.court.name)
    )].join(', ');

    const slots = fullBooking.items.map(item => {
      const start = new Date(item.timeSlot.startTime);
      const end   = new Date(item.timeSlot.endTime);
      return {
        date: start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      };
    });

    await sendBookingConfirmationEmail({
      bookingId:     fullBooking.id,
      bookerName:    fullBooking.bookerName,
      bookerEmail:   fullBooking.bookerEmail,
      bookingCode:   fullBooking.bookingCode,
      clubName:      fullBooking.club?.name || 'N/A',
      courtName:     courtNames,
      slots,
      totalAmount:   Number(fullBooking.totalAmount),
      discountAmount: Number(fullBooking.discountAmount),
      finalAmount:   Number(fullBooking.finalAmount),
      paymentMethod: PAYMENT_METHOD_LABELS[fullBooking.payment?.method || ''] || fullBooking.payment?.method || 'N/A',
    });

    console.log(`📧 [booking.confirmed] invoice email sent → ${fullBooking.bookerEmail}`);
  }
}
