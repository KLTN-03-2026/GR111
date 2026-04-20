import { prisma } from "@/infra/db/prisma";
import { CustomerTier, Prisma } from "@/generated/prisma";

/**
 * Cập nhật hoặc tạo mới thông tin khách hàng thân thiết của một CLB
 * Được gọi khi một booking hoàn tất (COMPLETED) hoặc được thanh toán thành công
 */
export async function updateClubCustomerStats(clubId: string, userId: string, amount: number) {
  if (!clubId || !userId) {
    console.error("Missing clubId or userId in updateClubCustomerStats");
    return;
  }

  const spendAmount = new Prisma.Decimal(amount || 0);

  try {
    return await prisma.clubCustomer.upsert({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      update: {
        totalBookings: { increment: 1 },
        totalSpent: { increment: spendAmount },
        updatedAt: new Date(),
      },
      create: {
        clubId,
        userId,
        totalBookings: 1,
        totalSpent: spendAmount,
        tier: "NORMAL",
      },
    });
  } catch (error) {
    console.error("Error in updateClubCustomerStats:", error);
    // Don't throw here to avoid failing the whole booking if just stats fail
    // But we want to know why it fails
  }
}

/**
 * Lấy danh sách khách hàng của một CLB (Dành cho Owner)
 */
export async function getClubCustomers(clubId: string, ownerId: string) {
  // Kiểm tra quyền sở hữu CLB
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId },
  });
  if (!club) throw new Error("CLUB_NOT_FOUND_OR_UNAUTHORIZED");

  return prisma.clubCustomer.findMany({
    where: { clubId },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      club: {
        select: { name: true },
      },
    },
    orderBy: { totalSpent: "desc" },
  });
}

/**
 * Cập nhật hạng thành viên hoặc ghi chú cho khách hàng
 */
export async function updateCustomerTier(
  clubId: string,
  userId: string,
  ownerId: string,
  data: { tier?: CustomerTier; notes?: string }
) {
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId },
  });
  if (!club) throw new Error("CLUB_NOT_FOUND_OR_UNAUTHORIZED");

  return prisma.clubCustomer.update({
    where: {
      clubId_userId: { clubId, userId },
    },
    data,
  });
}

/**
 * Lấy lịch sử đặt sân chi tiết của một khách hàng tại CLB của chủ sân
 */
export async function getCustomerBookingHistory(clubId: string, userId: string, ownerId: string) {
  // 1. Kiểm tra quyền truy cập CLB
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId },
  });
  if (!club) throw new Error("CLUB_NOT_FOUND_OR_UNAUTHORIZED");

  // 2. Truy vấn danh sách booking của khách này tại CLB
  return prisma.booking.findMany({
    where: {
      clubId,
      userId
    },
    include: {
      items: {
        include: {
          timeSlot: {
            include: { court: { select: { name: true } } }
          }
        }
      },
      payment: true,
      review: true
    },
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Thêm khách hàng vào CLB bằng số điện thoại
 * Tìm user theo SĐT → nếu chưa có trong CLB → tạo record ClubCustomer
 */
export async function addCustomerByPhone(clubId: string, phone: string, ownerId: string) {
  // 1. Xác nhận quyền sở hữu CLB
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId, deletedAt: null },
  });
  if (!club) throw new Error("CLUB_NOT_FOUND_OR_UNAUTHORIZED");

  // 2. Tìm user theo SĐT
  const user = await prisma.user.findFirst({
    where: { phone },
    select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  // 3. Kiểm tra đã là khách của CLB chưa
  const existing = await prisma.clubCustomer.findUnique({
    where: { clubId_userId: { clubId, userId: user.id } },
  });
  if (existing) throw new Error("CUSTOMER_ALREADY_EXISTS");

  // 4. Tạo liên kết ClubCustomer mới
  const newCustomer = await prisma.clubCustomer.create({
    data: {
      clubId,
      userId: user.id,
      tier: "NORMAL",
      totalBookings: 0,
      totalSpent: 0,
    },
    include: {
      user: {
        select: { fullName: true, email: true, phone: true, avatarUrl: true },
      },
    },
  });

  return newCustomer;
}

/**
 * Xóa liên kết ClubCustomer (xóa khỏi danh sách khách của CLB)
 * Không xóa tài khoản user thật trên hệ thống
 */
export async function removeClubCustomer(clubId: string, userId: string, ownerId: string) {
  // Xác nhận quyền sở hữu CLB
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId, deletedAt: null },
  });
  if (!club) throw new Error("CLUB_NOT_FOUND_OR_UNAUTHORIZED");

  // Kiểm tra record tồn tại
  const customer = await prisma.clubCustomer.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

  return prisma.clubCustomer.delete({
    where: { clubId_userId: { clubId, userId } },
  });
}
