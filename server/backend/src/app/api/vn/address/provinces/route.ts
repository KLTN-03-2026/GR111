import { successResponse, serverErrorResponse } from "@/lib/response";
import { listAllProvinces } from "@/modules/vn-address/vn-address.service";

/**
 * GET /api/vn/address/provinces
 * 63 tỉnh/thành (provinces.open-api.vn).
 */
export async function GET() {
  try {
    const data = await listAllProvinces();
    return successResponse("Danh sách tỉnh thành", data);
  } catch (e: unknown) {
    return serverErrorResponse(e);
  }
}
