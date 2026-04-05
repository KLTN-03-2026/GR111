import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middlewares/auth.middleware";
import { getClubCustomers, addCustomerByPhone } from "@/modules/crm/club-customer.service";
import { addCustomerByPhoneSchema } from "@/validations/owner.schema";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/**
 * GET /api/owner/clubs/[clubId]/customers
 * Lấy danh sách khách hàng của một CLB (Chỉ dành cho Owner CLB đó)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleCheck = requireRole(user, ["OWNER", "ADMIN"]);
    if (roleCheck) return roleCheck;

    const { clubId } = await params;

    const customers = await getClubCustomers(clubId, user.userId);
    
    return successResponse("Lấy danh sách khách hàng thành công", customers);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "CLUB_NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse("Bạn không có quyền truy cập dữ liệu của CLB này", 403);
    }
    return serverErrorResponse(error);
  }
}

/**
 * POST /api/owner/clubs/[clubId]/customers
 * Thêm khách hàng thủ công vào CLB bằng số điện thoại
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;

    const roleCheck = requireRole(user, ["OWNER", "ADMIN"]);
    if (roleCheck) return roleCheck;

    const { clubId } = await params;
    const body = await req.json();

    const parsed = addCustomerByPhoneSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Dữ liệu không hợp lệ",
        422,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const newCustomer = await addCustomerByPhone(clubId, parsed.data.phone, user.userId);
    return successResponse("Thêm khách hàng thành công", newCustomer, 201);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "CLUB_NOT_FOUND_OR_UNAUTHORIZED")
        return errorResponse("Bạn không có quyền thực hiện thao tác này", 403);
      if (error.message === "USER_NOT_FOUND")
        return errorResponse("Không tìm thấy tài khoản với số điện thoại này", 404);
      if (error.message === "CUSTOMER_ALREADY_EXISTS")
        return errorResponse("Khách hàng này đã có trong danh sách của CLB", 409);
    }
    return serverErrorResponse(error);
  }
}

