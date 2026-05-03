import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";

interface Params {
  params: { id: string };
}

export async function GET(
  _: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        club: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Lấy chi tiết post thành công",
      data: post
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}