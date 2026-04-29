import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middleware/auth.middleware";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { prisma } from "@/infra/db/prisma";
import { replaceVoucherApplicableCourts } from "@/modules/marketing/voucher-courts";

/**
 * PATCH /api/owner/clubs/[clubId]/vouchers/[voucherId]
 * Cập nhật thông tin voucher
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string; voucherId: string }> }
) {
  try {
    const { clubId, voucherId } = await params;
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
    if (roleErr) return roleErr;

    // Xác minh chủ sở hữu
    const club = await prisma.club.findFirst({
      where: { id: clubId, ownerId: user.userId },
    });
    if (!club) return errorResponse("Không tìm thấy câu lạc bộ hoặc bạn không có quyền", 403);

    // Xác minh voucher thuộc club này
    const existing = await prisma.voucher.findFirst({
      where: { id: voucherId, clubId, deletedAt: null },
    });
    if (!existing) return errorResponse("Không tìm thấy voucher", 404);

    const body = await req.json();
    const { title, description, type, value, minOrderAmount, maxDiscount, usageLimit, usagePerUser, startDate, endDate, isActive, courtIds } = body;

    const voucher = await prisma.voucher.update({
      where: { id: voucherId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value: Number(value) }),
        ...(minOrderAmount !== undefined && { minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null }),
        ...(maxDiscount !== undefined && { maxDiscount: maxDiscount ? Number(maxDiscount) : null }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit ? Number(usageLimit) : null }),
        ...(usagePerUser !== undefined && { usagePerUser: Number(usagePerUser) }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    if (courtIds !== undefined) {
      try {
        const ids = Array.isArray(courtIds) ? courtIds.filter((x: unknown) => typeof x === "string") : [];
        await replaceVoucherApplicableCourts(voucher.id, clubId, ids);
      } catch {
        return errorResponse("Danh sách sân không hợp lệ hoặc không thuộc CLB này", 422);
      }
    }

    const full = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: {
        applicableCourts: {
          include: { court: { select: { id: true, name: true } } },
        },
      },
    });

    return successResponse("Cập nhật voucher thành công", full);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/owner/clubs/[clubId]/vouchers/[voucherId]
 * Xóa mềm voucher
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string; voucherId: string }> }
) {
  try {
    const { clubId, voucherId } = await params;
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
    if (roleErr) return roleErr;

    // Xác minh chủ sở hữu
    const club = await prisma.club.findFirst({
      where: { id: clubId, ownerId: user.userId },
    });
    if (!club) return errorResponse("Không tìm thấy câu lạc bộ hoặc bạn không có quyền", 403);

    // Xác minh voucher thuộc club này
    const existing = await prisma.voucher.findFirst({
      where: { id: voucherId, clubId, deletedAt: null },
    });
    if (!existing) return errorResponse("Không tìm thấy voucher", 404);

    await prisma.voucher.update({
      where: { id: voucherId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return successResponse("Xóa voucher thành công", null);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
