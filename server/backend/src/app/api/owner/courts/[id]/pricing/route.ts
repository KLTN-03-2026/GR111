import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middlewares/auth.middleware";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { 
  getCourtPricings, 
  addRegularPricing, 
  upsertSpecialPricing, 
  deletePricing 
} from "@/modules/club/court.service";
import { z } from "zod";

/**
 * GET /api/owner/courts/[id]/pricing
 * Lấy tất cả bảng giá của sân
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { user, error } = await getAuthUser(req);
        if (error) return error;

        const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
        if (roleErr) return roleErr;

        const data = await getCourtPricings(id, user.userId);
        return successResponse("Tải bảng giá thành công", data);
    } catch (error: unknown) {
        return serverErrorResponse(error);
    }
}

/**
 * POST /api/owner/courts/[id]/pricing
 * Thêm bảng giá định kỳ
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { user, error } = await getAuthUser(req);
        if (error) return error;

        const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
        if (roleErr) return roleErr;

        const body = await req.json();
        
        // Validation for single regular pricing item
        const itemSchema = z.object({
            id: z.string().optional().nullable(),
            dayOfWeek: z.number().int().min(0).max(6).nullable(),
            startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Giờ bắt đầu không hợp lệ"),
            endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Giờ kết thúc không hợp lệ"),
            pricePerHour: z.number().positive(),
            label: z.string().optional()
        });

        const parsed = itemSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse("Dữ liệu không hợp lệ", 422, (parsed.error.flatten().fieldErrors as unknown) as Record<string, string[]>);
        }

        // We clean HH:mm:ss to HH:mm for the service
        const cleanData = {
            ...parsed.data,
            startTime: parsed.data.startTime.substring(0, 5),
            endTime: parsed.data.endTime.substring(0, 5)
        };

        const data = await addRegularPricing(id, user.userId, cleanData);
        return successResponse(cleanData.id ? "Cập nhật giá định kỳ thành công" : "Thêm giá định kỳ thành công", data);
    } catch (error: unknown) {
        const err = error as Error;
        if (err.message?.includes("OVERLAP")) {
          return errorResponse(err.message, 400);
        }
        return serverErrorResponse(error);
    }
}

/**
 * PUT /api/owner/courts/[id]/pricing
 * Thêm/Cập nhật bảng giá đặc biệt
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { user, error } = await getAuthUser(req);
        if (error) return error;

        const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
        if (roleErr) return roleErr;

        const body = await req.json();
        
        // Validation for single special pricing item
        const specialSchema = z.object({
            id: z.string().optional().nullable(),
            specificDate: z.string(),
            startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Giờ bắt đầu không hợp lệ"),
            endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, "Giờ kết thúc không hợp lệ"),
            pricePerHour: z.number().positive(),
            note: z.string().optional()
        });

        const parsed = specialSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse("Dữ liệu không hợp lệ", 422, (parsed.error.flatten().fieldErrors as unknown) as Record<string, string[]>);
        }

        const cleanData = {
            ...parsed.data,
            startTime: parsed.data.startTime.substring(0, 5),
            endTime: parsed.data.endTime.substring(0, 5)
        };

        const data = await upsertSpecialPricing(id, user.userId, cleanData);
        return successResponse(cleanData.id ? "Cập nhật giá đặc biệt thành công" : "Thêm giá đặc biệt thành công", data);
    } catch (error: unknown) {
        const err = error as Error;
        if (err.message?.includes("OVERLAP")) {
          return errorResponse(err.message, 400);
        }
        return serverErrorResponse(error);
    }
}

/**
 * DELETE /api/owner/courts/[id]/pricing
 * Xóa một cấu hình giá
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { user, error } = await getAuthUser(req);
        if (error) return error;

        const roleErr = requireRole(user, ["OWNER", "ADMIN"]);
        if (roleErr) return roleErr;

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") as 'regular' | 'special';
        const pricingId = searchParams.get("id");

        if (!type || !pricingId) {
            return errorResponse("Thiếu thông tin xóa", 400);
        }

        await deletePricing(type, pricingId, user.userId);
        return successResponse(`Xóa giá ${type} thành công (Court: ${id})`, null);
    } catch (error: unknown) {
        return serverErrorResponse(error);
    }
}
