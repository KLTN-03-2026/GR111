import { NextRequest } from "next/server";
import { getPosts } from "@/modules/marketing/post.service";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { PostType } from "@/generated/prisma";

/**
 * GET /api/posts
 * Lấy danh sách bài đăng công khai cho người dùng
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as PostType | null;
    const clubId = searchParams.get("clubId") || undefined;

    const posts = await getPosts({
      clubId,
      type: type || undefined,
      isUser: true,
    });

    return successResponse("Lấy danh sách bài đăng thành công", posts);
  } catch (error) {
    console.error("GET Public Posts Error:", error);
    return serverErrorResponse(error);
  }
}
