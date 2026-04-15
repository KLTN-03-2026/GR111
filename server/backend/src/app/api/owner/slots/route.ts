import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middlewares/auth.middleware";
import { getInferredSlotsForCourt } from "@/modules/slot/slot.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/owner/slots?courtId=...&date=...
 * Lấy danh sách khung giờ (ảo + thực tế) cho sân theo ngày
 * Chỉ cho phép chủ sân sở hữu sân đó
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const courtId = searchParams.get("courtId");
    const dateStr  = searchParams.get("date"); // YYYY-MM-DD

    if (!courtId || !dateStr) {
      return errorResponse("Thiếu tham số courtId hoặc date", 400);
    }

    // Kiểm tra quyền sở hữu sân
    const court = await prisma.court.findFirst({
      where: { id: courtId, club: { ownerId: user.userId } },
      select: { id: true, name: true }
    });
    if (!court) return errorResponse("Không có quyền truy cập sân này", 403);

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return errorResponse("Định dạng ngày không hợp lệ (dùng YYYY-MM-DD)", 400);
    }

    const slots = await getInferredSlotsForCourt(courtId, date);
    return successResponse("Lấy khung giờ thành công", slots);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
