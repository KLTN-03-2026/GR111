import { NextRequest } from "next/server";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { getMyFavorites, toggleFavorite } from "@/services/favorite.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * GET /api/favorites
 * Lấy danh sách sân yêu thích của User hiện tại
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const favorites = await getMyFavorites(user.userId);
    return successResponse("Lấy danh sách yêu thích thành công", favorites);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * POST /api/favorites
 * Thêm hoặc xóa một sân khỏi danh sách yêu thích
 * body: { courtId: "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const body = await req.json();
    const courtId = body.courtId;

    if (!courtId) {
      return errorResponse("Thiếu courtId", 400);
    }

    const favorite = await toggleFavorite(user.userId, courtId);
    return successResponse("Cập nhật danh sách yêu thích thành công", favorite);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
