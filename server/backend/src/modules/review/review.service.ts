import { prisma } from "@/infra/db/prisma";

/**
 * Tạo đánh giá mới (Chỉ áp dụng cho đơn đã hoàn thành COMPLETED)
 */
export async function createReview(userId: string, data: {
  bookingId: string;
  rating: number;
  comment?: string;
  imageUrls?: string[];
}) {
  // 1. Kiểm tra booking có thuộc user và đã COMPLETED chưa
  const booking = await prisma.booking.findFirst({
    where: { 
      id: data.bookingId, 
      userId,
      status: "COMPLETED"
    },
    include: {
      items: {
        select: { timeSlot: { select: { courtId: true } } }
      }
    }
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND_OR_NOT_COMPLETED");
  }

  // 2. Kiểm tra xem đã review chưa (Unique constraint bookingId)
  const existingReview = await prisma.review.findUnique({
    where: { bookingId: data.bookingId }
  });
  if (existingReview) {
    throw new Error("ALREADY_REVIEWED");
  }

  // Lấy courtId từ item đầu tiên để gắn vào review (nếu có)
  const courtId = booking.items[0]?.timeSlot.courtId;

  // 3. Tạo review trong transaction
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        userId,
        bookingId: data.bookingId,
        courtId,
        clubId: booking.clubId,
        rating: data.rating,
        comment: data.comment,
        images: {
          create: data.imageUrls?.map((url, index) => ({
            url,
            sortOrder: index
          }))
        }
      },
      include: {
        images: true,
        user: {
          select: { fullName: true, avatarUrl: true }
        }
      }
    });

    return review;
  });
}

/**
 * Lấy danh sách đánh giá của một CLB
 */
export async function getReviewsByClubId(clubId: string) {
  return prisma.review.findMany({
    where: { clubId, isVisible: true },
    include: {
      images: true,
      user: {
        select: { fullName: true, avatarUrl: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Lấy danh sách đánh giá của người dùng hiện tại
 */
export async function getUserReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    include: {
      images: true,
      booking: {
        include: {
          club: {
            select: { name: true, slug: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Cập nhật đánh giá
 */
export async function updateReview(userId: string, reviewId: string, data: {
  rating?: number;
  comment?: string;
}) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId }
  });

  if (!review) {
    throw new Error("REVIEW_NOT_FOUND_OR_NOT_OWNED");
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: data.rating,
      comment: data.comment
    },
    include: {
      images: true
    }
  });
}

/**
 * Xóa đánh giá (Ẩn đánh giá)
 */
export async function deleteReview(userId: string, reviewId: string) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId }
  });

  if (!review) {
    throw new Error("REVIEW_NOT_FOUND_OR_NOT_OWNED");
  }

  // Thay vì xóa cứng, ta có thể ẩn nó đi hoặc xóa cứng tùy requirement. 
  // Ở đây ta xóa cứng để đơn giản hoặc update isVisible thành false.
  return prisma.review.update({
    where: { id: reviewId },
    data: { isVisible: false }
  });
}

/**
 * Tính toán điểm đánh giá trung bình cho một CLB
 */
export async function getAverageRating(clubId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { clubId, isVisible: true },
    _avg: {
      rating: true
    },
    _count: {
      id: true
    }
  });

  return {
    averageRating: aggregate._avg.rating ? parseFloat(aggregate._avg.rating.toFixed(1)) : 0,
    totalReviews: aggregate._count.id
  };
}
