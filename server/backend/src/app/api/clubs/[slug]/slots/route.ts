import { NextRequest } from "next/server";
import { prisma } from "@/infra/db/prisma";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { getInferredSlotsForCourt } from "@/modules/slot/slot.service";

/**
 * GET /api/clubs/[slug]/slots?date=YYYY-MM-DD
 * Lấy danh sách time slots cho tất cả các sân của một CLB theo ngày
 * Public endpoint — không cần auth (cho trang đặt sân)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!slug) {
      return errorResponse("Thiếu slug câu lạc bộ", 400);
    }
    if (!date) {
      return errorResponse("Thiếu ngày (date=YYYY-MM-DD)", 400);
    }

    // 1. Tìm Club theo slug
    const club = await prisma.club.findUnique({
      where: { slug },
      select: { id: true, slotDuration: true },
    });

    if (!club) {
      return errorResponse("Không tìm thấy câu lạc bộ", 404);
    }

    const targetDate = new Date(`${date}T12:00:00.000+07:00`);

    // 2. Lấy tất cả courts của club kèm pricing cho ngày đó
    const courts = await prisma.court.findMany({
      where: { clubId: club.id, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sportType: true,
        surface: true,
        indoorOutdoor: true,
        sortOrder: true,
        pricings: {
          where: { isActive: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            pricePerHour: true,
            label: true,
          },
        },
        specialPricings: {
          where: { 
            specificDate: targetDate, // So khớp đúng ngày
            isActive: true 
          },
          select: {
            startTime: true,
            endTime: true,
            pricePerHour: true,
            note: true,
          }
        }
      },
      orderBy: { sortOrder: "asc" },
    });

    // 3. Map dữ liệu & Tính toán slots theo cơ chế Hybrid cho từng sân
    const result = await Promise.all(courts.map(async (court) => {
      const calculatedSlots = await getInferredSlotsForCourt(court.id, targetDate);

      const slots = calculatedSlots.map((slot) => {
        const slotDate = new Date(slot.startTime);
        const slotHour = slotDate.getHours();
        const slotDow = slotDate.getDay();

        // ── CHIẾN LƯỢC TÍNH GIÁ ──
        // 1. ƯU TIÊN: Kiểm tra giá Ngày đặc biệt (Holidays) trước
        const specialMatch = court.specialPricings.find((sp) => {
          const spStart = new Date(sp.startTime).getUTCHours();
          const spEnd = new Date(sp.endTime).getUTCHours();
          
          if (spStart === spEnd) return true; // Cả ngày
          if (spStart < spEnd) return slotHour >= spStart && slotHour < spEnd;
          return slotHour >= spStart || slotHour < spEnd; // Xuyên đêm
        });

        // 2. PHỤ: Nếu không có giá đặc biệt, dùng giá Định kỳ (Regular)
        const regularMatch = !specialMatch
          ? court.pricings.find((p) => {
              const pStart = new Date(p.startTime).getUTCHours();
              const pEnd = new Date(p.endTime).getUTCHours();
              const pDow = p.dayOfWeek;

              let isTimeMatch = false;
              if (pStart === pEnd) isTimeMatch = true;
              else if (pStart < pEnd)
                isTimeMatch = slotHour >= pStart && slotHour < pEnd;
              else isTimeMatch = slotHour >= pStart || slotHour < pEnd;

              return isTimeMatch && (pDow === null || pDow === slotDow);
            })
          : undefined;

        const matchedPricing = specialMatch || regularMatch;

        const pricePerHour = matchedPricing ? Number(matchedPricing.pricePerHour) : 0;
        const price = (pricePerHour * club.slotDuration) / 60;

        // Format thời gian thành "HH:mm – HH:mm"
        const startH = slotDate.getHours().toString().padStart(2, "0");
        const startM = slotDate.getMinutes().toString().padStart(2, "0");
        const endDate = new Date(slot.endTime);
        const endH = endDate.getHours().toString().padStart(2, "0");
        const endM = endDate.getMinutes().toString().padStart(2, "0");
        const time = `${startH}:${startM} – ${endH}:${endM}`;

        return {
          id: slot.id,
          time,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price,
          status: slot.status,
          bookingStatus: slot.bookingStatus,
        };
      });

      return {
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        surface: court.surface,
        indoorOutdoor: court.indoorOutdoor,
        slots,
      };
    }));

    return successResponse("Lấy danh sách khung giờ thành công", {
      clubId: club.id,
      slotDuration: club.slotDuration,
      courts: result,
    });
  } catch (error) {
    console.error("GET Slots Error:", error);
    return serverErrorResponse(error);
  }
}

