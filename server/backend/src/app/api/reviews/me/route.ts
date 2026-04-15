import { NextRequest } from "next/server";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { getUserReviews } from "@/modules/review/review.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * GET /api/reviews/me
 * Lấy danh sách đánh giá của tôi
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const reviews = await getUserReviews(user.userId);
    return successResponse("Lấy danh sách đánh giá của bạn thành công", reviews);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
