import { streamText, tool, stepCountIs, ModelMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { createBooking } from "@/modules/booking/booking.service";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { NextRequest } from "next/server";
import { CHATBOT_SYSTEM_PROMPT } from "./prompts";
import { SportType } from "@/generated/prisma";
import "dotenv/config";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY || "",
});

export const maxDuration = 30;

// Helpers
const vnDayToUTC = (date: string) => ({
  gte: new Date(`${date}T00:00:00+07:00`),
  lte: new Date(`${date}T23:59:59+07:00`),
});

const formatVN = (d: Date) => d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

const formatTime = (d: Date | string) => new Date(d).toLocaleTimeString("vi-VN", {
  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh",
});

interface RawMessagePart {
  type: string;
  text?: string;
}

interface RawMessage {
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  parts?: RawMessagePart[];
}

export async function POST(req: NextRequest) {
  try {
    const { messages: rawMessages } = await req.json();
    const messages = (rawMessages as RawMessage[]).map((m) => ({
      role: m.role,
      content: m.content || (m.parts && Array.isArray(m.parts) ? m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('') : ''),
    }) as ModelMessage);
    const { user } = await getAuthUser(req);
    const userId = (user as unknown as { id: string })?.id ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatbotTools: any = {
      searchClubs: {
        description: "Tìm kiếm sân/câu lạc bộ theo tên, loại hình thể thao, hoặc khu vực.",
        parameters: z.object({
          name: z.string().optional(),
          sport: z.enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL"]).optional(),
          city: z.string().optional(),
          district: z.string().optional(),
          limit: z.number().optional().default(5),
        }),
        execute: async ({ name, sport, city, district, limit }: {
          name?: string;
          sport?: string;
          city?: string;
          district?: string;
          limit?: number;
        }) => {
          const clubs = await prisma.club.findMany({
            where: {
              isActive: true,
              approvalStatus: "APPROVED",
              deletedAt: null,
              ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
              ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
              ...(district ? { district: { contains: district, mode: "insensitive" } } : {}),
              ...(sport ? { courts: { some: { sportType: sport as SportType, deletedAt: null } } } : {}),
            },
            include: {
              openingHours: true,
              courts: {
                include: {
                  pricings: { where: { isActive: true } }
                }
              }
            },
            take: limit,
          });

          const currentDay = new Date().getDay();
          return clubs.map(c => {
            const prices = c.courts.flatMap(ct => ct.pricings.map(px => Number(px.pricePerHour)));
            const openingHour = c.openingHours.find(hx => hx.dayOfWeek === currentDay) || c.openingHours[0];
            
            return {
              id: c.id,
              name: c.name,
              slug: c.slug,
              address: `${c.address}, ${c.district}, ${c.city}`,
              minPrice: prices.length ? Math.min(...prices) : null,
              openTime: openingHour ? formatTime(openingHour.openTime) : "—",
              closeTime: openingHour ? formatTime(openingHour.closeTime) : "—",
            };
          });
        },
      },

      getClubDetails: {
        description: "Lấy chi tiết CLB.",
        parameters: z.object({ slug: z.string() }),
        execute: async ({ slug }: { slug: string }) => {
          const club = await prisma.club.findFirst({
            where: { slug, deletedAt: null },
            include: {
              openingHours: true,
              courts: { where: { deletedAt: null } },
              amenities: { include: { amenity: true } }
            },
          });
          if (!club) return { error: "Không tìm thấy thông tin câu lạc bộ." };
          const currentDay = new Date().getDay();
          const h = club.openingHours.find(hx => hx.dayOfWeek === currentDay) || club.openingHours[0];
          return {
            id: club.id,
            name: club.name,
            openTime: h ? formatTime(h.openTime) : "—",
            closeTime: h ? formatTime(h.closeTime) : "—",
            amenities: club.amenities.map(a => ({ name: a.amenity.name, price: Number(a.price) })),
            courts: club.courts.map(c => ({ id: c.id, name: c.name, sportType: c.sportType })),
          };
        },
      },

      getAvailableSlots: {
        description: "Xem khung giờ trống.",
        parameters: z.object({ clubId: z.string(), date: z.string() }),
        execute: async ({ clubId, date }: { clubId: string; date: string }) => {
          const { gte, lte } = vnDayToUTC(date);
          const slots = await prisma.timeSlot.findMany({
            where: {
              court: { clubId, status: "ACTIVE" },
              startTime: { gte, lte },
              status: "AVAILABLE"
            },
            include: {
              court: {
                include: {
                  pricings: { where: { isActive: true } }
                }
              }
            },
            orderBy: { startTime: "asc" },
          });

          const groups: Record<string, { courtId: string; slots: { id: string; start: string; price: number }[] }> = {};
          slots.forEach(s => {
            if (!groups[s.court.name]) {
              groups[s.court.name] = { courtId: s.courtId, slots: [] };
            }
            const hour = s.startTime.getUTCHours();
            const pricing = s.court.pricings.find(px => {
              const st = new Date(px.startTime).getUTCHours();
              const en = new Date(px.endTime).getUTCHours();
              return hour >= st && hour < en;
            });
            groups[s.court.name].slots.push({
              id: s.id,
              start: formatVN(s.startTime).split(" ")[1],
              price: pricing ? Number(pricing.pricePerHour) : 0
            });
          });

          return {
            courts: Object.entries(groups).map(([name, data]) => ({
              name,
              ...data
            }))
          };
        },
      },

      getUserProfile: {
        description: "Lấy thông tin cá nhân của người dùng đang đăng nhập.",
        parameters: z.object({}),
        execute: async () => {
          if (!userId) return { error: "Bạn chưa đăng nhập." };
          const profile = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, phone: true, email: true }
          });
          return profile || { error: "Không tìm thấy thông tin profile." };
        },
      },

      getUserBookings: {
        description: "Xem đơn đã đặt.",
        parameters: z.object({ limit: z.number().optional().default(5) }),
        execute: async ({ limit }: { limit: number }) => {
          if (!userId) return { error: "Bạn cần đăng nhập để xem lịch sử đặt sân." };
          const list = await prisma.booking.findMany({
            where: { userId, deletedAt: null },
            include: {
              club: true,
              items: { include: { timeSlot: true }, take: 1 }
            },
            orderBy: { createdAt: "desc" },
            take: limit,
          });
          return list.map(b => ({
            code: b.bookingCode,
            status: b.status,
            club: b.club?.name,
            time: b.items[0] ? formatVN(b.items[0].timeSlot.startTime) : "—",
            amount: Number(b.finalAmount)
          }));
        },
      },

      createBooking: {
        description: "Tạo một đơn đặt sân mới.",
        parameters: z.object({
          clubId: z.string(),
          slots: z.array(z.object({ courtId: z.string(), startTime: z.string() })),
          bookerName: z.string(),
          bookerPhone: z.string(),
          bookerEmail: z.string().optional(),
          paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD", "MOMO", "VNPAY", "CASH"]).default("BANK_TRANSFER"),
          note: z.string().optional(),
          voucherCode: z.string().optional()
        }),
        execute: async (input: {
          clubId: string;
          slots: { courtId: string; startTime: string }[];
          bookerName: string;
          bookerPhone: string;
          bookerEmail?: string;
          paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD" | "MOMO" | "VNPAY" | "CASH";
          note?: string;
          voucherCode?: string;
        }) => {
          if (!userId) return { error: "Bạn cần đăng nhập để thực hiện đặt sân." };
          try {
            const booking = await createBooking(userId, input);
            return {
              success: true,
              bookingCode: booking.bookingCode,
              amount: Number(booking.finalAmount)
            };
          } catch (e: unknown) {
            const error = e as Error;
            return { error: error.message };
          }
        },
      },
    };

    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: google("gemini-1.5-flash") as any,
      messages,
      system: CHATBOT_SYSTEM_PROMPT,
      temperature: 0.3,
      stopWhen: stepCountIs(5),
      tools: chatbotTools,
    });

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}