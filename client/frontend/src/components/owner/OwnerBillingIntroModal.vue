<template>
  <Teleport to="body">
    <transition name="obi-fade">
      <div
        v-if="show"
        class="obi-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="obi-title"
      >
        <div class="obi-modal">
          <button type="button" class="obi-close" :aria-label="exitWithoutSaving ? 'Đóng' : 'Để sau'" @click="onCloseClick">
            <span class="material-icons">close</span>
          </button>

          <div class="obi-head">
            <div class="obi-icon-wrap">
              <span class="material-icons">payments</span>
            </div>
            <h2 id="obi-title">Phí duy trì và định hướng gói</h2>
            <p class="obi-lead">
              <template v-if="exitWithoutSaving">
                Xem lại hoặc thay đổi <strong>gói Subscription</strong> và add-on đã đăng ký. Thanh toán định kỳ vẫn theo
                hướng dẫn tại mục Cài đặt.
              </template>
              <template v-else>
                Chào mừng bạn đến khu vực chủ sân. Dưới đây là các hình thức duy trì hệ thống — bạn có thể chọn gói
                Subscription (Hybrid) ngay hoặc đọc trước và quay lại sau.
              </template>
            </p>
          </div>

          <!-- 1. Commission — chỉ hiển thị -->
          <section class="obi-section">
            <div class="obi-section-label">
              <span class="material-icons">percent</span>
              1. Hoa hồng theo đơn (đang áp dụng pilot)
            </div>
            <div class="obi-commission-card">
              <p>
                Trên mỗi <strong>đơn đặt sân thanh toán qua nền tảng</strong>, hệ thống áp dụng mức phí theo tỷ lệ khoảng
                <strong>8–10%</strong> (tùy chương trình). Chi tiết đối soát &amp; kỳ thanh toán sẽ được thông báo trong
                phần Tài chính sau khi tích hợp đầy đủ.
              </p>
              <span class="obi-badge-muted">Chưa bật logic tự động — chỉ hiển thị minh bạch</span>
            </div>
          </section>

          <!-- 2. Hybrid — chọn gói -->
          <section class="obi-section">
            <div class="obi-section-label">
              <span class="material-icons">subscriptions</span>
              2. Hybrid — thanh toán theo gói Subscription (đăng ký nội bộ)
            </div>
            <p class="obi-hint">
              Chọn một gói phù hợp quy mô CLB. Thanh toán định kỳ qua chuyển khoản / cổng thanh toán sẽ được kết nối ở
              bản cập nhật sau; hiện hệ thống chỉ <strong>ghi nhận lựa chọn của bạn</strong>.
            </p>

            <div class="obi-plans">
              <label
                v-for="p in plans"
                :key="p.key"
                class="obi-plan"
                :class="{ active: selectedPlan === p.key }"
              >
                <input v-model="selectedPlan" type="radio" name="obi-plan" :value="p.key" />
                <div class="obi-plan-inner">
                  <div class="obi-plan-top">
                    <span class="obi-plan-name">{{ p.name }}</span>
                    <span class="obi-plan-price">{{ formatVnd(p.price) }}<small>/tháng</small></span>
                  </div>
                  <ul class="obi-plan-feat">
                    <li v-for="(f, i) in p.features" :key="i">{{ f }}</li>
                  </ul>
                </div>
              </label>
            </div>

            <div class="obi-addons">
              <div class="obi-addons-title">
                <span class="material-icons">extension</span>
                Add-on (tuỳ chọn)
              </div>
              <label v-for="a in addons" :key="a.id" class="obi-addon">
                <input v-model="selectedAddons" type="checkbox" :value="a.id" />
                <span>{{ a.label }}</span>
                <span class="obi-addon-price">+{{ formatVnd(a.extra) }}/tháng</span>
              </label>
            </div>
          </section>

          <!-- 3. Chiến lược -->
          <section class="obi-section obi-strategy">
            <div class="obi-section-label">
              <span class="material-icons">trending_up</span>
              3. Định hướng: Subscription + Add-on
            </div>
            <p>
              Nền tảng đang chuyển dần sang mô hình <strong>ổn định dòng tiền</strong> qua gói cố định và add-on, đồng
              thời <strong>giảm phụ thuộc vào hoa hồng thuần theo đơn</strong>. Bạn có thể kết hợp cả hai trong giai đoạn
              chuyển tiếp (Hybrid).
            </p>
          </section>

          <div class="obi-actions">
            <button type="button" class="obi-btn secondary" :disabled="loading" @click="onSecondaryClick">
              {{ exitWithoutSaving ? 'Đóng' : 'Để sau' }}
            </button>
            <button type="button" class="obi-btn primary" :disabled="loading || !selectedPlan" @click="onSubscribe">
              <span v-if="loading" class="material-icons obi-spin">hourglass_top</span>
              Xác nhận gói đã chọn
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
import { dismissBillingIntro, subscribeBillingPlan } from '@/services/ownerBilling.service';

export default {
  name: 'OwnerBillingIntroModal',
  props: {
    show: { type: Boolean, default: false },
    /** Khi true (mở từ Cài đặt): nút Đóng / X không gọi API dismiss */
    exitWithoutSaving: { type: Boolean, default: false },
    initialPlanKey: { type: String, default: null },
    initialAddons: { type: Array, default: () => [] },
  },
  emits: ['completed'],
  data() {
    return {
      loading: false,
      selectedPlan: 'growth',
      selectedAddons: [],
      plans: [
        {
          key: 'starter',
          name: 'Starter',
          price: 299000,
          features: ['Tối đa 3 sân hiển thị', 'Đặt sân & thông báo cơ bản', 'Hỗ trợ email'],
        },
        {
          key: 'growth',
          name: 'Growth',
          price: 599000,
          features: ['Không giới hạn sân trong CLB', 'Ưu tiên hiển thị trong khu vực', 'Voucher & khuyến mãi nâng cao'],
        },
        {
          key: 'pro',
          name: 'Pro',
          price: 1299000,
          features: ['API / Báo cáo nâng cao', 'Nhiều chi nhánh', 'SLA hỗ trợ'],
        },
      ],
      addons: [
        { id: 'advanced_reports', label: 'Báo cáo & export nâng cao', extra: 150000 },
        { id: 'priority_support', label: 'Ưu tiên hỗ trợ kỹ thuật', extra: 99000 },
        { id: 'sms_reminders', label: 'Nhắc lịch SMS cho khách', extra: 190000 },
      ],
    };
  },
  watch: {
    show(val) {
      if (!val) return;
      this.syncFromInitial();
    },
  },
  methods: {
    syncFromInitial() {
      if (this.initialPlanKey && ['starter', 'growth', 'pro'].includes(this.initialPlanKey)) {
        this.selectedPlan = this.initialPlanKey;
      } else {
        this.selectedPlan = 'growth';
      }
      this.selectedAddons = Array.isArray(this.initialAddons) ? [...this.initialAddons] : [];
    },
    onCloseClick() {
      if (this.exitWithoutSaving) {
        this.$emit('completed', { type: 'cancel' });
        return;
      }
      this.onDismiss();
    },
    onSecondaryClick() {
      if (this.exitWithoutSaving) {
        this.$emit('completed', { type: 'cancel' });
        return;
      }
      this.onDismiss();
    },
    formatVnd(n) {
      try {
        return new Intl.NumberFormat('vi-VN').format(n);
      } catch {
        return String(n);
      }
    },
    async onDismiss() {
      this.loading = true;
      try {
        await dismissBillingIntro();
        this.$emit('completed', { type: 'dismiss' });
      } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || 'Không lưu được. Vui lòng thử lại.');
      } finally {
        this.loading = false;
      }
    },
    async onSubscribe() {
      if (!this.selectedPlan) return;
      this.loading = true;
      try {
        await subscribeBillingPlan({
          planKey: this.selectedPlan,
          addons: [...this.selectedAddons],
        });
        this.$emit('completed', { type: 'subscribe', planKey: this.selectedPlan, addons: [...this.selectedAddons] });
      } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || 'Không lưu được gói. Vui lòng thử lại.');
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.obi-overlay {
  position: fixed;
  inset: 0;
  z-index: 12000;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
}

.obi-modal {
  position: relative;
  width: min(560px, 100%);
  margin: 32px auto;
  background: #fff;
  border-radius: 22px;
  padding: 28px 26px 22px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2);
  border: 1px solid #e2e8f0;
}

.obi-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 11px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.obi-close:hover {
  background: #e2e8f0;
}

.obi-head {
  text-align: center;
  padding-right: 28px;
  margin-bottom: 18px;
}

.obi-icon-wrap {
  width: 52px;
  height: 52px;
  margin: 0 auto 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
}
.obi-icon-wrap .material-icons {
  font-size: 28px;
}

.obi-head h2 {
  margin: 0 0 8px;
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.obi-lead {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.55;
}

.obi-section {
  margin-bottom: 18px;
}

.obi-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #059669;
  margin-bottom: 10px;
}
.obi-section-label .material-icons {
  font-size: 18px;
}

.obi-commission-card {
  background: #f8fafc;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  font-size: 13px;
  color: #475569;
  line-height: 1.55;
}

.obi-commission-card p {
  margin: 0 0 10px;
}

.obi-badge-muted {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: #fff;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px dashed #cbd5e1;
}

.obi-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.obi-plans {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.obi-plan {
  cursor: pointer;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.obi-plan:hover {
  border-color: #a7f3d0;
}
.obi-plan.active {
  border-color: #059669;
  box-shadow: 0 0 0 1px rgba(5, 150, 105, 0.25);
}

.obi-plan input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.obi-plan-inner {
  padding: 14px 16px;
}

.obi-plan-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.obi-plan-name {
  font-weight: 800;
  font-size: 15px;
  color: #0f172a;
}

.obi-plan-price {
  font-weight: 800;
  font-size: 15px;
  color: #059669;
  white-space: nowrap;
}
.obi-plan-price small {
  font-weight: 600;
  font-size: 12px;
  color: #64748b;
}

.obi-plan-feat {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}

.obi-addons {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.obi-addons-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 10px;
}
.obi-addons-title .material-icons {
  font-size: 18px;
  color: #059669;
}

.obi-addon {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
  cursor: pointer;
}

.obi-addon input {
  accent-color: #059669;
}

.obi-addon span:first-of-type {
  flex: 1;
}

.obi-addon-price {
  font-size: 12px;
  font-weight: 700;
  color: #059669;
}

.obi-strategy {
  background: #f0fdf4;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid #bbf7d0;
}

.obi-strategy p {
  margin: 0;
  font-size: 13px;
  color: #166534;
  line-height: 1.55;
}

.obi-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.obi-btn {
  flex: 1;
  min-height: 48px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.obi-btn.secondary {
  background: #f1f5f9;
  color: #334155;
}
.obi-btn.secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.obi-btn.primary {
  background: #059669;
  color: #fff;
}
.obi-btn.primary:hover:not(:disabled) {
  background: #047857;
}

.obi-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.obi-spin {
  animation: obi-spin 0.9s linear infinite;
}

@keyframes obi-spin {
  to {
    transform: rotate(360deg);
  }
}

.obi-fade-enter-active,
.obi-fade-leave-active {
  transition: opacity 0.2s ease;
}
.obi-fade-enter-from,
.obi-fade-leave-to {
  opacity: 0;
}
</style>
