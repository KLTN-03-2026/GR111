import { NextRequest } from "next/server";
import { getPostById } from "@/modules/marketing/post.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * GET /api/posts/[postId]
 * Chi tiết bài đăng công khai (chia sẻ theo id).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    if (!postId) return errorResponse("Thiếu postId", 400);

    const post = await getPostById(postId);
    if (!post) return errorResponse("Không tìm thấy bài đăng", 404);

    return successResponse("Lấy chi tiết bài đăng thành công", post);
  } catch (error) {
    console.error("GET Post Error:", error);
    return serverErrorResponse(error);
  }
}
