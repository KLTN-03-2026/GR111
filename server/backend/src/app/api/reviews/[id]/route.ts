import { NextRequest } from "next/server";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { updateReview, deleteReview } from "@/modules/review/review.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * PATCH /api/reviews/[id]
 * Cập nhật đánh giá
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const reviewId = params.id;
    const body = await req.json();
    const { rating, comment } = body;

    const review = await updateReview(user.userId, reviewId, {
      rating: rating ? Number(rating) : undefined,
      comment
    });

    return successResponse("Cập nhật đánh giá thành công", review);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REVIEW_NOT_FOUND_OR_NOT_OWNED") {
      return errorResponse("Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa", 404);
    }
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/reviews/[id]
 * Xóa hoặc ẩn đánh giá
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const reviewId = params.id;
    await deleteReview(user.userId, reviewId);

    return successResponse("Xóa đánh giá thành công", null);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REVIEW_NOT_FOUND_OR_NOT_OWNED") {
      return errorResponse("Không tìm thấy đánh giá hoặc bạn không có quyền xóa", 404);
    }
    return serverErrorResponse(error);
  }
}
