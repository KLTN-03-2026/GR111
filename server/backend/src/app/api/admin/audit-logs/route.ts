import { NextRequest, NextResponse } from "next/server";
import { getAuditLogsAdmin } from "@/modules/admin/admin.service";
import { successResponse, serverErrorResponse } from "@/lib/response";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;

  user?: {
    id: string;
    fullName: string;
  } | null;
}

export async function GET(_: NextRequest): Promise<NextResponse> {
  try {
    const logs: AuditLogItem[] = await getAuditLogsAdmin();

    return successResponse("Lấy audit logs thành công", logs);
  } catch (error: unknown) {
    console.error("GET Audit Logs Error:", error);
    return serverErrorResponse(error);
  }
}