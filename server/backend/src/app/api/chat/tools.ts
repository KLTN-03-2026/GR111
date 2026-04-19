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

export function formatVN(d: Date | string) {
  return new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
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

function normalizeAddressText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function extractDistrictNumber(value: unknown) {
  const normalized = normalizeAddressText(value);
  const match = normalized.match(/\d+/);
  return match ? Number(match[0]) : null;
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
      maxPrice: z.number().optional().describe("Giá mục tiêu VND/giờ. Ưu tiên giá đúng bằng, nếu không có thì lấy giá gần nhất."),
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
      const normalizedCity = city ? normalizeAddressText(city) : null;
      const normalizedDistrict = district ? normalizeAddressText(district) : null;
      const requestedDistrictNo = district ? extractDistrictNumber(district) : null;

      const clubs = await prisma.club.findMany({
        where: {
          isActive: true,
          approvalStatus: "APPROVED",
          deletedAt: null,
          ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
          ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
          ...(district ? { district: { contains: district, mode: "insensitive" } } : {}),
          ...(sport
            ? {
              courts: {
                some: {
                  deletedAt: null,
                  ...(sport ? { sportType: sport } : {}),
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
        const sportKeys = [...new Set<string>(c.courts.map((ct: any) => String(ct.sportType)))];
        const sports = sportKeys.map((s) => ({
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
        const targetPrice = typeof maxPrice === "number" ? maxPrice : null;
        const closestPrice =
          targetPrice != null && prices.length
            ? prices.reduce((best: number, current: number) =>
              Math.abs(current - targetPrice) < Math.abs(best - targetPrice) ? current : best
            )
            : null;
        const priceDiff =
          targetPrice != null && closestPrice != null
            ? Math.abs(closestPrice - targetPrice)
            : null;

        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          city: c.city,
          district: c.district,
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
          displayPrice: closestPrice ?? (prices.length ? Math.min(...prices) : null),
          priceMatchType: priceDiff === 0 ? "EXACT" : (priceDiff != null ? "NEAREST" : null),
          priceDiff,
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

      const matchesCity = (club: { city?: string | null }) => {
        if (!normalizedCity) return true;
        return normalizeAddressText(club.city).includes(normalizedCity);
      };

      const matchesDistrict = (club: { district?: string | null }) => {
        if (!normalizedDistrict) return true;
        const clubDistrictNorm = normalizeAddressText(club.district);
        if (clubDistrictNorm.includes(normalizedDistrict)) return true;
        const clubDistrictNo = extractDistrictNumber(club.district);
        return requestedDistrictNo != null && clubDistrictNo === requestedDistrictNo;
      };

      const byAddress = withinRadius.filter((club) => matchesCity(club) && matchesDistrict(club));
      const byCityOnly = normalizedCity
        ? withinRadius.filter((club) => matchesCity(club))
        : [];
      const candidateBase =
        byAddress.length > 0
          ? byAddress
          : (byCityOnly.length > 0 ? byCityOnly : withinRadius);

      const targetPrice = typeof maxPrice === "number" ? maxPrice : null;
      const effectiveSort = sortBy ?? (userLat != null && userLng != null ? "NEAREST" : undefined);
      const sorted = [...candidateBase].sort((a, b) => {
        if (normalizedCity || normalizedDistrict) {
          const scoreAddress = (club: { city?: string | null; district?: string | null }) => {
            let score = 0;
            if (matchesCity(club)) score += 2;
            if (matchesDistrict(club)) score += 4;
            const clubDistrictNo = extractDistrictNumber(club.district);
            if (requestedDistrictNo != null && clubDistrictNo === requestedDistrictNo) score += 2;
            return score;
          };
          const byAddressScore = scoreAddress(b) - scoreAddress(a);
          if (byAddressScore !== 0) return byAddressScore;
        }

        if (targetPrice != null && !sortBy) {
          const byPriceDiff = (a.priceDiff ?? 1e18) - (b.priceDiff ?? 1e18);
          if (byPriceDiff !== 0) return byPriceDiff;
          const byDistance = (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9);
          if (byDistance !== 0) return byDistance;
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
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

  const getClubDetails = {
    description: "Lấy chi tiết CLB: mô tả, tiện ích, danh sách sân con, bảng giá theo khung giờ.",
    parameters: z.object({ slug: z.string() }),
    execute: async (input: any) => {
      const slug = input?.slug;
      const club = await prisma.club.findFirst({
        where: { slug, deletedAt: null },
        include: {
          openingHours: true,
          courts: {
            where: { deletedAt: null },
            include: { pricings: { where: { isActive: true }, orderBy: { startTime: "asc" } } },
          },
          amenities: { include: { amenity: true } },
          images: { orderBy: { createdAt: "asc" } },
          vouchers: { where: { isActive: true, endDate: { gte: new Date() } } },
        },
      });

      if (!club) return { error: "Không tìm thấy câu lạc bộ." };

      const currentDay = new Date().getDay();
      const todayH =
        club.openingHours.find((h: any) => h.dayOfWeek === currentDay) ||
        club.openingHours[0];

      const pricingWindows = club.courts.flatMap((ct: any) =>
        ct.pricings.map((px: any) => ({
          courtId: ct.id,
          courtName: ct.name,
          sportType: ct.sportType,
          sportLabel: SPORT_LABEL[ct.sportType] ?? ct.sportType,
          startTime: formatTime(px.startTime),
          endTime: formatTime(px.endTime),
          pricePerHour: Number(px.pricePerHour),
          label: px.label ?? null,
        }))
      );

      const cheapestPricingWindows = [...pricingWindows]
        .sort((a, b) => a.pricePerHour - b.pricePerHour)
        .slice(0, 3);

      return {
        id: club.id,
        name: club.name,
        slug: club.slug,
        description: club.description ?? null,
        fullAddress: `${club.address}, ${club.district}, ${club.city}`,
        phone: club.phone ?? null,
        email: club.email ?? null,
        rating: null,
        images: club.images.map((img: any) => img.url),
        cheapestPricingWindows,
        todayHours: todayH
          ? { openTime: formatTime(todayH.openTime), closeTime: formatTime(todayH.closeTime), isClosed: todayH.isClosed ?? false }
          : null,
        weeklyHours: club.openingHours.map((h: any) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: formatTime(h.openTime),
          closeTime: formatTime(h.closeTime),
          isClosed: h.isClosed ?? false,
        })),
        amenities: club.amenities.map((a: any) => ({
          name: a.amenity.name,
          icon: a.amenity.icon ?? null,
          price: Number(a.price),
        })),
        vouchers: club.vouchers.map((v: any) => ({
          code: v.code,
          title: v.title,
          discount: Number(v.value),
          type: v.type,
        })),
        courts: club.courts.map((ct: any) => ({
          id: ct.id,
          name: ct.name,
          sportType: ct.sportType,
          sportLabel: SPORT_LABEL[ct.sportType] ?? ct.sportType,
          status: ct.status,
          pricings: ct.pricings.map((px: any) => ({
            startTime: formatTime(px.startTime),
            endTime: formatTime(px.endTime),
            pricePerHour: Number(px.pricePerHour),
            label: px.label ?? null,
          })),
        })),
      };
    },
  };

  const getAvailableSlots = {
    description:
      "Xem slot trống. Trả về startTimeISO (dùng cho createBooking) và startTimeDisplay (hiển thị cho user).",
    parameters: z.object({
      clubId: z.string(),
      date: z.string().describe("Ngày YYYY-MM-DD"),
      sportType: z.enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL"]).optional(),
    }),
    execute: async (input: any) => {
      const { clubId, date, sportType } = input ?? {};
      const { gte, lte } = vnDayToUTC(date);

      const slots = await prisma.timeSlot.findMany({
        where: {
          court: {
            clubId,
            status: "ACTIVE",
            deletedAt: null,
            ...(sportType ? { sportType } : {}),
          },
          startTime: { gte, lte },
          status: "AVAILABLE",
        },
        include: {
          court: { include: { pricings: { where: { isActive: true } } } },
        },
        orderBy: { startTime: "asc" },
      });

      if (!slots.length) {
        return {
          available: false,
          date,
          courts: [],
          message: `Không có slot trống ngày ${date}.`,
        };
      }

      const groups: Record<string, any> = {};
      for (const s of slots) {
        const key = s.court.id;
        if (!groups[key]) {
          groups[key] = {
            courtId: s.court.id,
            courtName: s.court.name,
            sportType: s.court.sportType,
            sportLabel: SPORT_LABEL[s.court.sportType] ?? s.court.sportType,
            slots: [],
          };
        }

        const startHourUTC = s.startTime.getUTCHours();
        const pricing = s.court.pricings.find((px: any) => {
          const st = new Date(px.startTime).getUTCHours();
          const en = new Date(px.endTime).getUTCHours();
          return startHourUTC >= st && startHourUTC < en;
        });

        const endTime = s.endTime;
        const endMs = endTime.getTime();
        groups[key].slots.push({
          id: s.id,
          startTimeISO: toISO(s.startTime),
          endTimeISO: toISO(endTime),
          startTimeDisplay: formatTime(s.startTime),
          endTimeDisplay: formatTime(endTime),
          durationMinutes: Math.round((endMs - s.startTime.getTime()) / 60_000),
          pricePerHour: pricing ? Number(pricing.pricePerHour) : 0,
        });
      }

      return {
        available: true,
        date,
        courts: Object.values(groups),
        summary: Object.values(groups).map((g: any) => ({
          courtName: g.courtName,
          sportLabel: g.sportLabel,
          slotCount: g.slots.length,
          firstSlot: g.slots[0].startTimeDisplay,
          lastSlot: g.slots[g.slots.length - 1].startTimeDisplay,
        })),
      };
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

  const getUserProfile = {
    description: "Lấy thông tin cá nhân người dùng đang đăng nhập.",
    parameters: z.object({}),
    execute: async () => {
      if (!userId) return { error: "Bạn chưa đăng nhập." };
      const profile = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, phone: true, email: true, avatarUrl: true },
      });
      return profile ?? { error: "Không tìm thấy profile." };
    },
  };

  const getUserBookings = {
    description: "Xem lịch sử đặt sân của người dùng.",
    parameters: z.object({
      limit: z.number().optional().default(5),
      status: z.enum(["PENDING", "WAITING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
    }),
    execute: async (input: any) => {
      const { limit, status } = input ?? {};
      if (!userId) return { error: "Bạn cần đăng nhập." };

      const list = await prisma.booking.findMany({
        where: {
          userId,
          deletedAt: null,
          ...(status ? { status } : {}),
        },
        include: {
          club: { select: { name: true, address: true, city: true } },
          payment: { select: { method: true } },
          items: {
            include: {
              timeSlot: { include: { court: { select: { name: true, sportType: true } } } },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit ?? 5,
      });

      return list.map((b: any) => {
        const item = b.items[0];
        const court = item?.timeSlot?.court;
        return {
          bookingCode: b.bookingCode,
          status: b.status,
          clubName: b.club?.name ?? null,
          courtName: court?.name ?? null,
          sportLabel: court ? (SPORT_LABEL[court.sportType] ?? court.sportType) : null,
          startTime: item ? formatVN(item.timeSlot.startTime) : null,
          paymentMethod: b.payment?.method ?? null,
          finalAmount: Number(b.finalAmount),
          createdAt: formatVN(b.createdAt),
        };
      });
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
    getClubDetails,
    getAvailableSlots,
    checkSlotAvailability,
    getUserProfile,
    getUserBookings,
    getUserInsights,
    createBooking: createBookingTool,
  };
}

