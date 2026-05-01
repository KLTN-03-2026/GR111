import { NextRequest, NextResponse } from "next/server";
import { togglePostStatus } from "@/modules/admin/admin.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const data = await togglePostStatus(params.id, body.status);

  return NextResponse.json({ data });
}