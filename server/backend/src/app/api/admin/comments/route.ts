import { NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";

interface CommentItem {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
  };
  post: {
    id: string;
    title: string;
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const comments: CommentItem[] = await prisma.comment.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      message: "Lấy comments thành công",
      data: comments
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}