import {
  sendBookingConfirmationEmail,
  sendBookingWaitingPaymentEmail,
  sendOwnerNewBookingEmail,
} from "@/infra/mail/mailer";

type EmailTestMode = "all" | "user-confirmed" | "user-waiting" | "owner-new-booking";

function parseMode(argv: string[]): EmailTestMode {
  const raw = argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1]?.trim();

  if (
    raw === "user-confirmed" ||
    raw === "user-waiting" ||
    raw === "owner-new-booking" ||
    raw === "all"
  ) {
    return raw;
  }

  return "all";
}

async function main() {
  const mode = parseMode(process.argv.slice(2));

  const bookerEmail = process.env.TEST_BOOKER_EMAIL || process.env.SMTP_USER || "";
  const ownerEmail = process.env.TEST_OWNER_EMAIL || process.env.SMTP_USER || "";

  if (!bookerEmail) {
    throw new Error("TEST_BOOKER_EMAIL_MISSING");
  }

  if (!ownerEmail) {
    throw new Error("TEST_OWNER_EMAIL_MISSING");
  }

  const slots = [
    { date: "Thu 2, 21/04/2026", time: "18:00 - 19:00" },
    { date: "Thu 2, 21/04/2026", time: "19:00 - 20:00" },
  ];

  const bookingPayload = {
    bookingId: "test-booking-id-001",
    bookingCode: "TEST-BOOKING-001",
    bookerName: "Nguyen Van A",
    bookerEmail,
    bookerPhone: "0900000000",
    clubName: "Playfinder Club Test",
    courtName: "San A, San B",
    slots,
    totalAmount: 500000,
    discountAmount: 50000,
    finalAmount: 450000,
    paymentMethod: "Chuyen khoan ngan hang",
    cancelSupportToken: "fake-token-for-mail-preview",
  };

  console.log("=== BOOKING EMAIL FLOW TEST START ===");
  console.log(`Mode: ${mode}`);
  console.log(`Booker email: ${bookerEmail}`);
  console.log(`Owner email: ${ownerEmail}`);

  if (mode === "all" || mode === "user-waiting") {
    const waitingResult = await sendBookingWaitingPaymentEmail(bookingPayload);
    console.log(`Waiting payment email result: ${waitingResult ? "OK" : "FAILED"}`);
  }

  if (mode === "all" || mode === "user-confirmed") {
    const confirmedResult = await sendBookingConfirmationEmail(bookingPayload);
    console.log(`Booking confirmation email result: ${confirmedResult ? "OK" : "FAILED"}`);
  }

  if (mode === "all" || mode === "owner-new-booking") {
    const ownerResult = await sendOwnerNewBookingEmail({
      ownerEmail,
      ownerName: "Chu san Test",
      bookerName: bookingPayload.bookerName,
      bookerEmail: bookingPayload.bookerEmail,
      bookerPhone: bookingPayload.bookerPhone,
      bookingCode: bookingPayload.bookingCode,
      clubName: bookingPayload.clubName,
      courtName: bookingPayload.courtName,
      slots: bookingPayload.slots,
      finalAmount: bookingPayload.finalAmount,
      paymentMethod: bookingPayload.paymentMethod,
    });
    console.log(`Owner new booking email result: ${ownerResult ? "OK" : "FAILED"}`);
  }

  console.log("=== BOOKING EMAIL FLOW TEST DONE ===");
}

main().catch((error) => {
  console.error("Booking email flow test failed:", error);
  process.exit(1);
});
