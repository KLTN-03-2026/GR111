import { NextRequest } from "next/server";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { getProvinceDetail } from "@/modules/vn-address/vn-address.service";

/**
 * GET /api/vn/address/provinces/[slug]
 * Quận/huyện & phường/xã theo một tỉnh (slug = codename open-api, VD: thanh_pho_da_nang).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return errorResponse("Thiếu slug tỉnh", 400);
    }

    const data = await getProvinceDetail(decodeURIComponent(slug));
    if (!data) {
      return errorResponse("Không tìm thấy tỉnh thành", 404);
    }

    return successResponse("Chi tiết đơn vị hành chính", data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("provinces.open-api")) {
      return errorResponse(
        "Không thể tải dữ liệu địa giới từ nguồn công khai. Thử lại sau.",
        502
      );
    }
    return serverErrorResponse(e);
  }
}
