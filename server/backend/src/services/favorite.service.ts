import { prisma } from "@/lib/prisma";

/**
 * Toggle (thêm hoặc xóa khỏi yêu thích) một sân
 */
export async function toggleFavorite(userId: string, courtId: string) {
  // 1. Kiểm tra đã yêu thích chưa
  const existing = await prisma.favoriteCourt.findUnique({
    where: {
      userId_courtId: {
        userId,
        courtId
      }
    }
  });

  if (existing) {
    // Nếu có rồi => Xóa
    return prisma.favoriteCourt.delete({
      where: {
        userId_courtId: { userId, courtId }
      }
    });
  }

  // Chưa có => Thêm mới
  return prisma.favoriteCourt.create({
    data: { userId, courtId }
  });
}

/**
 * Lấy danh sách sân yêu thích của User hiện tại
 */
export async function getMyFavorites(userId: string) {
  return prisma.favoriteCourt.findMany({
    where: { userId },
    include: {
      court: {
        include: {
          club: {
            select: { id: true, name: true, address: true, logoUrl: true, city: true, slug: true }
          },
          images: true,
          pricings: { take: 1, where: { isActive: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Kiểm tra một sân có đang được yêu thích hay không
 */
export async function isFavorite(userId: string, courtId: string) {
  const count = await prisma.favoriteCourt.count({
    where: { userId, courtId }
  });
  return count > 0;
}
