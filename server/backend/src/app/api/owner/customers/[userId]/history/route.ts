import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middlewares/auth.middleware";
import { getCustomerBookingHistory } from "@/services/club-customer.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * GET /api/owner/customers/[userId]/history?clubId=...
 * Lấy lịch sử đặt sân chi tiết của một khách hàng tại CLB
 */
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");

    if (!clubId) return errorResponse("Thiếu clubId", 400);

    const history = await getCustomerBookingHistory(clubId, params.userId, user.userId);
    return successResponse("Lấy lịch sử khách hàng thành công", history);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
