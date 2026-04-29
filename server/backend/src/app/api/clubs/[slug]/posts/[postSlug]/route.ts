import { NextRequest } from "next/server";
import { getPostByClubSlug } from "@/modules/marketing/post.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * GET /api/clubs/[slug]/posts/[postSlug]
 * Chi tiết bài đăng theo slug CLB + slug bài (link chia sẻ).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; postSlug: string }> }
) {
  try {
    const { slug, postSlug } = await params;
    if (!slug || !postSlug) return errorResponse("Thiếu slug câu lạc bộ hoặc slug bài đăng", 400);

    const post = await getPostByClubSlug(slug, postSlug);
    if (!post) return errorResponse("Không tìm thấy bài đăng", 404);

    return successResponse("Lấy chi tiết bài đăng thành công", post);
  } catch (error) {
    console.error("GET Club Post By Slug Error:", error);
    return serverErrorResponse(error);
  }
}
