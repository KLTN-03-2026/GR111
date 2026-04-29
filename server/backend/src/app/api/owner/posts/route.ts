import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middleware/auth.middleware";
import { createPost, getPosts, deletePost, updatePost } from "@/modules/marketing/post.service";
import { successResponse, serverErrorResponse, errorResponse } from "@/lib/response";

function mapPostWriteError(error: unknown): ReturnType<typeof errorResponse> | null {
  const msg = error instanceof Error ? error.message : "";
  if (msg === "TITLE_CONTENT_REQUIRED") return errorResponse("Tiêu đề và nội dung không được để trống.", 422);
  if (msg === "TITLE_TOO_LONG") return errorResponse(`Tiêu đề tối đa 200 ký tự.`, 422);
  if (msg === "CONTENT_TOO_LONG") return errorResponse(`Nội dung vượt quá giới hạn cho phép.`, 422);
  if (msg === "CLUB_NOT_FOUND_OR_UNAUTHORIZED") return errorResponse("Không tìm thấy CLB hoặc không có quyền.", 403);
  return null;
}

/**
 * GET /api/owner/posts?clubId=...&page=&limit=
 * Lấy danh sách bài đăng của CLB cho chủ sân quản lý
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get("clubId");

    if (!clubId) return errorResponse("Thiếu clubId", 400);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limitRaw = parseInt(searchParams.get("limit") || "0", 10) || 0;

    const posts = await getPosts({
      clubId,
      isUser: false,
      ...(limitRaw > 0 ? { page, limit: limitRaw } : {}),
    });
    return successResponse("Lấy danh sách bài đăng thành công", posts);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

/**
 * PATCH /api/owner/posts?id=...
 * Cập nhật bài đăng
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("Thiếu bài đăng ID", 400);

    const body = await req.json();
    const { type, title, content, imageUrl, linkedCourtId, linkedDate, expiresAt } = body;

    const updated = await updatePost(id, user.userId, {
      ...(type !== undefined ? { type } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(linkedCourtId !== undefined ? { linkedCourtId } : {}),
      ...(linkedDate !== undefined ? { linkedDate: linkedDate ? new Date(linkedDate) : null } : {}),
      ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
    });

    return successResponse("Cập nhật bài đăng thành công", updated);
  } catch (error: unknown) {
    const mapped = mapPostWriteError(error);
    if (mapped) return mapped;
    const msg = error instanceof Error ? error.message : "";
    if (msg === "POST_NOT_FOUND_OR_UNAUTHORIZED") return errorResponse("Không tìm thấy bài đăng hoặc không có quyền.", 404);
    return serverErrorResponse(error);
  }
}

/**
 * POST /api/owner/posts
 * Đăng bài tin mới
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const body = await req.json();
    const { clubId, type, title, content, imageUrl, linkedCourtId, linkedDate, expiresAt } = body;

    if (!clubId || !type || !title || !content) {
      return errorResponse("Thiếu thông tin bắt buộc (clubId, type, title, content)", 400);
    }

    const { post, notificationsSent } = await createPost(clubId, user.userId, {
      type,
      title,
      content,
      imageUrl,
      linkedCourtId,
      linkedDate: linkedDate ? new Date(linkedDate) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    return successResponse("Đăng bài thành công", { post, notificationsSent }, 201);
  } catch (error: unknown) {
    const mapped = mapPostWriteError(error);
    if (mapped) return mapped;
    return serverErrorResponse(error);
  }
}

/**
 * DELETE /api/owner/posts?id=...
 * Xóa bài đăng
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("Thiếu bài đăng ID", 400);

    await deletePost(id, user.userId);
    return successResponse("Xóa bài đăng thành công", null);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
