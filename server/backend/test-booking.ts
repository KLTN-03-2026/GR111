import { createBooking } from "./src/modules/booking/booking.service";
import { prisma } from "./src/lib/prisma";

async function test() {
  try {
    const userId = "cmnh8cg8z000c59b5omnakcin"; // user1 from login output
    const res = await createBooking(userId, {
      clubId: "cmnh8ex0j000159m4o0kgprsk",
      slots: [
        {
          courtId: "cmnh8ex0w000e59m44lbyh4yb",
          startTime: "2026-04-02T15:00:00.000Z"
        }
      ],
      bookerName: "Test",
      bookerPhone: "0912345678",
      paymentMethod: "CASH",
      serviceIds: ["cmnh8cfuc000059b5sks6tksf"]
    });
    console.log("Success:", res.id);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
