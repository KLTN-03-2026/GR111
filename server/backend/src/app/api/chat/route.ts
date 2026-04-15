import { streamText, ModelMessage, createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { ToolSet } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { createBooking } from "@/modules/booking/booking.service";
import { createPaymentUrl } from "@/modules/payment/payment.service";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { NextRequest } from "next/server";
import { CHATBOT_SYSTEM_PROMPT } from "./prompts";
import { SportType } from "@/generated/prisma";
import "dotenv/config";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || "",
}) as (modelId: string) => unknown;

export const maxDuration = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const vnDayToUTC = (date: string) => ({
  gte: new Date(`${date}T00:00:00+07:00`),
  lte: new Date(`${date}T23:59:59+07:00`),
});

const formatVN = (d: Date | string) =>
  new Date(d).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

const formatTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });

const toISO = (d: Date | string) => new Date(d).toISOString();

const SPORT_LABEL: Record<string, string> = {
  FOOTBALL: "Bóng đá", BADMINTON: "Cầu lông", TENNIS: "Tennis",
  PICKLEBALL: "Pickleball", BASKETBALL: "Bóng rổ", VOLLEYBALL: "Bóng chuyền",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
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

function toVnDateTime(date: string, timeHHmm: string) {
  return new Date(`${date}T${timeHHmm}:00+07:00`);
}

function getVnHour(d: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? "00";
  return Number(hourPart);
}

// Maps tool name → component type cho frontend
const TOOL_TO_COMPONENT: Record<string, string> = {
  searchClubs: "clubList",
  getClubDetails: "clubDetail",
  getAvailableSlots: "slotPicker",
  checkSlotAvailability: "slotPicker",
  getUserProfile: "userProfile",
  getUserBookings: "bookingHistory",
  getUserInsights: "text",
  createBooking: "bookingSuccess",
};

interface RawMessagePart { type: string; text?: string }
interface RawMessage {
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  parts?: RawMessagePart[];
}

type ToolName = keyof typeof TOOL_TO_COMPONENT;
type ToolResult = unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ChatRequestSchema = z
  .object({
    // Some clients/transports may override body and omit messages; handle gracefully.
    messages: z.array(z.unknown()).optional().default([]),
    userLocation: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  })
  .passthrough();

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const jsonBody: unknown = await req.json();
    const parsedBody = ChatRequestSchema.safeParse(jsonBody);

    // Fallback: some transports nest payload under `body`
    const nestedBody =
      isRecord(jsonBody) && isRecord(jsonBody.body) ? jsonBody.body : null;

    const rawMessages =
      parsedBody.success
        ? parsedBody.data.messages
        : (isRecord(jsonBody) && Array.isArray(jsonBody.messages)
          ? jsonBody.messages
          : (nestedBody && Array.isArray(nestedBody.messages)
            ? nestedBody.messages
            : []));

    const userLocation =
      parsedBody.success
        ? parsedBody.data.userLocation
        : (isRecord(jsonBody) && isRecord(jsonBody.userLocation)
          ? (jsonBody.userLocation as { lat?: unknown; lng?: unknown })
          : (nestedBody && isRecord(nestedBody.userLocation)
            ? (nestedBody.userLocation as { lat?: unknown; lng?: unknown })
            : undefined));

    if (!Array.isArray(rawMessages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = (rawMessages as RawMessage[]).map(
      (m) =>
        ({
          role: m.role,
          content:
            m.content ||
            (m.parts && Array.isArray(m.parts)
              ? m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")
              : ""),
        }) as ModelMessage
    );

    const { user } = await getAuthUser(req);
    const userId = user?.userId ?? null;
    const defaultLat = userLocation?.lat ?? null;
    const defaultLng = userLocation?.lng ?? null;

    const stream = createUIMessageStream({
      execute: async (ctx: unknown) => {
        const { writer } = ctx as {
          writer: {
            write: (chunk: unknown) => void;
            merge: (stream: unknown) => void;
          };
        };
        // Track tool cuối cùng được gọi
        let lastToolName: ToolName | null = null;
        let lastToolResult: ToolResult | null = null;

        // Helper gán tool result
        const setLast = <TResult,>(name: ToolName, result: TResult) => {
          lastToolName = name;
          lastToolResult = result;
          return result;
        };

        const chatbotTools = ({

          // ── 1. searchClubs ────────────────────────────────────────────────────
          searchClubs: {
            description:
              "Tìm câu lạc bộ/sân theo môn, tên, khu vực. Gọi ngay khi user cung cấp môn thể thao hoặc địa điểm bất kỳ.",
            parameters: z.object({
              name: z.string().optional(),
              sport: z.enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL"]).optional(),
              city: z.string().optional(),
              district: z.string().optional(),
              maxPrice: z.number().optional().describe("Giá tối đa VND/giờ"),
              lat: z.number().optional(),
              lng: z.number().optional(),
              radiusKm: z.number().optional().default(20),
              date: z.string().optional().describe("Ngày YYYY-MM-DD (để xếp hạng theo số slot trống)"),
              sortBy: z.enum(["NEAREST", "RATING_DESC", "MOST_AVAILABLE", "PRICE_ASC", "PRICE_DESC"]).optional(),
              limit: z.number().optional().default(5),
            }),
            execute: async ({
              name, sport, city, district, maxPrice, lat, lng, radiusKm, date, sortBy, limit,
            }: {
              name?: string; sport?: string; city?: string;
              district?: string; maxPrice?: number; limit?: number;
              lat?: number; lng?: number; radiusKm?: number; date?: string;
              sortBy?: "NEAREST" | "RATING_DESC" | "MOST_AVAILABLE" | "PRICE_ASC" | "PRICE_DESC";
            }) => {
              const userLat = lat ?? defaultLat;
              const userLng = lng ?? defaultLng;

              const clubs = await prisma.club.findMany({
                where: {
                  isActive: true, approvalStatus: "APPROVED", deletedAt: null,
                  ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
                  ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
                  ...(district ? { district: { contains: district, mode: "insensitive" } } : {}),
                  ...((sport || maxPrice) ? {
                    courts: {
                      some: {
                        deletedAt: null,
                        ...(sport ? { sportType: sport as SportType } : {}),
                        ...(maxPrice ? { pricings: { some: { isActive: true, pricePerHour: { lte: maxPrice } } } } : {}),
                      }
                    },
                  } : {}),
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

              const currentDay = new Date().getDay();

              if (!clubs.length) return setLast("searchClubs", { found: false, clubs: [] });

              const clubIds = clubs.map((c) => c.id);

              const ratingRows = await prisma.review.groupBy({
                by: ["clubId"],
                where: { isVisible: true, clubId: { in: clubIds } },
                _avg: { rating: true },
                _count: { _all: true },
              });

              const ratingMap = new Map<string, { avg: number | null; count: number }>();
              for (const r of ratingRows) {
                ratingMap.set(r.clubId ?? "", {
                  avg: r._avg.rating ?? null,
                  count: r._count._all ?? 0,
                });
              }

              const availabilityMap = new Map<string, number>();
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
                      ...(sport ? { sportType: sport as SportType } : {}),
                    },
                  },
                  _count: { _all: true },
                });

                const courtToClub = new Map<string, string>();
                for (const c of clubs) {
                  for (const ct of c.courts) courtToClub.set(ct.id, c.id);
                }
                for (const row of availabilityRows) {
                  const cid = courtToClub.get(row.courtId);
                  if (!cid) continue;
                  availabilityMap.set(cid, (availabilityMap.get(cid) ?? 0) + (row._count._all ?? 0));
                }
              }

              const processed = clubs.map((c) => {
                const prices = c.courts.flatMap((ct) =>
                  ct.pricings.map((px) => Number(px.pricePerHour))
                );
                const todayH =
                  c.openingHours.find((h) => h.dayOfWeek === currentDay) ||
                  c.openingHours[0];
                const sports = [
                  ...new Set(c.courts.map((ct) => ct.sportType as string)),
                ].map((s) => ({ key: s, label: SPORT_LABEL[s] ?? s }));

                const dist =
                  userLat != null &&
                  userLng != null &&
                  c.latitude != null &&
                  c.longitude != null
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

              const effectiveSort =
                sortBy ??
                (userLat != null && userLng != null ? "NEAREST" : undefined);

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

              return setLast("searchClubs", {
                found: true,
                clubs: sorted.slice(0, limit ?? 5),
              });
            },
          },

          // ── 2. getClubDetails ──────────────────────────────────────────────────
          getClubDetails: {
            description: "Lấy chi tiết CLB: mô tả, tiện ích, danh sách sân con, bảng giá theo khung giờ.",
            parameters: z.object({ slug: z.string() }),
            execute: async ({ slug }: { slug: string }) => {
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

              if (!club) return setLast("getClubDetails", { error: "Không tìm thấy câu lạc bộ." });

              const currentDay = new Date().getDay();
              const todayH =
                club.openingHours.find((h) => h.dayOfWeek === currentDay) ||
                club.openingHours[0];

              const pricingWindows = club.courts.flatMap((ct) =>
                ct.pricings.map((px) => ({
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

              return setLast("getClubDetails", {
                id: club.id,
                name: club.name,
                slug: club.slug,
                description: club.description ?? null,
                fullAddress: `${club.address}, ${club.district}, ${club.city}`,
                phone: club.phone ?? null,
                email: club.email ?? null,
                rating: null,
                images: club.images.map((img) => img.url),
                cheapestPricingWindows,
                todayHours: todayH
                  ? { openTime: formatTime(todayH.openTime), closeTime: formatTime(todayH.closeTime), isClosed: todayH.isClosed ?? false }
                  : null,
                weeklyHours: club.openingHours.map((h) => ({
                  dayOfWeek: h.dayOfWeek,
                  openTime: formatTime(h.openTime),
                  closeTime: formatTime(h.closeTime),
                  isClosed: h.isClosed ?? false,
                })),
                amenities: club.amenities.map((a) => ({
                  name: a.amenity.name,
                  icon: a.amenity.icon ?? null,
                  price: Number(a.price),
                })),
                vouchers: club.vouchers.map((v) => ({
                  code: v.code,
                  title: v.title,
                  discount: Number(v.value),
                  type: v.type,
                })),
                courts: club.courts.map((ct) => ({
                  id: ct.id,
                  name: ct.name,
                  sportType: ct.sportType,
                  sportLabel: SPORT_LABEL[ct.sportType] ?? ct.sportType,
                  status: ct.status,
                  pricings: ct.pricings.map((px) => ({
                    startTime: formatTime(px.startTime),
                    endTime: formatTime(px.endTime),
                    pricePerHour: Number(px.pricePerHour),
                    label: px.label ?? null,
                  })),
                })),
              });
            },
          },

          // ── 3. getAvailableSlots ────────────────────────────────────────────────
          getAvailableSlots: {
            description:
              "Xem slot trống. Trả về startTimeISO (dùng cho createBooking) và startTimeDisplay (hiển thị cho user).",
            parameters: z.object({
              clubId: z.string(),
              date: z.string().describe("Ngày YYYY-MM-DD"),
              sportType: z.enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL"]).optional(),
            }),
            execute: async ({
              clubId, date, sportType,
            }: {
              clubId: string; date: string; sportType?: string;
            }) => {
              const { gte, lte } = vnDayToUTC(date);

              const slots = await prisma.timeSlot.findMany({
                where: {
                  court: {
                    clubId, status: "ACTIVE", deletedAt: null,
                    ...(sportType ? { sportType: sportType as SportType } : {}),
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
                return setLast("getAvailableSlots", {
                  available: false, date, courts: [],
                  message: `Không có slot trống ngày ${date}.`,
                });
              }

              // Nhóm theo sân con
              const groups: Record<string, {
                courtId: string; courtName: string; sportType: string; sportLabel: string;
                slots: {
                  id: string;
                  startTimeISO: string;     // ← Full ISO cho createBooking
                  endTimeISO: string;
                  startTimeDisplay: string; // ← "08:00" để hiển thị/nói chuyện
                  endTimeDisplay: string;
                  durationMinutes: number;
                  pricePerHour: number;
                }[];
              }> = {};

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
                const pricing = s.court.pricings.find((px) => {
                  const st = new Date(px.startTime).getUTCHours();
                  const en = new Date(px.endTime).getUTCHours();
                  return startHourUTC >= st && startHourUTC < en;
                });

                const endTime = s.endTime;
                const endMs = endTime.getTime();

                groups[key].slots.push({
                  id: s.id,
                  startTimeISO: toISO(s.startTime),       // createBooking dùng cái này
                  endTimeISO: toISO(endTime),
                  startTimeDisplay: formatTime(s.startTime),  // hiển thị dùng cái này
                  endTimeDisplay: formatTime(endTime),
                  durationMinutes: Math.round((endMs - s.startTime.getTime()) / 60_000),
                  pricePerHour: pricing ? Number(pricing.pricePerHour) : 0,
                });
              }

              return setLast("getAvailableSlots", {
                available: true,
                date,
                courts: Object.values(groups),
                summary: Object.values(groups).map((g) => ({
                  courtName: g.courtName,
                  sportLabel: g.sportLabel,
                  slotCount: g.slots.length,
                  firstSlot: g.slots[0].startTimeDisplay,
                  lastSlot: g.slots[g.slots.length - 1].startTimeDisplay,
                })),
              });
            },
          },

          // ── 3b. checkSlotAvailability ──────────────────────────────────────────
          checkSlotAvailability: {
            description:
              "Kiểm tra một khung giờ cụ thể có trống không. Nếu không trống, gợi ý các slot gần nhất trong ngày.",
            parameters: z.object({
              clubId: z.string(),
              date: z.string().describe("Ngày YYYY-MM-DD"),
              time: z.string().describe("Giờ HH:mm (giờ Việt Nam)"),
              courtId: z.string().optional(),
              sportType: z.enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL"]).optional(),
              limitAlternatives: z.number().optional().default(5),
            }),
            execute: async ({
              clubId,
              date,
              time,
              courtId,
              sportType,
              limitAlternatives,
            }: {
              clubId: string;
              date: string;
              time: string;
              courtId?: string;
              sportType?: string;
              limitAlternatives?: number;
            }) => {
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
                    ...(sportType ? { sportType: sportType as SportType } : {}),
                  },
                },
                include: { court: true },
                orderBy: { startTime: "asc" },
              });

              const exact = slots.find((s) => s.startTime.getTime() === target.getTime());
              if (exact) {
                return setLast("checkSlotAvailability", {
                  available: true,
                  date,
                  message: `Slot ${time} ngày ${date} đang trống.`,
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
                });
              }

              const alternatives = [...slots]
                .map((s) => ({
                  s,
                  diffMs: Math.abs(s.startTime.getTime() - target.getTime()),
                }))
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

              return setLast("checkSlotAvailability", {
                available: false,
                date,
                message: `Slot ${time} ngày ${date} không còn trống hoặc không tồn tại.`,
                alternatives,
              });
            },
          },

          // ── 4. getUserProfile ──────────────────────────────────────────────────
          getUserProfile: {
            description: "Lấy thông tin cá nhân người dùng đang đăng nhập.",
            parameters: z.object({}),
            execute: async () => {
              if (!userId) return setLast("getUserProfile", { error: "Bạn chưa đăng nhập." });
              const profile = await prisma.user.findUnique({
                where: { id: userId },
                select: { fullName: true, phone: true, email: true, avatarUrl: true },
              });
              return setLast("getUserProfile", profile ?? { error: "Không tìm thấy profile." });
            },
          },

          // ── 5. getUserBookings ─────────────────────────────────────────────────
          getUserBookings: {
            description: "Xem lịch sử đặt sân của người dùng.",
            parameters: z.object({
              limit: z.number().optional().default(5),
              status: z.enum(["PENDING", "WAITING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
            }),
            execute: async ({ limit, status }: { limit: number; status?: string }) => {
              if (!userId) return setLast("getUserBookings", { error: "Bạn cần đăng nhập." });

              const list = await prisma.booking.findMany({
                where: {
                  userId, deletedAt: null,
                  ...(status ? { status: status as never } : {}),
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
                take: limit,
              });

              return setLast("getUserBookings", list.map((b) => {
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
              }));
            },
          },

          // ── 5b. getUserInsights ────────────────────────────────────────────────
          getUserInsights: {
            description:
              "Phân tích thói quen đặt sân của user (môn hay chơi, khung giờ hay đặt, sân hay đặt, tần suất). Chỉ dùng khi user đã đăng nhập.",
            parameters: z.object({
              lookbackBookings: z.number().optional().default(50),
            }),
            execute: async ({ lookbackBookings }: { lookbackBookings: number }) => {
              if (!userId) return setLast("getUserInsights", { error: "Bạn cần đăng nhập." });

              const bookings = await prisma.booking.findMany({
                where: {
                  userId,
                  deletedAt: null,
                  status: { in: ["CONFIRMED", "COMPLETED"] },
                },
                include: {
                  club: { select: { id: true, name: true, slug: true, city: true, district: true } },
                  items: { include: { timeSlot: { include: { court: { select: { id: true, name: true, sportType: true, clubId: true } } } } } },
                },
                orderBy: { createdAt: "desc" },
                take: Math.min(Math.max(lookbackBookings ?? 50, 10), 200),
              });

              if (!bookings.length) {
                return setLast("getUserInsights", {
                  message: "Bạn chưa có lịch sử đặt sân đủ để phân tích.",
                  favoriteSports: [],
                  favoriteHours: [],
                  topClubs: [],
                  bookingFrequencyByMonth: [],
                });
              }

              const sportCount = new Map<string, number>();
              const hourCount = new Map<number, number>();
              const clubAgg = new Map<string, {
                clubId: string;
                clubName: string;
                slug: string | null;
                city: string | null;
                district: string | null;
                slotCount: number;
                bookingsCount: number;
                totalSpent: number;
              }>();
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
                    city: (b.club as { city?: string }).city ?? null,
                    district: (b.club as { district?: string }).district ?? null,
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

                  if (b.club?.id) {
                    const existing = clubAgg.get(b.club.id);
                    if (existing) existing.slotCount += 1;
                  }
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
                .map(([hour, slotCount]) => ({
                  hour,
                  slotCount,
                }));

              const topClubs = [...clubAgg.values()]
                .sort((a, b) => b.slotCount - a.slotCount)
                .slice(0, 5);

              const bookingFrequencyByMonth = [...monthCount.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([month, bookingsCount]) => ({ month, bookingsCount }));

              return setLast("getUserInsights", {
                lookbackBookings: bookings.length,
                favoriteSports,
                favoriteHours,
                topClubs,
                bookingFrequencyByMonth,
              });
            },
          },

          // ── 6. createBooking ───────────────────────────────────────────────────
          createBooking: {
            description:
              "Tạo đơn đặt sân. CHỈ gọi sau khi user xác nhận rõ ràng. Dùng startTimeISO từ getAvailableSlots.",
            parameters: z.object({
              clubId: z.string(),
              slots: z.array(z.object({
                courtId: z.string(),
                startTime: z.string().describe("startTimeISO từ getAvailableSlots"),
              })).min(1),
              bookerName: z.string(),
              bookerPhone: z.string(),
              bookerEmail: z.string().optional(),
              paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "MOMO", "VNPAY", "CASH"]).default("BANK_TRANSFER"),
              note: z.string().optional(),
              voucherCode: z.string().optional(),
            }),
            execute: async (input: {
              clubId: string;
              slots: { courtId: string; startTime: string }[];
              bookerName: string; bookerPhone: string; bookerEmail?: string;
              paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD" | "MOMO" | "VNPAY" | "CASH";
              note?: string; voucherCode?: string;
            }) => {
              if (!userId) return setLast("createBooking", { error: "Bạn cần đăng nhập để đặt sân." });
              if (!input.slots?.length) return setLast("createBooking", { error: "Thiếu thông tin khung giờ." });

              try {
                const booking = await createBooking(userId, input);
                const method = input.paymentMethod || "BANK_TRANSFER";
                const needsPaymentUrl =
                  method === "VNPAY" || method === "MOMO" || method === "CREDIT_CARD";
                const ipAddr = req.headers.get("x-forwarded-for") || "127.0.0.1";
                const paymentUrl = needsPaymentUrl
                  ? await createPaymentUrl(
                    booking.id,
                    Number(booking.finalAmount),
                    method,
                    ipAddr
                  )
                  : null;
                return setLast("createBooking", {
                  success: true,
                  bookingCode: booking.bookingCode,
                  status: booking.status,
                  finalAmount: Number(booking.finalAmount),
                  paymentMethod: method,
                  paymentUrl,
                  createdAt: formatVN(booking.createdAt),
                });
              } catch (e: unknown) {
                return setLast("createBooking", { error: (e as Error).message });
              }
            },
          },
        } as unknown) as ToolSet;

        // ── streamText ────────────────────────────────────────────────────────────
        const result = streamText({
          model: google("gemini-2.5-flash"),
          messages,
          system: `${CHATBOT_SYSTEM_PROMPT}

NGỮCẢNH: Hôm nay ${new Date().toLocaleDateString("vi-VN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })} — ${new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.
User: ${userId ? `đã đăng nhập (userId=${userId})` : "chưa đăng nhập"}.`,
          temperature: 0.3,
          tools: chatbotTools,

          onFinish: () => {
            // Xác định component từ tool cuối được gọi — AI chỉ cần nói chuyện tự nhiên
            if (lastToolName && lastToolResult) {
              const hasError =
                isRecord(lastToolResult) && lastToolResult.error != null;
              const isAuthError = hasError &&
                String((lastToolResult as Record<string, unknown>).error)
                  .toLowerCase()
                  .includes("đăng nhập");

              // AI SDK v6: data chunks phải dùng type 'data-{name}', không phải 'data'
              writer.write({
                type: "data-chatComponent",
                data: {
                  component: isAuthError
                    ? "authRequired"
                    : hasError
                      ? "error"
                      : (TOOL_TO_COMPONENT[lastToolName] ?? "text"),
                  data: lastToolResult,
                },
              });
            }
          },
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}