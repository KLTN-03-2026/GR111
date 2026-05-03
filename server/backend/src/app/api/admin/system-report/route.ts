import { NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";

interface SystemReport {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeClubs: number;
  inactiveClubs: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const [
      totalUsers,
      totalBookings,
      revenue,
      activeClubs,
      inactiveClubs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { finalAmount: true }
      }),
      prisma.club.count({ where: { isActive: true } }),
      prisma.club.count({ where: { isActive: false } })
    ]);

    const report: SystemReport = {
      totalUsers,
      totalBookings,
      totalRevenue: Number(revenue._sum.finalAmount || 0),
      activeClubs,
      inactiveClubs
    };

    return NextResponse.json({
      message: "System report",
      data: report
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}