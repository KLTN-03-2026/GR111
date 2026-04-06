import { prisma } from "@/lib/prisma";
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
        create: images.map(url => ({ url }))
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
    where: { clubId },
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
        create: images.map(url => ({ url }))
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

  // Chuyển sang trạng thái INACTIVE để giữ lại lịch sử booking (Soft Delete)
  return prisma.court.update({
    where: { id: courtId },
    data: { status: "INACTIVE" }
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
        data: pricings.map(p => ({
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
