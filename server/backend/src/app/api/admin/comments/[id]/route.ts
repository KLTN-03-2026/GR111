import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";

interface Params {
  params: { id: string };
}

export async function DELETE(
  _: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    await prisma.comment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: "Xóa comment thành công"
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}