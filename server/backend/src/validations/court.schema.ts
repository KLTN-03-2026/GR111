import { z } from "zod";

// ============================================================
// COURT SEARCH SCHEMAS
// ============================================================

export const searchCourtSchema = z.object({
  keyword: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  sportType: z
    .enum(["FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL", "BASKETBALL", "VOLLEYBALL", "OTHER"])
    .optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

// ============================================================
// CLUB SCHEMAS (Owner)
// ============================================================

export const createClubSchema = z.object({
  name: z.string().min(3, "Tên CLB phải có ít nhất 3 ký tự").max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(5, "Địa chỉ không hợp lệ"),
  ward: z.string().optional(),
  district: z.string().min(1, "Vui lòng nhập quận/huyện"),
  city: z.string().min(1, "Vui lòng nhập thành phố"),
  phone: z.string().regex(/^(0|\+84)[0-9]{9}$/, "SĐT không hợp lệ").optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// ============================================================
// COURT SCHEMAS (Owner)
// ============================================================

export const createCourtSchema = z.object({
  name: z.string().min(1, "Tên sân không được để trống").max(100),
  description: z.string().max(1000).optional(),
  sportType: z.enum([
    "FOOTBALL", "BADMINTON", "TENNIS", "PICKLEBALL",
    "BASKETBALL", "VOLLEYBALL", "OTHER",
  ]),
  capacity: z.number().int().min(1).optional(),
  surface: z.string().max(100).optional(),
  indoorOutdoor: z.enum(["INDOOR", "OUTDOOR"]).optional(),
});

// ============================================================
// TYPES
// ============================================================

export type SearchCourtInput = z.infer<typeof searchCourtSchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
export type CreateCourtInput = z.infer<typeof createCourtSchema>;
