/** Kiểm tra mọi sân trong đơn đều nằm trong danh sách được phép (kể cả giới hạn 1 sân). */
export function voucherAllowsBookingCourts(
  applicableCourts: { courtId: string }[],
  bookingCourtIds: string[]
): boolean {
  if (applicableCourts.length === 0) return true;
  const allowed = new Set(applicableCourts.map((r) => r.courtId));
  const uniq = [...new Set(bookingCourtIds)];
  return uniq.length > 0 && uniq.every((id) => allowed.has(id));
}
