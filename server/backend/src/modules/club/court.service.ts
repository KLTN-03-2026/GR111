import { prisma } from "@/infra/db/prisma";
import { CreateCourtInput } from "@/validations/court.schema";

/**
 * Tạo mới một sân (court) thuộc một câu lạc bộ (club)
 */
export async function createCourt(clubId: string, ownerId: string, input: CreateCourtInput) {
  // 1. Kiểm tra quyền sở hữu CLB trước khi thêm sân
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId },
  });

  if (!club) {
    throw new Error("CLUB_NOT_FOUND_OR_UNAUTHORIZED");
  }

  const { images, ...data } = input;

  const court = await prisma.court.create({
    data: {
      ...data,
      clubId,
      images: images ? {
        create: images.map((url: string) => ({ url }))
      } : undefined
    },
    include: {
      pricings: true,
      images: true,
    }
  });

  return court;
}

/**
 * Lấy danh sách sân của một câu lạc bộ
 */
export async function getCourtsByClubId(clubId: string) {
  return prisma.court.findMany({
    where: { 
      clubId,
      deletedAt: null 
    },
    include: {
      pricings: true,
      images: true,
    }
  });
}

/**
 * Cập nhật thông tin sân (Dành cho Owner)
 */
export async function updateCourt(courtId: string, ownerId: string, input: Partial<CreateCourtInput>) {
  // 1. Kiểm tra quyền sở hữu sân thông qua CLB
  const court = await prisma.court.findFirst({
    where: { id: courtId, club: { ownerId } },
  });

  if (!court) throw new Error("COURT_NOT_FOUND_OR_UNAUTHORIZED");

  const { images, ...data } = input;

  return prisma.court.update({
    where: { id: courtId },
    data: {
      ...data,
      images: images ? {
        deleteMany: {},
        create: images.map((url: string) => ({ url }))
      } : undefined
    },
    include: { pricings: true, images: true }
  });
}

/**
 * Xóa sân (Soft Delete - chuyển trạng thái sang INACTIVE)
 */
export async function deleteCourt(courtId: string, ownerId: string) {
  const court = await prisma.court.findFirst({
    where: { id: courtId, club: { ownerId } },
  });

  if (!court) throw new Error("COURT_NOT_FOUND_OR_UNAUTHORIZED");

  // Chuyển sang trạng thái INACTIVE và đặt deletedAt để giữ lại lịch sử booking (Soft Delete)
  return prisma.court.update({
    where: { id: courtId },
    data: { 
      status: "INACTIVE",
      deletedAt: new Date()
    }
  });
}

/**
 * Cập nhật bảng giá cho sân
 */
export async function updateCourtPricing(courtId: string, ownerId: string, pricings: { dayOfWeek?: number, startTime: string, endTime: string, pricePerHour: number }[]) {
  const court = await prisma.court.findFirst({
    where: { id: courtId, club: { ownerId } },
  });
  if (!court) throw new Error("COURT_NOT_FOUND_OR_UNAUTHORIZED");

  return prisma.$transaction(async (tx) => {
    // 1. CLEAR old ones
    await tx.courtPricing.deleteMany({ where: { courtId } });

    // 2. CREATE new ones
    if (pricings.length > 0) {
      const toTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const d = new Date();
        d.setUTCHours(h, m, 0, 0);
        return d;
      };

      await tx.courtPricing.createMany({
        data: pricings.map((p: { dayOfWeek?: number; startTime: string; endTime: string; pricePerHour: number }) => ({
          courtId,
          dayOfWeek: p.dayOfWeek,
          startTime: toTime(p.startTime),
          endTime: toTime(p.endTime),
          pricePerHour: p.pricePerHour
        }))
      });
    }

    return tx.courtPricing.findMany({ where: { courtId } });
  });
}

/**
 * Lấy tất cả bảng giá (định kỳ & đặc biệt) của một sân
 */
export async function getCourtPricings(courtId: string, ownerId: string) {
  const court = await prisma.court.findFirst({
    where: { 
      id: courtId, 
      club: { ownerId },
      deletedAt: null
    },
    include: {
      pricings: true,
      specialPricings: true,
    }
  });

  if (!court) throw new Error("COURT_NOT_FOUND_OR_UNAUTHORIZED");

  return {
    regularPricings: court.pricings,
    specialPricings: court.specialPricings,
  };
}

/**
 * Helper: Chuyển đổi chuỗi HH:mm hoặc Date thành số phút kể từ 00:00
 */
function getMinutesFromTime(t: string | Date): number {
  if (typeof t === "string") {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  return t.getUTCHours() * 60 + t.getUTCMinutes();
}

/**
 * Kiểm tra xem hai khoảng thời gian có bị chồng lấn (overlap) hay không
 */
function isOverlapping(s1: number, e1: number, s2: number, e2: number): boolean {
  // Đơn giản hóa: Hiện tại hệ thống chưa khuyến khích cấu hình xuyên đêm trong 1 bản ghi
  // Nếu cần xuyên đêm, chủ sân nên tách thành 2 bản ghi: 22:00-23:59 và 00:00-02:00
  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Thêm hoặc Cập nhật giá định kỳ với Logic Validation chống trùng lặp
 */
export async function addRegularPricing(courtId: string, ownerId: string, data: { id?: string, dayOfWeek: number | null, startTime: string, endTime: string, pricePerHour: number, label?: string }) {
  const court = await prisma.court.findFirst({
    where: { id: courtId, club: { ownerId } },
  });
  if (!court) throw new Error("COURT_NOT_FOUND_OR_UNAUTHORIZED");

  const newStart = getMinutesFromTime(data.startTime);
  const newEnd = getMinutesFromTime(data.endTime);

  if (newStart >= newEnd) throw new Error("INVALID_TIME_RANGE: Giờ kết thúc phải lớn hơn giờ bắt đầu");

  // 1. Kiểm tra trùng lặp, bỏ qua bản ghi hiện tại nếu là Update
  const existing = await prisma.courtPricing.findMany({
    where: { 
      courtId,
      id: data.id ? { not: data.id } : undefined, // Loại trừ chính nó nếu đang sửa
      OR: [
        { dayOfWeek: data.dayOfWeek },
        { dayOfWeek: null } 
      ]
    }
  });

  for (const p of existing) {
    const exStart = getMinutesFromTime(p.startTime);
    const exEnd = getMinutesFromTime(p.endTime);
    if (isOverlapping(newStart, newEnd, exStart, exEnd)) {
      throw new Error(`OVERLAP_PRICING: Trùng với [${p.label || 'Bảng giá hiện tại'}] (${exStart/60}h-${exEnd/60}h)`);
    }
  }

  const toTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const d = new Date();
    d.setUTCHours(h, m, 0, 0);
    return d;
  };

  if (data.id) {
    return prisma.courtPricing.update({
      where: { id: data.id },
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: toTime(data.startTime),
        endTime: toTime(data.endTime),
        pricePerHour: data.pricePerHour,
        label: data.label
      }
    });
  }

  return prisma.courtPricing.create({
    data: {
      courtId,
      dayOfWeek: data.dayOfWeek,
      startTime: toTime(data.startTime),
      endTime: toTime(data.endTime),
      pricePerHour: data.pricePerHour,
      label: data.label
    }
  });
}

/**
 * Thêm hoặc Cập nhật giá ngày đặc biệt với Logic Validation
 */
export async function upsertSpecialPricing(courtId: string, ownerId: string, data: { id?: string, specificDate: string, startTime: string, endTime: string, pricePerHour: number, note?: string }) {
  const court = await prisma.court.findFirst({
    where: { id: courtId, club: { ownerId } },
  });
  if (!court) throw new Error("COURT_NOT_FOUND_OR_UNAUTHORIZED");

  const targetDate = new Date(data.specificDate);
  targetDate.setUTCHours(0,0,0,0);

  const newStart = getMinutesFromTime(data.startTime);
  const newEnd = getMinutesFromTime(data.endTime);

  if (newStart >= newEnd) throw new Error("INVALID_TIME_RANGE");

  // 1. Kiểm tra trùng lặp, bỏ qua bản ghi hiện tại
  const existing = await prisma.specialDatePricing.findMany({
    where: { 
      courtId,
      id: data.id ? { not: data.id } : undefined,
      specificDate: targetDate
    }
  });

  for (const p of existing) {
    const exStart = getMinutesFromTime(p.startTime);
    const exEnd = getMinutesFromTime(p.endTime);
    if (isOverlapping(newStart, newEnd, exStart, exEnd)) {
      throw new Error(`OVERLAP_SPECIAL_PRICING: Trùng với khung giờ (${exStart/60}h-${exEnd/60}h) của ngày này`);
    }
  }

  const toTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const d = new Date();
    d.setUTCHours(h, m, 0, 0);
    return d;
  };

  if (data.id) {
    return prisma.specialDatePricing.update({
      where: { id: data.id },
      data: {
        startTime: toTime(data.startTime),
        endTime: toTime(data.endTime),
        pricePerHour: data.pricePerHour,
        note: data.note
      }
    });
  }

  return prisma.specialDatePricing.create({
    data: {
      courtId,
      specificDate: targetDate,
      startTime: toTime(data.startTime),
      endTime: toTime(data.endTime),
      pricePerHour: data.pricePerHour,
      note: data.note
    }
  });
}

/**
 * Xóa một cấu hình giá
 */
export async function deletePricing(type: 'regular' | 'special', pricingId: string, ownerId: string) {
  if (type === 'regular') {
    const pricing = await prisma.courtPricing.findFirst({
      where: { id: pricingId, court: { club: { ownerId } } }
    });
    if (!pricing) throw new Error("PRICING_NOT_FOUND_OR_UNAUTHORIZED");

    return prisma.courtPricing.delete({ where: { id: pricingId } });
  } else {
    const pricing = await prisma.specialDatePricing.findFirst({
      where: { id: pricingId, court: { club: { ownerId } } }
    });
    if (!pricing) throw new Error("PRICING_NOT_FOUND_OR_UNAUTHORIZED");

    return prisma.specialDatePricing.delete({ where: { id: pricingId } });
  }
}
