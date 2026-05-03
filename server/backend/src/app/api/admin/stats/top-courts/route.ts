import { NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";

interface TopCourt {
  courtId: string;
  courtName: string;
  totalBookings: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const grouped = await prisma.booking.groupBy({
      by: ["courtId"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" }
      },
      take: 5
    });

    const result: TopCourt[] = await Promise.all(
      grouped.map(async (item) => {
        const court = await prisma.court.findUnique({
          where: { id: item.courtId! }
        });

        return {
          courtId: item.courtId!,
          courtName: court?.name || "Unknown",
          totalBookings: item._count.id
        };
      })
    );

    return NextResponse.json({
      message: "Top courts",
      data: result
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}