import { prisma } from "@/infra/db/prisma";
import { ApprovalStatus, CourtStatus, PostStatus } from "@/generated/prisma";
import { notifyNewBooking } from "@/infra/realtime/socket";

/**
 * Lấy danh sách tất cả các câu lạc bộ và sân chi tiết (Dành cho Admin)
 */
export async function getAllClubsAdmin() {
  return prisma.club.findMany({
    include: {
      owner: {
        select: {
          fullName: true,
          phone: true,
          email: true,
        }
      },
      images: {
        select: {
          url: true,
        }
      },
      courts: {
        select: {
          id: true,
          name: true,
          sportType: true,
          status: true,
          capacity: true,
          surface: true,
          images: {
            select: {
              url: true,
            }
          },
          pricings: true,
        }
      },
      _count: {
        select: {
          courts: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    }
  });
}

/**
 * Duyệt hoặc từ chối một câu lạc bộ
 */
export async function updateClubApprovalStatus(clubId: string, status: ApprovalStatus) {
  const updatedClub = await prisma.club.update({
    where: { id: clubId },
    data: {
      approvalStatus: status,
      // Nếu duyệt thì mặc định active luôn
      isActive: status === ApprovalStatus.APPROVED,
    }
  });

  // Notify if the club's approval or status might affect availability
  notifyNewBooking(clubId, {
    club: updatedClub,
    type: `club-approval-${status.toLowerCase()}`
  });

  return updatedClub;
}

/**
 * Khóa hoặc mở khóa một câu lạc bộ (và tất cả sân thuộc nó)
 */
export async function toggleClubActiveStatus(clubId: string, isActive: boolean) {
  return prisma.$transaction(async (tx) => {
    // 1. Cập nhật CLB
    const club = await tx.club.update({
      where: { id: clubId },
      data: { isActive }
    });

    // 2. Cập nhật tất cả sân của CLB đó tương ứng
    await tx.court.updateMany({
      where: { clubId },
      data: {
        status: isActive ? CourtStatus.ACTIVE : CourtStatus.SUSPENDED
      }
    });

    // Notify update
    notifyNewBooking(clubId, {
      club,
      type: `club-toggled-${isActive ? 'active' : 'inactive'}`
    });

    return club;
  });
}

/**
 * Khóa hoặc mở khóa một sân đơn lẻ
 */
export async function toggleCourtStatus(courtId: string, status: CourtStatus) {
  return prisma.court.update({
    where: { id: courtId },
    data: { status }
  });
}

/**
 * Lấy danh sách hồ sơ KYC của Owner đang chờ duyệt
 */
export async function getAllOwnerKYCAdmin() {
  return prisma.ownerProfile.findMany({
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          ownedClubs: {
            select: {
              id: true,
              name: true,
              approvalStatus: true,
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Lấy danh sách tất cả các chủ sở hữu (Owners) và hồ sơ đi kèm
 */
export async function getAllOwnersAdmin() {
  return prisma.ownerProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
          ownedClubs: {
            include: {
              images: { select: { url: true }, take: 1 }
            }
          },
          _count: {
             select: { ownedClubs: true }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Duyệt hoặc từ chối KYC của Owner
 */
export async function updateOwnerKYCStatus(profileId: string, status: ApprovalStatus, note?: string) {
  return prisma.ownerProfile.update({
    where: { id: profileId },
    data: {
      kycStatus: status,
      kycNote: note,
      kycReviewedAt: new Date(),
    }
  });
}

/**
 * Lấy số liệu tổng quan (Counts) cho Admin Sidebar/Dashboard
 */
export async function getAdminSummary(startDate?: string, endDate?: string) {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.setHours(0, 0, 0, 0));
  const end = endDate ? new Date(endDate) : new Date();

  const [pendingClubs, pendingKyc, totalUsers, activeClubs, totalBookings, filteredBookings, filteredRevenue] = await Promise.all([
    prisma.club.count({ where: { approvalStatus: ApprovalStatus.PENDING } }),
    prisma.ownerProfile.count({ where: { kycStatus: ApprovalStatus.PENDING } }),
    prisma.user.count(),
    prisma.club.count({ where: { approvalStatus: ApprovalStatus.APPROVED, isActive: true } }),
    prisma.booking.count(),
    prisma.booking.count({
      where: {
        createdAt: { gte: start, lte: end }
      }
    }),
    prisma.booking.aggregate({
      where: { 
        status: 'CONFIRMED',
        createdAt: { gte: start, lte: end }
      },
      _sum: { finalAmount: true }
    })
  ]);

  return {
    pendingClubs,
    pendingKyc,
    totalUsers,
    activeClubs,
    totalBookings,
    todayBookings: filteredBookings, // Đặt là filteredBookings nếu có filter
    totalRevenue: Number(filteredRevenue._sum.finalAmount || 0),
    violations: 4, 
  };
}

/**
 * Lấy thống kê số lượng đơn đặt sân theo tháng (6 tháng gần nhất)
 */
export async function getMonthlyStatsAdmin() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Group by tháng dùng Raw Query để lấy đúng định dạng trên DB
  const stats = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(date_trunc('month', "createdAt"), 'MM/YYYY') as month,
      COUNT(id)::int as count
    FROM bookings
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY month
    ORDER BY MIN("createdAt") ASC
  `;

  return stats;
}

/**
 * Lấy danh sách tất cả người dùng (Admin)
 */
export async function getAllUsersAdmin() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          ownedClubs: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    }
  });
}

/**
 * Khóa hoặc mở khóa một tài khoản người dùng
 */
export async function toggleUserActiveStatus(userId: string, isActive: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive }
  });
}

/**
 * Lấy tất cả bài đăng (Admin)
 */
export async function getAllPostsAdmin() {
  return prisma.post.findMany({
    include: {
      club: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Ẩn / hiện bài đăng
 */
export async function togglePostStatus(postId: string, status: PostStatus) {
  return prisma.post.update({
    where: { id: postId },
    data: { status }
  });
}

/**
 * Xoá mềm bài đăng
 */
export async function deletePostAdmin(postId: string) {
  return prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date() }
  });
}

/* =====================================================
   ================= REPORT / VIOLATION
===================================================== */

/**
 * Lấy danh sách report (vi phạm)
 */
export async function getAllReportsAdmin() {
  return prisma.report.findMany({
    include: {
      reporter: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Xử lý report
 */
export async function handleReportAdmin(
  reportId: string,
  status: "RESOLVED" | "REJECTED"
) {
  return prisma.report.update({
    where: { id: reportId },
    data: { status }
  });
}

/**
 * Lấy số lượng vi phạm
 */
export async function countViolations() {
  return prisma.report.count({
    where: { status: "PENDING" }
  });
}

/* =====================================================
   ================= ANALYTICS
===================================================== */

/**
 * Thống kê user theo thời gian
 */
interface UserStats {
  total: number;
  active: number;
  newUsers: number;
}
export async function getUserStatsAdmin(
  startDate?: string,
  endDate?: string
): Promise<UserStats> {
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const [total, active, newUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { isActive: true }
    }),
    prisma.user.count({
      where:
        start && end
          ? {
              createdAt: {
                gte: start,
                lte: end
              }
            }
          : undefined
    })
  ]);

  return {
    total,
    active,
    newUsers
  };
}

/**
 * Thống kê doanh thu chi tiết
 */
interface RevenueStats {
  totalRevenue: number;
  totalBookings: number;
}

export async function getRevenueStatsAdmin(
  startDate?: string,
  endDate?: string
): Promise<RevenueStats> {
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const result = await prisma.booking.aggregate({
    where: {
      status: "CONFIRMED",
      ...(start && end
        ? {
            createdAt: {
              gte: start,
              lte: end
            }
          }
        : {})
    },
    _sum: {
      finalAmount: true
    },
    _count: {
      _all: true
    }
  });

  return {
    totalRevenue: Number(result._sum.finalAmount ?? 0),
    totalBookings: result._count._all
  };
}

/**
 * Thống kê sân (usage)
 */
// export async function getCourtStatsAdmin() {
//   return prisma.court.groupBy({
//     by: ["status"],
//     _count: true
//   });
// }
interface CourtStats {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
  maintenance: number;
}

export async function getCourtStatsAdmin(): Promise<CourtStats> {
  const grouped = await prisma.court.groupBy({
    by: ["status"],
    _count: {
      _all: true
    }
  });

  // init mặc định
  const stats: CourtStats = {
    total: 0,
    active: 0,
    suspended: 0,
    inactive: 0,
    maintenance: 0
  };

  for (const item of grouped) {
    const count = item._count._all;

    stats.total += count;

    switch (item.status) {
      case CourtStatus.ACTIVE:
        stats.active = count;
        break;
      case CourtStatus.SUSPENDED:
        stats.suspended = count;
        break;
      case CourtStatus.INACTIVE:
        stats.inactive = count;
        break;
      case CourtStatus.MAINTENANCE:
        stats.maintenance = count;
        break;
    }
  }

  return stats;
}

/**
 * Top sân được đặt nhiều nhất
 */
export async function getTopCourtsAdmin(limit = 5) {
  return prisma.booking.groupBy({
    by: ["courtId"],
    _count: true,
    orderBy: {
      _count: {
        courtId: "desc"
      }
    },
    take: limit
  });
}

/* =====================================================
   ================= TRAFFIC (VISIT)
===================================================== */

/**
 * Thống kê lượt truy cập
 */
interface VisitStats {
  totalVisits: number;
  uniqueUsers: number;
}
export async function getVisitStatsAdmin(
  startDate?: string,
  endDate?: string
): Promise<VisitStats> {
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const whereClause =
    start && end
      ? {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      : {};

  const [totalVisits, uniqueUsers] = await Promise.all([
    prisma.visitLog.count({
      where: whereClause
    }),
    prisma.visitLog.groupBy({
      by: ["userId"],
      where: {
        ...whereClause,
        userId: {
          not: null
        }
      }
    }).then((res) => res.length)
  ]);

  return {
    totalVisits,
    uniqueUsers
  };
}

/**
 * Top route được truy cập
 */
export async function getTopVisitedRoutes(limit = 10) {
  return prisma.visitLog.groupBy({
    by: ["path"],
    _count: true,
    orderBy: {
      _count: {
        path: "desc"
      }
    },
    take: limit
  });
}

/* =====================================================
   ================= SYSTEM / AUDIT
===================================================== */

/**
 * Lấy audit logs
 */
export async function getAuditLogsAdmin(limit = 50) {
  return prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

/**
 * Báo cáo hệ thống cơ bản
 */
export async function getSystemReportAdmin() {
  const [users, bookings, revenue, visits] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({
      _sum: { finalAmount: true }
    }),
    prisma.visitLog.count()
  ]);

  return {
    totalUsers: users,
    totalBookings: bookings,
    totalRevenue: Number(revenue._sum.finalAmount || 0),
    totalVisits: visits
  };
}