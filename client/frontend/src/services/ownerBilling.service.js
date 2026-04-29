import api from '@/api/axios';

/** Đóng modal giới thiệu phí / không chọn gói */
export function dismissBillingIntro() {
  return api.patch('/owner/billing-intro', { action: 'dismiss' });
}

/**
 * Chọn gói Subscription Hybrid (ghi nhận nội bộ — thanh toán thực tế triển khai sau).
 * @param {{ planKey: string; addons?: string[] }} payload
 */
export function subscribeBillingPlan(payload) {
  return api.patch('/owner/billing-intro', {
    action: 'subscribe',
    planKey: payload.planKey,
    addons: payload.addons ?? [],
  });
}
