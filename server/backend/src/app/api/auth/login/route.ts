import { NextRequest } from "next/server";
import { loginSchema } from "@/validations/auth.schema";
import { loginUser, getMyProfile } from "@/services/auth.service";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Dữ liệu không hợp lệ", 422, parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const result = await loginUser(parsed.data);
    return successResponse("Đăng nhập thành công", result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INVALID_CREDENTIALS") {
        return errorResponse("Email hoặc mật khẩu không đúng", 401);
      }
      if (error.message === "ACCOUNT_DISABLED") {
        return errorResponse("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.", 403);
      }
    }
    return serverErrorResponse(error);
  }
}

// GET /api/auth/login → lấy thông tin user đang đăng nhập (Me)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const profile = await getMyProfile(user.userId);
    if (!profile) return errorResponse("Không tìm thấy người dùng", 404);

    return successResponse("Lấy thông tin thành công", profile);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
