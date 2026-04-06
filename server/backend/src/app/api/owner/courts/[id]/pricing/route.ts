import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middlewares/auth.middleware";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { updateCourtPricing } from "@/modules/club/court.service";
import { courtPricingSchema } from "@/validations/court.schema";

/**
 * PUT /api/owner/courts/[id]/pricing
 * Cập nhật bảng giá cho sân
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { user, error } = await getAuthUser(req);
        if (error) return error;

        const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
        if (roleErr) return roleErr;

        const body = await req.json();
        const parsed = courtPricingSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse("Dữ liệu không hợp lệ", 422, (parsed.error.flatten().fieldErrors as unknown) as Record<string, string[]>);
        }

        const data = await updateCourtPricing(id, user.userId, parsed.data);
        return successResponse("Cập nhật bảng giá thành công", data);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "COURT_NOT_FOUND_OR_UNAUTHORIZED") {
            return errorResponse("Không tìm thấy sân hoặc bạn không có quyền", 403);
        }
        return serverErrorResponse(error);
    }
}
