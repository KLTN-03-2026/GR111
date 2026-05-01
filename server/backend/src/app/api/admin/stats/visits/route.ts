import { NextRequest, NextResponse } from "next/server";
import { getVisitStatsAdmin } from "@/modules/admin/admin.service";
import { successResponse, serverErrorResponse } from "@/lib/response";

interface VisitStats {
  totalVisits: number;
  uniqueUsers: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const stats: VisitStats = await getVisitStatsAdmin(
      startDate,
      endDate
    );

    return successResponse("Lấy thống kê truy cập thành công", stats);
  } catch (error: unknown) {
    console.error("GET Visit Stats Error:", error);
    return serverErrorResponse(error);
  }
}