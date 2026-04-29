import { prisma } from "@/infra/db/prisma";
import { NotificationType, PostType } from "@/generated/prisma";

const OWNER_POST_BODY_MAX = 800;

/**
 * Gửi thông báo in-app tới mọi người chơi đã từng có đặt sân thành công (CONFIRMED/COMPLETED) tại CLB,
 * khi chủ sân đăng bài trên bảng tin.
 */
export async function notifyPlayersAboutOwnerPost(params: {
  clubId: string;
  clubName: string;
  postType: PostType;
  title: string;
  content: string;
}): Promise<{ notified: number }> {
  const notificationType: NotificationType =
    params.postType === "DISCOUNT" ? "PROMOTION" : "NEWS_FEED";

  const title = `${params.clubName}: ${params.title}`;
  let body = params.content.trim();
  if (body.length > OWNER_POST_BODY_MAX) {
    body = `${body.slice(0, OWNER_POST_BODY_MAX)}…`;
  }

  const bookings = await prisma.booking.findMany({
    where: {
      clubId: params.clubId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      deletedAt: null,
    },
    select: { userId: true },
  });

  const userIds = [...new Set(bookings.map((b) => b.userId))];
  if (userIds.length === 0) {
    return { notified: 0 };
  }

  const chunkSize = 200;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const slice = userIds.slice(i, i + chunkSize);
    await prisma.notification.createMany({
      data: slice.map((userId) => ({
        userId,
        type: notificationType,
        title,
        body,
      })),
    });
  }

  return { notified: userIds.length };
}

/**
 * Lấy danh sách thông báo của user hiện tại
 */
export async function getMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit to 50 latest
    include: {
      booking: {
        select: { id: true, bookingCode: true, status: true }
      }
    }
  });
}

/**
 * Đánh dấu một hoặc tất cả thông báo là đã đọc
 */
export async function markAsRead(userId: string, notificationId?: string) {
  if (notificationId) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() }
    });
  }

  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });
}

/**
 * Xóa thông báo
 */
export async function deleteNotification(userId: string, notificationId: string) {
  return prisma.notification.delete({
    where: { id: notificationId, userId }
  });
}

/**
 * Tạo thông báo (Hàm nội bộ cho các service khác gọi)
 */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      bookingId: data.bookingId
    }
  });
}

/**
 * Lấy số lượng thông báo chưa đọc
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false }
  });
}
