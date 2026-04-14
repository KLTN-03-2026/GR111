import { describe, expect, it, vi } from "vitest";
import { buildChatbotTools, toVnDateTime } from "./tools";

function makePrismaMock() {
  return {
    club: { findMany: vi.fn(), findFirst: vi.fn() },
    review: { groupBy: vi.fn() },
    timeSlot: { findMany: vi.fn(), groupBy: vi.fn() },
    booking: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  } as any;
}

describe("buildChatbotTools.getUserInsights", () => {
  it("returns error when userId missing", async () => {
    const prisma = makePrismaMock();
    prisma.booking.findMany.mockResolvedValue([]);

    const tools = buildChatbotTools({
      prisma,
      userId: null,
      defaultLat: null,
      defaultLng: null,
      getIpAddr: () => "127.0.0.1",
      createBooking: vi.fn(),
      createPaymentUrl: vi.fn(),
    });

    const res = await tools.getUserInsights.execute({ lookbackBookings: 10 });
    expect(res.error).toMatch(/đăng nhập/i);
  });

  it("aggregates favoriteSports and favoriteHours", async () => {
    const prisma = makePrismaMock();
    const date = "2026-04-14";
    prisma.booking.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        finalAmount: 100000,
        club: { id: "c1", name: "Club 1", slug: "club-1", city: "HCM", district: "D1" },
        items: [
          { timeSlot: { startTime: toVnDateTime(date, "19:00"), court: { sportType: "BADMINTON" } } },
          { timeSlot: { startTime: toVnDateTime(date, "19:00"), court: { sportType: "BADMINTON" } } },
        ],
      },
      {
        createdAt: new Date("2026-04-10T10:00:00.000Z"),
        finalAmount: 200000,
        club: { id: "c2", name: "Club 2", slug: "club-2", city: "HCM", district: "D2" },
        items: [
          { timeSlot: { startTime: toVnDateTime(date, "18:00"), court: { sportType: "FOOTBALL" } } },
        ],
      },
    ]);

    const tools = buildChatbotTools({
      prisma,
      userId: "u1",
      defaultLat: null,
      defaultLng: null,
      getIpAddr: () => "127.0.0.1",
      createBooking: vi.fn(),
      createPaymentUrl: vi.fn(),
    });

    const res = await tools.getUserInsights.execute({ lookbackBookings: 50 });
    expect(res.favoriteSports[0].sportType).toBe("BADMINTON");
    expect(res.favoriteSports[0].slotCount).toBe(2);

    // 19h appears twice, should be top hour
    expect(res.favoriteHours[0].hour).toBe(19);
    expect(res.favoriteHours[0].slotCount).toBe(2);

    // Top clubs are sorted by slotCount
    expect(res.topClubs[0].clubId).toBe("c1");
    expect(res.topClubs[0].slotCount).toBe(2);
  });
});

