import { NextRequest } from "next/server";
import { getInferredSlotsForCourt } from "@/modules/slot/slot.service";
import { getAuthUser, requireRole } from "@/middleware/auth.middleware";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { prisma } from "@/infra/db/prisma";

/**
 * GET /api/owner/clubs/[clubId]/slots
 * Lấy danh sách slots (bao gồm ảo và thực) cho tất cả sân của câu lạc bộ vào một ngày
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ clubId: string }> }
) {
    try {
        const { clubId } = await params;
        const { user, error } = await getAuthUser(req);
        if (error) return error;

        const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
        if (roleErr) return roleErr;

        // Kiểm tra quyền sở hữu
        const club = await prisma.club.findFirst({
            where: { id: clubId, ownerId: user.userId }
        });
        if (!club) throw new Error("UNAUTHORIZED");

        // Lấy query params
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get("date") || new Date().toISOString().split('T')[0];
        const date = new Date(dateStr);

        const courts = await prisma.court.findMany({
            where: { clubId, status: "ACTIVE" }
        });

        const allSlots = await Promise.all(courts.map(async (court) => {
            const slots = await getInferredSlotsForCourt(court.id, date);
            return {
                courtId: court.id,
                courtName: court.name,
                slots
            };
        }));

        return successResponse("Lấy danh sách slots thành công", allSlots);
    } catch (error: unknown) {
        return serverErrorResponse(error);
    }
}
