import jwt from "jsonwebtoken";
import { prisma } from "@/infra/db/prisma";

type BookingCancelSupportTokenPayload = {
  bookingId: string;
  bookingCode: string;
  bookerEmail?: string;
};

const BOOKING_CANCEL_SUPPORT_TOKEN_EXPIRES_IN =
  process.env.BOOKING_CANCEL_SUPPORT_TOKEN_EXPIRES_IN || "14d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET_MISSING");
  }
  return secret;
}

export function generateBookingCancelSupportToken(payload: BookingCancelSupportTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn:
      BOOKING_CANCEL_SUPPORT_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyBookingCancelSupportToken(
  token: string
): BookingCancelSupportTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as BookingCancelSupportTokenPayload;
  } catch {
    return null;
  }
}

export async function getBookingCancelSupportInfoByToken(token: string) {
  const payload = verifyBookingCancelSupportToken(token);

  if (!payload) {
    throw new Error("INVALID_CANCEL_SUPPORT_TOKEN");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    select: {
      bookingCode: true,
      status: true,
      club: {
        select: {
          name: true,
          address: true,
          phone: true,
          email: true,
          owner: {
            select: {
              fullName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!booking || booking.bookingCode !== payload.bookingCode) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (!booking.club) {
    throw new Error("CLUB_NOT_FOUND");
  }

  return {
    bookingCode: booking.bookingCode,
    bookingStatus: booking.status,
    club: {
      name: booking.club.name,
      address: booking.club.address,
      phone: booking.club.phone,
      email: booking.club.email,
    },
    owner: {
      fullName: booking.club.owner.fullName,
      phone: booking.club.owner.phone,
      email: booking.club.owner.email,
    },
  };
}
