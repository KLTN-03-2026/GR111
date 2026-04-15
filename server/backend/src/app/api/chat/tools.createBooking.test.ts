import { describe, expect, it, vi } from "vitest";
import { buildChatbotTools } from "./tools";

function makePrismaMock() {
  return {
    club: { findMany: vi.fn(), findFirst: vi.fn() },
    review: { groupBy: vi.fn() },
    timeSlot: { findMany: vi.fn(), groupBy: vi.fn() },
    booking: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  } as any;
}

describe("buildChatbotTools.createBooking", () => {
  it("returns paymentUrl for VNPAY", async () => {
    const prisma = makePrismaMock();
    const createBooking = vi.fn().mockResolvedValue({
      id: "b1",
      bookingCode: "CODE",
      status: "WAITING_PAYMENT",
      finalAmount: 200000,
    });
    const createPaymentUrl = vi.fn().mockResolvedValue("https://pay.example/vnpay");

    const tools = buildChatbotTools({
      prisma,
      userId: "u1",
      defaultLat: null,
      defaultLng: null,
      getIpAddr: () => "127.0.0.1",
      createBooking,
      createPaymentUrl,
    });

    const res = await tools.createBooking.execute({ paymentMethod: "VNPAY" });
    expect(res.success).toBe(true);
    expect(res.paymentUrl).toBe("https://pay.example/vnpay");
    expect(createPaymentUrl).toHaveBeenCalledWith("b1", 200000, "VNPAY", "127.0.0.1");
  });

  it("does not return paymentUrl for BANK_TRANSFER", async () => {
    const prisma = makePrismaMock();
    const createBooking = vi.fn().mockResolvedValue({
      id: "b1",
      bookingCode: "CODE",
      status: "WAITING_PAYMENT",
      finalAmount: 200000,
    });
    const createPaymentUrl = vi.fn();

    const tools = buildChatbotTools({
      prisma,
      userId: "u1",
      defaultLat: null,
      defaultLng: null,
      getIpAddr: () => "127.0.0.1",
      createBooking,
      createPaymentUrl,
    });

    const res = await tools.createBooking.execute({ paymentMethod: "BANK_TRANSFER" });
    expect(res.success).toBe(true);
    expect(res.paymentUrl).toBeNull();
    expect(createPaymentUrl).not.toHaveBeenCalled();
  });

  it("returns auth error when userId missing", async () => {
    const prisma = makePrismaMock();
    const tools = buildChatbotTools({
      prisma,
      userId: null,
      defaultLat: null,
      defaultLng: null,
      getIpAddr: () => "127.0.0.1",
      createBooking: vi.fn(),
      createPaymentUrl: vi.fn(),
    });

    const res = await tools.createBooking.execute({ paymentMethod: "VNPAY" });
    expect(res.error).toMatch(/đăng nhập/i);
  });
});

