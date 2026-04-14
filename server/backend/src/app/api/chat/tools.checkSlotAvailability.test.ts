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

describe("buildChatbotTools.checkSlotAvailability", () => {
  it("returns available=true when exact slot exists", async () => {
    const prisma = makePrismaMock();
    const date = "2026-04-14";
    const time = "19:00";
    const start = toVnDateTime(date, time);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    prisma.timeSlot.findMany.mockResolvedValue([
      {
        id: "s1",
        courtId: "ct1",
        startTime: start,
        endTime: end,
        court: { name: "Sân 1", sportType: "BADMINTON" },
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

    const res = await tools.checkSlotAvailability.execute({ clubId: "c1", date, time });
    expect(res.available).toBe(true);
    expect(res.slot.id).toBe("s1");
    expect(res.slot.startTimeDisplay).toBe("19:00");
  });

  it("returns alternatives when exact slot does not exist", async () => {
    const prisma = makePrismaMock();
    const date = "2026-04-14";

    const s18 = toVnDateTime(date, "18:00");
    const s20 = toVnDateTime(date, "20:00");
    prisma.timeSlot.findMany.mockResolvedValue([
      {
        id: "s18",
        courtId: "ct1",
        startTime: s18,
        endTime: new Date(s18.getTime() + 60 * 60 * 1000),
        court: { name: "Sân 1", sportType: "BADMINTON" },
      },
      {
        id: "s20",
        courtId: "ct1",
        startTime: s20,
        endTime: new Date(s20.getTime() + 60 * 60 * 1000),
        court: { name: "Sân 1", sportType: "BADMINTON" },
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

    const res = await tools.checkSlotAvailability.execute({
      clubId: "c1",
      date,
      time: "19:00",
      limitAlternatives: 2,
    });

    expect(res.available).toBe(false);
    expect(res.alternatives).toHaveLength(2);
    // Alternatives should be nearest by time diff, so 18:00 and 20:00
    expect(res.alternatives.map((a: any) => a.id)).toEqual(["s18", "s20"]);
  });
});

