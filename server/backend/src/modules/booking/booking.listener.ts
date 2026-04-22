import { eventEmitter } from "@/lib/events";
import { notifyNewBooking, notifyBookingStatusChanged } from "@/infra/realtime/socket";
import {
  sendBookingConfirmationEmail,
  sendBookingWaitingPaymentEmail,
  sendOwnerNewBookingEmail,
} from "@/infra/mail/mailer";
import { prisma } from "@/infra/db/prisma";
import { generateBookingCancelSupportToken } from "@/modules/booking/booking-cancel-support";

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
   * Listen for new booking creation
   */
  eventEmitter.on('booking.created', async ({ clubId, booking, type }) => {
    // 1. Real-time Socket notification (cho Owner dashboard)
    if (clubId) {
      await notifyNewBooking(clubId, {
        booking,
        type: type || 'new-booking'
      });
    }

    // 2. Gửi email xác nhận/thông tin thanh toán dựa trên phương thức
    try {
      const fullBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          club: {
            select: {
              name: true,
              email: true,
              owner: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
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

      if (fullBooking) {
        const courtNames = [...new Set(
          fullBooking.items.map(item => item.timeSlot.court.name)
        )].join(', ');

        const slots = formatSlots(fullBooking.items);
        const cancelSupportToken = generateBookingCancelSupportToken({
          bookingId: fullBooking.id,
          bookingCode: fullBooking.bookingCode,
          bookerEmail: fullBooking.bookerEmail || undefined,
        });

        if (fullBooking.bookerEmail) {
          const emailData = {
            bookingId: fullBooking.id,
            bookerName: fullBooking.bookerName,
            bookerEmail: fullBooking.bookerEmail,
            bookerPhone: fullBooking.bookerPhone,
            bookingCode: fullBooking.bookingCode,
            clubName: fullBooking.club?.name || 'N/A',
            courtName: courtNames,
            slots,
            totalAmount: Number(fullBooking.totalAmount),
            discountAmount: Number(fullBooking.discountAmount),
            finalAmount: Number(fullBooking.finalAmount),
            paymentMethod: PAYMENT_METHOD_LABELS[fullBooking.payment?.method || ''] || fullBooking.payment?.method || 'N/A',
            cancelSupportToken,
          };

          // Nếu là chuyển khoản hoặc các phương thức online khác, gửi hướng dẫn thanh toán.
          // Nếu là tiền mặt, gửi xác nhận đặt chỗ.
          const onlineMethods = ['BANK_TRANSFER', 'VNPAY', 'MOMO', 'CREDIT_CARD'];

          if (onlineMethods.includes(fullBooking.payment?.method || '')) {
             console.log(`Sending waiting payment email for booking ${fullBooking.bookingCode} via ${fullBooking.payment?.method}`);
             await sendBookingWaitingPaymentEmail(emailData);
          } else if (fullBooking.payment?.method === 'CASH') {
             console.log(`Sending confirmation email for CASH booking ${fullBooking.bookingCode}`);
             await sendBookingConfirmationEmail(emailData);
          }
        }

        const ownerEmailCandidates = [
          fullBooking.club?.email || null,
          fullBooking.club?.owner?.email || null,
        ].filter(Boolean) as string[];
        const ownerEmail = [...new Set(ownerEmailCandidates)].join(",");

        if (ownerEmail) {
          await sendOwnerNewBookingEmail({
            ownerEmail,
            ownerName: fullBooking.club?.owner?.fullName || "Chủ sân",
            bookerName: fullBooking.bookerName,
            bookerEmail: fullBooking.bookerEmail || undefined,
            bookerPhone: fullBooking.bookerPhone,
            bookingCode: fullBooking.bookingCode,
            clubName: fullBooking.club?.name || "N/A",
            courtName: courtNames,
            slots,
            finalAmount: Number(fullBooking.finalAmount),
            paymentMethod:
              PAYMENT_METHOD_LABELS[fullBooking.payment?.method || ""] ||
              fullBooking.payment?.method ||
              "N/A",
          });
        }
      }
    } catch (error) {
      console.error('⚠️ Lỗi khi gửi email khởi tạo booking:', error);
    }
  });

  /**
   * Listen for booking status changes
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
        status: booking.status,
        type: type || 'booking-status-updated'
      });
    }

    // 3. Nếu trạng thái là CONFIRMED (thanh toán thành công) → Gửi email hóa đơn
    if (booking?.status === 'CONFIRMED') {
      console.log(`Booking ${booking.id} confirmed, triggering invoice email...`);
      try {
        await sendInvoice(booking.id);
      } catch (err) {
        console.error('⚠️ Lỗi khi gửi hóa đơn thanh toán:', err);
      }
    }
  });

  /**
   * Listen for cancellations
   */
  eventEmitter.on('booking.cancelled', async ({ clubId, booking }) => {
      if (clubId) {
        await notifyNewBooking(clubId, {
          booking,
          type: 'booking-cancelled'
        });
      }
  });
};

/**
 * Hàm hỗ trợ gửi email hóa đơn
 */
async function sendInvoice(bookingId: string) {
  const fullBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
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

    const slots = formatSlots(fullBooking.items);
    const cancelSupportToken = generateBookingCancelSupportToken({
      bookingId: fullBooking.id,
      bookingCode: fullBooking.bookingCode,
      bookerEmail: fullBooking.bookerEmail || undefined,
    });

    console.log(`Sending invoice email for booking ${fullBooking.bookingCode} to ${fullBooking.bookerEmail}`);
    const success = await sendBookingConfirmationEmail({
      bookingId: fullBooking.id,
      bookerName: fullBooking.bookerName,
      bookerEmail: fullBooking.bookerEmail,
      bookerPhone: fullBooking.bookerPhone,
      bookingCode: fullBooking.bookingCode,
      clubName: fullBooking.club?.name || 'N/A',
      courtName: courtNames,
      slots,
      totalAmount: Number(fullBooking.totalAmount),
      discountAmount: Number(fullBooking.discountAmount),
      finalAmount: Number(fullBooking.finalAmount),
      paymentMethod: PAYMENT_METHOD_LABELS[fullBooking.payment?.method || ''] || fullBooking.payment?.method || 'N/A',
      cancelSupportToken,
    });
    
    if (success) {
      console.log(`✅ Invoice email sent successfully to ${fullBooking.bookerEmail}`);
    } else {
      console.warn(`❌ Failed to send invoice email to ${fullBooking.bookerEmail}`);
    }
  } else {
    console.warn(`⚠️ Could not send invoice: Missing booking data or email for ID ${bookingId}`);
  }
}

/**
 * Hàm format slots cho email
 */
function formatSlots(items: any[]) {
  return items.map(item => {
    const start = new Date(item.timeSlot.startTime);
    const end = new Date(item.timeSlot.endTime);
    return {
      date: start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
    };
  });
}
