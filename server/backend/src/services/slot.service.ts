import { prisma } from "@/lib/prisma";

/**
 * Tự động tạo các TimeSlot cho một sân vào một ngày cụ thể dựa trên slotDuration và giờ mở cửa
 */
export async function generateSlotsForCourt(courtId: string, date: Date) {
  // 1. Lấy thông tin sân và câu lạc bộ (kèm giờ mở cửa)
  const court = await prisma.court.findUnique({
    where: { id: courtId },
    include: {
      club: {
        include: {
          openingHours: true
        }
      }
    }
  });

  if (!court) throw new Error("COURT_NOT_FOUND");

  // 2. Xác định giờ mở cửa của ngày hôm đó (Thứ mấy trong tuần)
  const dayOfWeek = date.getDay();
  const oh = court.club.openingHours.find(h => h.dayOfWeek === dayOfWeek);

  if (!oh || oh.isClosed) return { count: 0, message: "Club is closed on this day" };

  const slotDuration = court.club.slotDuration;
  
  // 3. Chuẩn bị mốc thời gian Bắt đầu và Kết thúc của ngày hôm đó
  // oh.openTime trong DB chỉ lấy phần Giờ:Phút (lưu dưới dạng UTC Date năm 1970)
  const start = new Date(date);
  start.setHours(oh.openTime.getHours(), oh.openTime.getMinutes(), 0, 0);

  const end = new Date(date);
  end.setHours(oh.closeTime.getHours(), oh.closeTime.getMinutes(), 0, 0);

  // 4. Sinh danh sách các slot
  const slotsToCreate = [];
  let currentStart = new Date(start);

  while (currentStart < end) {
    const nextSlotStart = new Date(currentStart.getTime() + slotDuration * 60000);
    
    // Nếu slot cuối cùng vượt quá giờ đóng cửa thì dừng
    if (nextSlotStart > end) break;

    slotsToCreate.push({
      courtId,
      startTime: new Date(currentStart),
      endTime: new Date(nextSlotStart),
      status: "AVAILABLE" as const,
    });

    currentStart = nextSlotStart;
  }

  // 5. Lưu vào DB (Bỏ qua nếu slot đã tồn tại để tránh trùng lặp)
  // Ta kiểm tra xem ngày đó đã có slot nào chưa
  const existingCount = await prisma.timeSlot.count({
    where: {
      courtId,
      startTime: {
        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
      }
    }
  });

  if (existingCount > 0) {
    return { count: 0, message: "Slots already exist for this day" };
  }

  if (slotsToCreate.length === 0) {
    return { count: 0, message: "No slots could be generated for the given duration and hours" };
  }

  return prisma.timeSlot.createMany({
    data: slotsToCreate,
  });
}

/**
 * Hàm tiện ích để tạo nhanh slot cho 7 ngày tới cho 1 sân
 */
export async function generateSlotsForWeek(courtId: string) {
  const results = [];
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + i);
    const res = await generateSlotsForCourt(courtId, targetDate);
    results.push({ date: targetDate.toDateString(), ...res });
  }
  return results;
}

/**
 * Lấy toàn bộ slots của một sân trong khoảng thời gian (Dùng cho Calendar/Schedule)
 */
export async function getSlotsByCourtId(courtId: string, startDate: Date, endDate: Date) {
  return prisma.timeSlot.findMany({
    where: {
      courtId,
      startTime: { gte: startDate },
      endTime: { lte: endDate }
    },
    include: {
      court: {
        select: { name: true, sportType: true }
      }
    },
    orderBy: { startTime: 'asc' }
  });
}

/**
 * Khóa slot tạm thời (LOCKED) khi khách đang trong quá trình đặt sân
 */
export async function holdSlot(slotId: string, userId: string) {
  // 1. Kiểm tra slot có đang AVAILABLE không
  const slot = await prisma.timeSlot.findUnique({
    where: { id: slotId }
  });

  if (!slot || slot.status !== "AVAILABLE") {
    throw new Error("SLOT_NOT_AVAILABLE_FOR_HOLD");
  }

  // 2. Cập nhật trạng thái thành LOCKED
  return prisma.timeSlot.update({
    where: { id: slotId },
    data: {
      status: "LOCKED",
      lockedBy: userId,
      lockedAt: new Date()
    }
  });
}

/**
 * Chủ sân chủ động đóng/mở khung giờ (Lock/Unlock slot)
 */
export async function toggleSlotStatus(slotId: string, ownerId: string, newStatus: "LOCKED" | "AVAILABLE") {
  // 1. Kiểm tra quyền sở hữu sân của slot này
  const slot = await prisma.timeSlot.findFirst({
    where: { id: slotId, court: { club: { ownerId } } }
  });

  if (!slot) throw new Error("SLOT_NOT_FOUND_OR_UNAUTHORIZED");

  // 2. Nếu slot đang có người đặt (BOOKED), không được phép đổi trạng thái trực tiếp
  // Chủ sân phải hủy booking trước nếu muốn đóng sân đột xuất
  if (slot.status === "BOOKED") {
    throw new Error("CANNOT_TOGGLE_BOOKED_SLOT_CANCEL_BOOKING_FIRST");
  }

  return prisma.timeSlot.update({
    where: { id: slotId },
    data: { 
        status: newStatus,
        // Nếu mở lại thì xóa thông tin khóa cũ
        ...(newStatus === "AVAILABLE" ? { lockedBy: null, lockedAt: null } : {})
    }
  });
}
