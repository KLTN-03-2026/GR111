import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middleware/auth.middleware";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { prisma } from "@/infra/db/prisma";

// GET /api/owner/courts  → Lấy danh sách tất cả các sân của tất cả CLB thuộc Owner hiện tại
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    // Lấy tất cả các CLB của Owner này, sau đó lấy Courts kèm số bảng giá
    const clubs = await prisma.club.findMany({
      where: { ownerId: user.userId },
      include: {
        courts: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            sportType: true,
            status: true,
            _count: {
              select: { pricings: { where: { isActive: true } } }
            }
          }
        }
      }
    });

    // Gom dữ liệu lại dạng phẳng để Frontend dễ dùng cho dropdown
    const allCourts = clubs.flatMap(club => 
      club.courts.map(court => ({
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        status: court.status,
        clubName: club.name,
        pricingCount: court._count.pricings,
      }))
    );

    return successResponse("Lấy danh sách sân thành công", allCourts);

    
  } catch (err) {
    return serverErrorResponse(err);
  }
}
