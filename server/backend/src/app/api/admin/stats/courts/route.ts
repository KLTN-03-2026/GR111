import { NextRequest, NextResponse } from "next/server";
import { getCourtStatsAdmin } from "@/modules/admin/admin.service";
import { successResponse, serverErrorResponse } from "@/lib/response";

interface CourtStats {
  total: number;
  active: number;
  suspended: number;
}

export async function GET(_: NextRequest): Promise<NextResponse> {
  try {
    const stats: CourtStats = await getCourtStatsAdmin();

    return successResponse("Lấy thống kê sân thành công", stats);
  } catch (error: unknown) {
    console.error("GET Court Stats Error:", error);
    return serverErrorResponse(error);
  }
}