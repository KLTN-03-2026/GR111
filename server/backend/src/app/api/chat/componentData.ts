type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeGetClubDetails(result: unknown): unknown {
  if (!isRecord(result)) return result;
  const todayHours = isRecord(result.todayHours) ? result.todayHours : null;

  return {
    ...result,
    openTime:
      typeof result.openTime === "string"
        ? result.openTime
        : (todayHours?.openTime as string | undefined) ?? null,
    closeTime:
      typeof result.closeTime === "string"
        ? result.closeTime
        : (todayHours?.closeTime as string | undefined) ?? null,
  };
}

function normalizeGetAvailableSlots(result: unknown): unknown {
  if (!isRecord(result)) return result;
  const courtsSource =
    Array.isArray(result.courts) && result.courts.length
      ? result.courts
      : Array.isArray(result.alternatives)
        ? [
          {
            courtId: "alternatives",
            courtName: "Gợi ý giờ gần nhất",
            slots: result.alternatives,
          },
        ]
        : (isRecord(result.slot)
          ? [
            {
              courtId: result.slot.courtId ?? "single-slot",
              courtName: result.slot.courtName ?? "Khung giờ phù hợp",
              slots: [result.slot],
            },
          ]
          : []);

  return {
    ...result,
    courts: courtsSource.map((court) => {
      if (!isRecord(court)) return court;
      const slots = Array.isArray(court.slots) ? court.slots : [];

      return {
        ...court,
        name: typeof court.name === "string" ? court.name : court.courtName,
        slots: slots.map((slot) => {
          if (!isRecord(slot)) return slot;
          return {
            ...slot,
            start:
              typeof slot.start === "string"
                ? slot.start
                : slot.startTimeDisplay,
            end:
              typeof slot.end === "string"
                ? slot.end
                : slot.endTimeDisplay,
          };
        }),
      };
    }),
  };
}

function normalizeGetUserBookings(result: unknown): unknown {
  if (!Array.isArray(result)) return result;

  return result.map((booking) => {
    if (!isRecord(booking)) return booking;
    return {
      ...booking,
      code:
        typeof booking.code === "string"
          ? booking.code
          : booking.bookingCode,
      club:
        typeof booking.club === "string"
          ? booking.club
          : booking.clubName,
      time:
        typeof booking.time === "string"
          ? booking.time
          : booking.startTime,
    };
  });
}

function normalizeCreateBooking(result: unknown): unknown {
  if (!isRecord(result)) return result;
  return {
    ...result,
    amount:
      typeof result.amount === "number"
        ? result.amount
        : result.finalAmount,
  };
}

export function normalizeToolResultForComponent(
  toolName: string,
  result: unknown
): unknown {
  switch (toolName) {
    case "getClubDetails":
      return normalizeGetClubDetails(result);
    case "getAvailableSlots":
    case "checkSlotAvailability":
      return normalizeGetAvailableSlots(result);
    case "getUserBookings":
      return normalizeGetUserBookings(result);
    case "createBooking":
      return normalizeCreateBooking(result);
    default:
      return result;
  }
}
