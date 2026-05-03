import { NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";

interface TopUser {
  userId: string;
  email: string;
  totalBookings: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const grouped = await prisma.booking.groupBy({
      by: ["userId"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" }
      },
      take: 5
    });

    const result: TopUser[] = await Promise.all(
      grouped.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId }
        });

        return {
          userId: item.userId,
          email: user?.email || "Unknown",
          totalBookings: item._count.id
        };
      })
    );

    return NextResponse.json({
      message: "Top users",
      data: result
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}