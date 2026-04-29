import { NextRequest } from "next/server";
import { getAuthUser, requireRole } from "@/middleware/auth.middleware";
import { saveOwnerBillingIntro } from "@/modules/admin/owner.service";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

/** PATCH /api/owner/billing-intro — đóng modal hoặc chọn gói Subscription Hybrid */
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);
    if (error) return error;
    const roleError = requireRole(user, ["OWNER"]);
    if (roleError) return roleError;

    const body = (await req.json()) as {
      action?: string;
      planKey?: string;
      addons?: string[];
    };

    if (body.action === "dismiss") {
      const row = await saveOwnerBillingIntro(user.userId, { action: "dismiss" });
      return successResponse("Đã lưu.", {
        billingIntroDismissedAt: row.billingIntroDismissedAt,
        subscriptionPlanKey: row.subscriptionPlanKey,
        subscriptionAddons: row.subscriptionAddons,
      });
    }

    if (body.action === "subscribe") {
      const row = await saveOwnerBillingIntro(user.userId, {
        action: "subscribe",
        planKey: body.planKey ?? "",
        addons: body.addons,
      });
      return successResponse("Đã đăng ký gói (ghi nhận nội bộ).", {
        billingIntroDismissedAt: row.billingIntroDismissedAt,
        subscriptionPlanKey: row.subscriptionPlanKey,
        subscriptionAddons: row.subscriptionAddons,
      });
    }

    return errorResponse("Thiếu action hợp lệ (dismiss | subscribe).", 422);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_PLAN_KEY") {
      return errorResponse("Gói không hợp lệ (starter | growth | pro).", 422);
    }
    return serverErrorResponse(e);
  }
}
