import { z } from "zod";

export const SPORT_LABEL: Record<string, string> = {
  FOOTBALL: "Bóng đá",
  BADMINTON: "Cầu lông",
  TENNIS: "Tennis",
  PICKLEBALL: "Pickleball",
  BASKETBALL: "Bóng rổ",
  VOLLEYBALL: "Bóng chuyền",
};

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function vnDayToUTC(date: string) {
  return {
    gte: new Date(`${date}T00:00:00+07:00`),
    lte: new Date(`${date}T23:59:59+07:00`),
  };
}

export function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function toISO(d: Date | string) {
  return new Date(d).toISOString();
}

export function toVnDateTime(date: string, timeHHmm: string) {
  return new Date(`${date}T${timeHHmm}:00+07:00`);
}

export function getVnHour(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "00";
  return Number(hourPart);
}

export type PrismaLike = {
  club: {
    findMany: (args: unknown) => Promise<any[]>;
    findFirst: (args: unknown) => Promise<any | null>;
  };
  review: {
    groupBy: (args: unknown) => Promise<any[]>;
  };
  timeSlot: {
    findMany: (args: unknown) => Promise<any[]>;
    groupBy: (args: unknown) => Promise<any[]>;
  };
  booking: {
    findMany: (args: unknown) => Promise<any[]>;
  };
  user: {
    findUnique: (args: unknown) => Promise<any | null>;
  };
  booking: {
    findMany: (args: unknown) => Promise<any[]>;
  };
};

export type CreatePaymentUrlFn = (
  bookingId: string,
  amount: number,
  method: string,
  ipAddr?: string
) => Promise<string | null>;

export type CreateBookingFn = (userId: string, input: unknown) => Promise<any>;

export type ChatToolsDeps = {
  prisma: PrismaLike;
  userId: string | null;
  defaultLat: number | null;
  defaultLng: number | null;
  getIpAddr: () => string;
  createBooking: CreateBookingFn;
  createPaymentUrl: CreatePaymentUrlFn;
};

export function buildChatbotTools(deps: ChatToolsDeps) {
  const { prisma, userId, defaultLat, defaultLng, getIpAddr, createBooking, createPaymentUrl } = deps;

  const searchClubs = {
    description:
      "Tìm câu lạc bộ/sân theo môn, tên, khu vực. Có thể xếp hạng theo khoảng cách, rating, số slot trống, hoặc giá.",
    parameters: z.object({
      name: z.string().optional(),
      sport: z.enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL"]).optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      maxPrice: z.number().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      radiusKm: z.number().optional().default(20),
      date: z.string().optional(),
      sortBy: z.enum(["NEAREST", "RATING_DESC", "MOST_AVAILABLE", "PRICE_ASC", "PRICE_DESC"]).optional(),
      limit: z.number().optional().default(5),
    }),
    execute: async (input: any) => {
      const {
        name, sport, city, district, maxPrice, lat, lng, radiusKm, date, sortBy, limit,
      } = input ?? {};
      const userLat = lat ?? defaultLat;
      const userLng = lng ?? defaultLng;

      const clubs = await prisma.club.findMany({
        where: {
          isActive: true,
          approvalStatus: "APPROVED",
          deletedAt: null,
          ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
          ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
          ...(district ? { district: { contains: district, mode: "insensitive" } } : {}),
          ...((sport || maxPrice)
            ? {
              courts: {
                some: {
                  deletedAt: null,
                  ...(sport ? { sportType: sport } : {}),
                  ...(maxPrice
                    ? { pricings: { some: { isActive: true, pricePerHour: { lte: maxPrice } } } }
                    : {}),
                },
              },
            }
            : {}),
        },
        include: {
          openingHours: true,
          courts: {
            where: { deletedAt: null },
            include: { pricings: { where: { isActive: true } } },
          },
          images: { take: 1, orderBy: { createdAt: "asc" } },
        },
        take: Math.max(limit ?? 5, 20),
      });

      if (!clubs.length) return { found: false, clubs: [] };

      const clubIds = clubs.map((c) => c.id);
      const ratingRows = await prisma.review.groupBy({
        by: ["clubId"],
        where: { isVisible: true, clubId: { in: clubIds } },
        _avg: { rating: true },
        _count: { _all: true },
      });
      const ratingMap = new Map<string, { avg: number | null; count: number }>();
      for (const r of ratingRows) {
        ratingMap.set(r.clubId ?? "", { avg: r._avg.rating ?? null, count: r._count._all ?? 0 });
      }

      let availabilityMap = new Map<string, number>();
      if (date) {
        const { gte, lte } = vnDayToUTC(date);
        const availabilityRows = await prisma.timeSlot.groupBy({
          by: ["courtId"],
          where: {
            status: "AVAILABLE",
            startTime: { gte, lte },
            court: {
              clubId: { in: clubIds },
              status: "ACTIVE",
              deletedAt: null,
              ...(sport ? { sportType: sport } : {}),
            },
          },
          _count: { _all: true },
        });
        const courtToClub = new Map<string, string>();
        for (const c of clubs) for (const ct of c.courts) courtToClub.set(ct.id, c.id);
        for (const row of availabilityRows) {
          const cid = courtToClub.get(row.courtId);
          if (!cid) continue;
          availabilityMap.set(cid, (availabilityMap.get(cid) ?? 0) + (row._count._all ?? 0));
        }
      }

      const currentDay = new Date().getDay();
      const processed = clubs.map((c) => {
        const prices = c.courts.flatMap((ct: any) => ct.pricings.map((px: any) => Number(px.pricePerHour)));
        const todayH = c.openingHours.find((h: any) => h.dayOfWeek === currentDay) || c.openingHours[0];
        const sports = [...new Set(c.courts.map((ct: any) => ct.sportType as string))].map((s) => ({
          key: s,
          label: SPORT_LABEL[s] ?? s,
        }));

        const dist =
          userLat != null && userLng != null && c.latitude != null && c.longitude != null
            ? Number(haversineKm(userLat, userLng, c.latitude, c.longitude).toFixed(2))
            : null;

        const r = ratingMap.get(c.id);
        const avgRating = r?.avg != null ? Number(r.avg.toFixed(1)) : null;
        const reviewCount = r?.count ?? 0;
        const availableSlotCount = availabilityMap.get(c.id) ?? null;

        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          address: `${c.address}, ${c.district}, ${c.city}`,
          phone: c.phone ?? null,
          rating: avgRating,
          reviewCount,
          distanceKm: dist,
          imageUrl: c.images?.[0]?.url ?? null,
          sports,
          totalCourts: c.courts.length,
          minPrice: prices.length ? Math.min(...prices) : null,
          maxPrice: prices.length ? Math.max(...prices) : null,
          openTime: todayH ? formatTime(todayH.openTime) : null,
          closeTime: todayH ? formatTime(todayH.closeTime) : null,
          availableSlotCount,
        };
      });

      const withinRadius = processed.filter((c) => {
        if (userLat == null || userLng == null) return true;
        if (radiusKm == null) return true;
        if (c.distanceKm == null) return true;
        return c.distanceKm <= radiusKm;
      });

      const effectiveSort = sortBy ?? (userLat != null && userLng != null ? "NEAREST" : undefined);
      const sorted = [...withinRadius].sort((a, b) => {
        switch (effectiveSort) {
          case "NEAREST":
            return (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9);
          case "RATING_DESC":
            return (b.rating ?? 0) - (a.rating ?? 0);
          case "MOST_AVAILABLE":
            return (b.availableSlotCount ?? 0) - (a.availableSlotCount ?? 0);
          case "PRICE_ASC":
            return (a.minPrice ?? 1e18) - (b.minPrice ?? 1e18);
          case "PRICE_DESC":
            return (b.maxPrice ?? 0) - (a.maxPrice ?? 0);
          default:
            return 0;
        }
      });

      return { found: true, clubs: sorted.slice(0, limit ?? 5) };
    },
  };

  const checkSlotAvailability = {
    description: "Kiểm tra một khung giờ cụ thể có trống không và gợi ý slot thay thế.",
    parameters: z.object({
      clubId: z.string(),
      date: z.string(),
      time: z.string(),
      courtId: z.string().optional(),
      sportType: z.enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL"]).optional(),
      limitAlternatives: z.number().optional().default(5),
    }),
    execute: async (input: any) => {
      const { clubId, date, time, courtId, sportType, limitAlternatives } = input ?? {};
      const target = toVnDateTime(date, time);
      const { gte, lte } = vnDayToUTC(date);

      const slots = await prisma.timeSlot.findMany({
        where: {
          status: "AVAILABLE",
          startTime: { gte, lte },
          court: {
            clubId,
            status: "ACTIVE",
            deletedAt: null,
            ...(courtId ? { id: courtId } : {}),
            ...(sportType ? { sportType } : {}),
          },
        },
        include: { court: true },
        orderBy: { startTime: "asc" },
      });

      const exact = slots.find((s) => s.startTime.getTime() === target.getTime());
      if (exact) {
        return {
          available: true,
          date,
          slot: {
            id: exact.id,
            courtId: exact.courtId,
            courtName: exact.court.name,
            sportType: exact.court.sportType,
            sportLabel: SPORT_LABEL[exact.court.sportType] ?? exact.court.sportType,
            startTimeISO: toISO(exact.startTime),
            startTimeDisplay: formatTime(exact.startTime),
            endTimeISO: toISO(exact.endTime),
            endTimeDisplay: formatTime(exact.endTime),
          },
        };
      }

      const alternatives = [...slots]
        .map((s) => ({ s, diffMs: Math.abs(s.startTime.getTime() - target.getTime()) }))
        .sort((a, b) => a.diffMs - b.diffMs)
        .slice(0, limitAlternatives ?? 5)
        .map(({ s }) => ({
          id: s.id,
          courtId: s.courtId,
          courtName: s.court.name,
          sportType: s.court.sportType,
          sportLabel: SPORT_LABEL[s.court.sportType] ?? s.court.sportType,
          startTimeISO: toISO(s.startTime),
          startTimeDisplay: formatTime(s.startTime),
          endTimeISO: toISO(s.endTime),
          endTimeDisplay: formatTime(s.endTime),
        }));

      return { available: false, date, alternatives };
    },
  };

  const getUserInsights = {
    description: "Analytics on-the-fly từ lịch sử đặt sân.",
    parameters: z.object({ lookbackBookings: z.number().optional().default(50) }),
    execute: async (input: any) => {
      if (!userId) return { error: "Bạn cần đăng nhập." };
      const lookbackBookings = input?.lookbackBookings ?? 50;

      const bookings = await prisma.booking.findMany({
        where: { userId, deletedAt: null, status: { in: ["CONFIRMED", "COMPLETED"] } },
        include: {
          club: { select: { id: true, name: true, slug: true, city: true, district: true } },
          items: { include: { timeSlot: { include: { court: { select: { id: true, name: true, sportType: true, clubId: true } } } } } },
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(Math.max(lookbackBookings, 10), 200),
      });

      if (!bookings.length) {
        return {
          message: "Bạn chưa có lịch sử đặt sân đủ để phân tích.",
          favoriteSports: [],
          favoriteHours: [],
          topClubs: [],
          bookingFrequencyByMonth: [],
        };
      }

      const sportCount = new Map<string, number>();
      const hourCount = new Map<number, number>();
      const clubAgg = new Map<string, any>();
      const monthCount = new Map<string, number>();

      for (const b of bookings) {
        const monthKey = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
        }).format(b.createdAt);
        monthCount.set(monthKey, (monthCount.get(monthKey) ?? 0) + 1);

        if (b.club?.id) {
          const existing = clubAgg.get(b.club.id) ?? {
            clubId: b.club.id,
            clubName: b.club.name,
            slug: b.club.slug ?? null,
            city: b.club.city ?? null,
            district: b.club.district ?? null,
            slotCount: 0,
            bookingsCount: 0,
            totalSpent: 0,
          };
          existing.bookingsCount += 1;
          existing.totalSpent += Number(b.finalAmount);
          clubAgg.set(b.club.id, existing);
        }

        for (const it of b.items) {
          const court = it.timeSlot?.court;
          if (!court) continue;
          sportCount.set(court.sportType, (sportCount.get(court.sportType) ?? 0) + 1);
          const hour = getVnHour(it.timeSlot.startTime);
          hourCount.set(hour, (hourCount.get(hour) ?? 0) + 1);
          if (b.club?.id) clubAgg.get(b.club.id)!.slotCount += 1;
        }
      }

      const favoriteSports = [...sportCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([sportType, slotCount]) => ({
          sportType,
          sportLabel: SPORT_LABEL[sportType] ?? sportType,
          slotCount,
        }));

      const favoriteHours = [...hourCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hour, slotCount]) => ({ hour, slotCount }));

      const topClubs = [...clubAgg.values()].sort((a, b) => b.slotCount - a.slotCount).slice(0, 5);
      const bookingFrequencyByMonth = [...monthCount.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, bookingsCount]) => ({ month, bookingsCount }));

      return { lookbackBookings: bookings.length, favoriteSports, favoriteHours, topClubs, bookingFrequencyByMonth };
    },
  };

  const createBookingTool = {
    description: "Tạo booking và trả paymentUrl nếu cần.",
    parameters: z.any(),
    execute: async (input: any) => {
      if (!userId) return { error: "Bạn cần đăng nhập để đặt sân." };
      const booking = await createBooking(userId, input);
      const method = input?.paymentMethod || "BANK_TRANSFER";
      const needsPaymentUrl = method === "VNPAY" || method === "MOMO" || method === "CREDIT_CARD";
      const paymentUrl = needsPaymentUrl
        ? await createPaymentUrl(booking.id, Number(booking.finalAmount), method, getIpAddr())
        : null;
      return {
        success: true,
        bookingCode: booking.bookingCode,
        status: booking.status,
        finalAmount: Number(booking.finalAmount),
        paymentMethod: method,
        paymentUrl,
      };
    },
  };

  return {
    searchClubs,
    checkSlotAvailability,
    getUserInsights,
    createBooking: createBookingTool,
  };
}

