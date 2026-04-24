/**
 * Ngày/giờ nghiệp vụ theo Asia/Ho_Chi_Minh (đặt sân VN).
 * Tránh Date#setHours theo TZ server (thường UTC) và toISOString().slice(0,10) (UTC date).
 */
export const VN_TZ = "Asia/Ho_Chi_Minh";

/** YYYY-MM-DD hiện tại theo lịch Việt Nam */
export function todayYmdVietnam(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** YYYY-MM-DD của một mốc UTC (để hiển thị / so khớp ngày đặt) */
export function vnYmdFromInstant(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Mốc giữa ngày — dùng để lấy thứ (openingHours) khớp lịch VN */
export function vnNoonAnchor(ymd: string): Date {
  return new Date(`${ymd}T12:00:00.000+07:00`);
}

/**
 * Ghép ngày đặt (YYYY-MM-DD) với cột @db.Time từ Prisma
 * (thường là 1970-01-01T{HH}:{mm}:{ss}.000Z — lấy getUTC* làm giờ cửa hàng VN).
 */
export function vnDateTimeFromYmdAndDbTime(ymd: string, timeOfDay: Date): Date {
  const h = timeOfDay.getUTCHours();
  const m = timeOfDay.getUTCMinutes();
  const s = timeOfDay.getUTCSeconds();
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(`${ymd}T${pad(h)}:${pad(m)}:${pad(s)}.000+07:00`);
}

export function vnDayRange(ymd: string): { start: Date; end: Date } {
  return {
    start: new Date(`${ymd}T00:00:00.000+07:00`),
    end: new Date(`${ymd}T23:59:59.999+07:00`),
  };
}

/** Giờ và phút theo lịch Việt Nam (hiển thị khung giờ) */
export function vnHourAndMinute(d: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  return {
    hour: parseInt(parts.find((p) => p.type === "hour")!.value, 10),
    minute: parseInt(parts.find((p) => p.type === "minute")!.value, 10),
  };
}

/** Giờ 0–23 và thứ (0=Chủ nhật … 6=Thứ bảy) theo lịch Việt Nam */
export function vnHourAndDayOfWeek(d: Date): { hour: number; dayOfWeek: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VN_TZ,
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const wd = parts.find((p) => p.type === "weekday")!.value;
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return { hour, dayOfWeek: map[wd] ?? 0 };
}
