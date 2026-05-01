import { NextRequest, NextResponse } from "next/server";
import { getRevenueStatsAdmin } from "@/modules/admin/admin.service";
import { successResponse, serverErrorResponse } from "@/lib/response";

interface RevenueStats {
  totalRevenue: number;
  totalBookings: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;

    const stats: RevenueStats = await getRevenueStatsAdmin(
      startDate,
      endDate
    );

    return successResponse("Lấy thống kê doanh thu thành công", stats);
  } catch (error: unknown) {
    console.error("GET Revenue Stats Error:", error);
    return serverErrorResponse(error);
  }
}