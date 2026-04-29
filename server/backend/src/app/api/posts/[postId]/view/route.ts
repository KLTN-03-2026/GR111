import { NextRequest } from "next/server";
import { incrementPostView } from "@/modules/marketing/post.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * POST /api/posts/[postId]/view
 * Tăng lượt xem (không yêu cầu đăng nhập).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    if (!postId) return errorResponse("Thiếu postId", 400);

    const ok = await incrementPostView(postId);
    if (!ok) return errorResponse("Không tìm thấy bài đăng", 404);

    return successResponse("Đã ghi nhận lượt xem", { ok: true });
  } catch (error) {
    console.error("POST Post View Error:", error);
    return serverErrorResponse(error);
  }
}
