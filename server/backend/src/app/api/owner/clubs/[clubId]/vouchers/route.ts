import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middlewares/auth.middleware";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/owner/clubs/[clubId]/vouchers
 * Lấy danh sách voucher của câu lạc bộ (dành cho chủ sân)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
    if (roleErr) return roleErr;

    // Xác minh chủ sở hữu
    const club = await prisma.club.findFirst({
      where: { id: clubId, ownerId: user.userId },
    });
    if (!club) return errorResponse("Không tìm thấy câu lạc bộ hoặc bạn không có quyền", 403);

    const vouchers = await prisma.voucher.findMany({
      where: { clubId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return successResponse("Lấy danh sách voucher thành công", vouchers);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * POST /api/owner/clubs/[clubId]/vouchers
 * Tạo mã giảm giá mới cho câu lạc bộ
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
    if (roleErr) return roleErr;

    // Xác minh chủ sở hữu
    const club = await prisma.club.findFirst({
      where: { id: clubId, ownerId: user.userId },
    });
    if (!club) return errorResponse("Không tìm thấy câu lạc bộ hoặc bạn không có quyền", 403);

    const body = await req.json();
    const { code, title, description, type, value, minOrderAmount, maxDiscount, usageLimit, usagePerUser, startDate, endDate } = body;

    if (!code || !title || !type || !value || !startDate || !endDate) {
      return errorResponse("Thiếu thông tin bắt buộc", 422);
    }

    // Kiểm tra mã đã tồn tại chưa
    const existing = await prisma.voucher.findFirst({ where: { code: code.toUpperCase() } });
    if (existing) return errorResponse("Mã voucher đã tồn tại", 409);

    const voucher = await prisma.voucher.create({
      data: {
        clubId,
        code: code.toUpperCase(),
        title,
        description: description || null,
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        usagePerUser: usagePerUser ? Number(usagePerUser) : 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
    });

    return successResponse("Tạo voucher thành công", voucher, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
