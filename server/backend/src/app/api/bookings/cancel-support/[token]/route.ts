import { NextRequest } from "next/server";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { getBookingCancelSupportInfoByToken } from "@/modules/booking/booking-cancel-support";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const data = await getBookingCancelSupportInfoByToken(token);
    return successResponse("Lấy thông tin liên hệ hủy đơn thành công", data);
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CANCEL_SUPPORT_TOKEN") {
      return errorResponse("Liên kết không hợp lệ hoặc đã hết hạn", 400);
    }

    if (
      err instanceof Error &&
      (err.message === "BOOKING_NOT_FOUND" || err.message === "CLUB_NOT_FOUND")
    ) {
      return errorResponse("Không tìm thấy thông tin đơn đặt sân", 404);
    }

    return serverErrorResponse(err);
  }
}
