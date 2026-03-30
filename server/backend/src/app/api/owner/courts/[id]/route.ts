import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middlewares/auth.middleware";
import { updateCourt, deleteCourt } from "@/services/court.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * PUT /api/owner/courts/[id]
 * Cập nhật thông tin sân (Owner only)
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const body = await req.json();
    const court = await updateCourt(params.id, user.userId, body);

    return successResponse("Cập nhật thông tin sân thành công", court);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/owner/courts/[id]
 * Xóa sân (Soft delete)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    await deleteCourt(params.id, user.userId);
    return successResponse("Xóa sân thành công (Đã chuyển sang trạng thái INACTIVE)", null);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
