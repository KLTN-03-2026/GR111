import { z } from "zod";
import { CustomerTier } from "@/generated/prisma";

export const updateCustomerSchema = z.object({
  tier: z.nativeEnum(CustomerTier).optional(),
  notes: z.string().max(1000, "Ghi chú không được quá 1000 ký tự").optional(),
});

export const addCustomerByPhoneSchema = z.object({
  phone: z
    .string()
    .min(9, "Số điện thoại không hợp lệ")
    .max(15, "Số điện thoại không hợp lệ")
    .regex(/^[0-9+]+$/, "Số điện thoại chỉ được chứa chữ số"),
});
