/**
 * Chuỗi YYYY-MM-DD cho <input type="date"> theo lịch local của trình duyệt.
 * Không dùng Date#toISOString() vì đó là UTC và dễ lệch một ngày so với người dùng.
 */
export function formatDateInputLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD theo Asia/Ho_Chi_Minh (khớp logic đặt sân trên server) */
export function formatYmdVietnam(input) {
  const date = input instanceof Date ? input : new Date(input);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
