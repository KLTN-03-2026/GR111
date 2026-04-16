import { NextRequest } from "next/server";
import { getAverageRating } from "@/modules/review/review.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * GET /api/reviews/stats?clubId=...
 * Lấy thống kê đánh giá của một CLB
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");

    if (!clubId) {
      return errorResponse("Thiếu clubId", 400);
    }

    const stats = await getAverageRating(clubId);
    return successResponse("Lấy thống kê đánh giá thành công", stats);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
