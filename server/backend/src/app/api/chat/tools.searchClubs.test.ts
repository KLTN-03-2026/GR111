import { describe, expect, it, vi } from "vitest";
import { buildChatbotTools } from "./tools";

function makePrismaMock() {
  return {
    club: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
    },
    timeSlot: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  } as any;
}

function clubFixture(overrides: Partial<any>) {
  return {
    id: "c1",
    name: "Club 1",
    slug: "club-1",
    address: "Addr",
    district: "D1",
    city: "HCM",
    phone: null,
    latitude: 10,
    longitude: 106,
    openingHours: [{ dayOfWeek: new Date().getDay(), openTime: new Date(), closeTime: new Date() }],
    courts: [
      {
        id: "ct1",
        sportType: "BADMINTON",
        pricings: [{ isActive: true, pricePerHour: 100_000 }],
      },
    ],
    images: [{ url: "x" }],
    ...overrides,
  };
}

describe("buildChatbotTools.searchClubs", () => {
  it("sorts by NEAREST when lat/lng present (default)", async () => {
    const prisma = makePrismaMock();
    prisma.club.findMany.mockResolvedValue([
      clubFixture({ id: "a", latitude: 10.0, longitude: 106.0, name: "A" }),
      clubFixture({ id: "b", latitude: 11.0, longitude: 106.0, name: "B" }),
    ]);
    prisma.review.groupBy.mockResolvedValue([]);
    prisma.timeSlot.groupBy.mockResolvedValue([]);

    const tools = buildChatbotTools({
      prisma,
      userId: "u1",
      defaultLat: 10.01,
      defaultLng: 106.0,
      getIpAddr: () => "127.0.0.1",
      createBooking: vi.fn(),
      createPaymentUrl: vi.fn(),
    });

    const res = await tools.searchClubs.execute({ limit: 2 });
    expect(res.found).toBe(true);
    expect(res.clubs[0].id).toBe("a");
    expect(res.clubs[1].id).toBe("b");
    expect(res.clubs[0].distanceKm).not.toBeNull();
  });

  it("sorts by RATING_DESC when requested", async () => {
    const prisma = makePrismaMock();
    prisma.club.findMany.mockResolvedValue([
      clubFixture({ id: "a", name: "A" }),
      clubFixture({ id: "b", name: "B" }),
    ]);
    prisma.review.groupBy.mockResolvedValue([
      { clubId: "a", _avg: { rating: 3.2 }, _count: { _all: 10 } },
      { clubId: "b", _avg: { rating: 4.7 }, _count: { _all: 2 } },
    ]);
    prisma.timeSlot.groupBy.mockResolvedValue([]);

    const tools = buildChatbotTools({
      prisma,
      userId: "u1",
      defaultLat: null,
      defaultLng: null,
      getIpAddr: () => "127.0.0.1",
      createBooking: vi.fn(),
      createPaymentUrl: vi.fn(),
    });

    const res = await tools.searchClubs.execute({ sortBy: "RATING_DESC", limit: 2 });
    expect(res.clubs.map((c: any) => c.id)).toEqual(["b", "a"]);
    expect(res.clubs[0].rating).toBe(4.7);
    expect(res.clubs[0].reviewCount).toBe(2);
  });

  it("sorts by MOST_AVAILABLE when date is provided", async () => {
    const prisma = makePrismaMock();
    prisma.club.findMany.mockResolvedValue([
      clubFixture({ id: "a", courts: [{ id: "ctA", sportType: "BADMINTON", pricings: [] }] }),
      clubFixture({ id: "b", courts: [{ id: "ctB", sportType: "BADMINTON", pricings: [] }] }),
    ]);
    prisma.review.groupBy.mockResolvedValue([]);
    prisma.timeSlot.groupBy.mockResolvedValue([
      { courtId: "ctA", _count: { _all: 2 } },
      { courtId: "ctB", _count: { _all: 7 } },
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

    const res = await tools.searchClubs.execute({
      sortBy: "MOST_AVAILABLE",
      date: "2026-04-14",
      limit: 2,
    });
    expect(res.clubs.map((c: any) => c.id)).toEqual(["b", "a"]);
    expect(res.clubs[0].availableSlotCount).toBe(7);
  });
});

