import { NextRequest } from "next/server";
import { getAuthUser } from "@/middlewares/auth.middleware";
import { getBookingByCode } from "@/modules/booking/booking.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

// GET /api/bookings/[code] — Lấy chi tiết booking theo bookingCode
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const { code } = await params;
    const booking = await getBookingByCode(code, user.userId);

    if (!booking) {
      return errorResponse("Không tìm thấy đơn đặt sân", 404);
    }

    return successResponse("Lấy thông tin đơn đặt sân thành công", booking);
  } catch (err) {
    return serverErrorResponse(err);
  }
}
