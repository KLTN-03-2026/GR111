import { NextRequest, NextResponse } from "next/server";
import { getAllReportsAdmin } from "@/modules/admin/admin.service";
import { successResponse, serverErrorResponse } from "@/lib/response";

interface ReportItem {
  id: string;
  reason: string;
  status: string;
  createdAt: Date;
  reporter: {
    fullName: string;
    email: string;
  };
}

export async function GET(_: NextRequest): Promise<NextResponse> {
  try {
    const reports: ReportItem[] = await getAllReportsAdmin();

    return successResponse(
      "Lấy danh sách báo cáo thành công",
      reports
    );
  } catch (error: unknown) {
    console.error("GET Reports Error:", error);
    return serverErrorResponse(error);
  }
}