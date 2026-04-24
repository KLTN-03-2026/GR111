import { prisma } from "@/infra/db/prisma";
import { eventEmitter } from "@/lib/events";
import {
  vnDateTimeFromYmdAndDbTime,
  vnDayRange,
  vnHourAndDayOfWeek,
  vnNoonAnchor,
} from "@/lib/vnCalendar";
import { slotRepository } from "@/modules/slot/slot.repository";

/**
 * Slot Service (Modular version)
 * Handles hybrid slot generation and status management.
 */

/**
 * Logic lai (Hybrid): Tính toán các khung giờ ảo dựa trên giờ mở cửa,
 * sau đó ghép với các bản ghi thực tế trong DB.
 */
/**
 * @param ymd Chuỗi YYYY-MM-DD — ngày đặt theo lịch Việt Nam (không phụ thuộc TZ server)
 */
export async function getInferredSlotsForCourt(courtId: string, ymd: string) {
  const court = await slotRepository.findCourtContext(courtId);
  if (!court) throw new Error("COURT_NOT_FOUND");

  const { dayOfWeek } = vnHourAndDayOfWeek(vnNoonAnchor(ymd));
  const oh = court.club.openingHours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!oh || oh.isClosed) return [];

  const slotDuration = court.club.slotDuration;

  let open = vnDateTimeFromYmdAndDbTime(ymd, oh.openTime);
  let close = vnDateTimeFromYmdAndDbTime(ymd, oh.closeTime);
  const overnight = close <= open;
  if (overnight) {
    close = new Date(close.getTime() + 24 * 60 * 60 * 1000);
  }

  let { start: startRange, end: endRange } = vnDayRange(ymd);
  if (overnight) {
    endRange = new Date(endRange.getTime() + 24 * 60 * 60 * 1000);
  }
  const realSlots = await slotRepository.getBusySlots(courtId, startRange, endRange);

  const results: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    bookingStatus: string | null;
  }[] = [];
  let currentStart = new Date(open);

  while (currentStart < close) {
    const nextSlotStart = new Date(currentStart.getTime() + slotDuration * 60000);
    if (nextSlotStart > close) break;

    const startTime = new Date(currentStart);
    const endTime = new Date(nextSlotStart);

    const realOne = realSlots.find((s) => s.startTime.getTime() === startTime.getTime());

    results.push({
      id: realOne?.id || `v-${startTime.getTime()}`,
      startTime,
      endTime,
      status: realOne?.status || "AVAILABLE",
      bookingStatus: realOne?.bookingItems?.[0]?.booking?.status || null,
    });

    currentStart = nextSlotStart;
  }

  return results;
}

/**
 * Tự động tạo TimeSlot hoặc đảm bảo nó tồn tại
 */
export async function ensureSlotExists(courtId: string, startTime: Date, endTime: Date) {
  return slotRepository.upsertSlot({
      courtId,
      startTime,
      endTime,
      status: "AVAILABLE"
  });
}

/**
 * Lấy lịch sử slot thô từ DB (Dùng khi cần debug hoặc xem chi tiết)
 */
export async function getSlotsByCourtId(courtId: string, startDate: Date, endDate: Date) {
  return prisma.timeSlot.findMany({
    where: {
      courtId,
      startTime: { gte: startDate },
      endTime: { lte: endDate }
    },
    include: {
      court: { select: { name: true, sportType: true } }
    },
    orderBy: { startTime: 'asc' }
  });
}

/**
 * Chủ sân chủ động đóng/mở khung giờ
 */
export async function toggleSlotStatus(
    courtId: string, 
    startTime: Date, 
    endTime: Date, 
    ownerId: string, 
    newStatus: "LOCKED" | "AVAILABLE"
) {
  // 1. Kiểm tra quyền sở hữu bằng cách join qua Repository hoặc truy vấn nhẹ
  const court = await prisma.court.findFirst({
    where: { id: courtId, club: { ownerId } }
  });
  if (!court) throw new Error("UNAUTHORIZED");

  // 2. Kiểm tra xem slot hiện tại có đang bị BOOKED không
  const existingSlot = await slotRepository.findByCourtAndStartTime(courtId, new Date(startTime));
  if (existingSlot && existingSlot.status === "BOOKED") {
    throw new Error("CANNOT_TOGGLE_BOOKED_SLOT_CANCEL_BOOKING_FIRST");
  }

  // 3. Thực hiện cập nhật DB thông qua Repository
  const updatedSlot = await slotRepository.upsertSlot({
    courtId,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    status: newStatus
  });

  // 3. ── DECOUPLED NOTIFICATION ──────────────────────────
  eventEmitter.emit('slot.toggled', {
    clubId: updatedSlot.court.clubId,
    slot: updatedSlot,
    type: `slot-toggled-${newStatus.toLowerCase()}`
  });

  return updatedSlot;
}

// Bác bỏ Legacy code
export async function generateSlotsForCourt(courtId: string, date: Date) {
    return { count: 0, message: "Use hybrid slots logic instead." };
}
