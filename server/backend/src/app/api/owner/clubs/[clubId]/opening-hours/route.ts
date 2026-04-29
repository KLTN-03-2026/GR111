import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middleware/auth.middleware";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { updateClubOpeningHours } from "@/modules/club/club.service";
import { openingHoursSchema } from "@/validations/club.schema";

/**
 * PUT /api/owner/clubs/[clubId]/opening-hours
 * Cập nhật giờ mở cửa của CLB
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ clubId: string }> }
) {
    try {
        const { clubId } = await params;
        const { user, error } = await getAuthUser(req);
        if (error) return error;

        const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
        if (roleErr) return roleErr;

        const body = await req.json();
        const parsed = openingHoursSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse("Dữ liệu không hợp lệ", 422, parsed.error.flatten().fieldErrors as unknown as Record<string, string[]>);
        }

        const data = await updateClubOpeningHours(clubId, user.userId, parsed.data);
        return successResponse("Cập nhật giờ mở cửa thành công", data);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "CLUB_NOT_FOUND_OR_UNAUTHORIZED") {
            return errorResponse("Không tìm thấy câu lạc bộ hoặc bạn không có quyền", 403);
        }
        return serverErrorResponse(error);
    }
}
