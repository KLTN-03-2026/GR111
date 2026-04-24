<template>
  <transition name="fade">
    <div
      v-if="show && booking"
      class="nbm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nbm-title"
      @click.self="$emit('close')"
    >
      <div class="nbm-panel">
        <div class="nbm-head">
          <div class="nbm-head-text">
            <div class="nbm-badge">
              <span class="material-icons">notifications_active</span>
              Đơn mới
            </div>
            <h2 id="nbm-title" class="nbm-title">Có đơn đặt sân mới</h2>
            <p class="nbm-sub">Khách vừa đặt sân trực tuyến. Kiểm tra chi tiết và xử lý thanh toán nếu cần.</p>
          </div>
          <button type="button" class="nbm-x" aria-label="Đóng" @click="$emit('close')">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="nbm-body">
          <div class="nbm-grid">
            <div class="nbm-field">
              <span class="nbm-label">Mã đơn</span>
              <span class="nbm-val mono">{{ booking.bookingCode || booking.id }}</span>
            </div>
            <div class="nbm-field">
              <span class="nbm-label">Trạng thái</span>
              <span class="nbm-val">{{ statusLabel }}</span>
            </div>
            <div class="nbm-field">
              <span class="nbm-label">Khách</span>
              <span class="nbm-val">{{ booking.bookerName || '—' }}</span>
            </div>
            <div class="nbm-field">
              <span class="nbm-label">Điện thoại</span>
              <span class="nbm-val">{{ booking.bookerPhone || '—' }}</span>
            </div>
            <div class="nbm-field">
              <span class="nbm-label">Thanh toán</span>
              <span class="nbm-val">{{ payLabel }}</span>
            </div>
            <div class="nbm-field">
              <span class="nbm-label">Tổng thanh toán</span>
              <span class="nbm-val nbm-money">{{ formatMoney(booking.finalAmount ?? booking.totalAmount) }}</span>
            </div>
            <div class="nbm-field span2">
              <span class="nbm-label">Sân &amp; khung giờ</span>
              <span class="nbm-val">{{ slotSummary }}</span>
            </div>
          </div>
        </div>

        <div class="nbm-foot">
          <button type="button" class="nbm-btn secondary" @click="$emit('close')">
            Đóng
          </button>
          <button type="button" class="nbm-btn primary" @click="$emit('view-detail', booking)">
            <span class="material-icons nbm-ico">open_in_new</span>
            Xem chi tiết đơn
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'NewBookingNotificationModal',
  props: {
    show: { type: Boolean, default: false },
    booking: { type: Object, default: null },
  },
  emits: ['close', 'view-detail'],
  computed: {
    statusLabel() {
      const s = this.booking?.status;
      const map = {
        WAITING_PAYMENT: 'Chờ thanh toán',
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy',
      };
      return map[s] || s || '—';
    },
    payLabel() {
      const m = this.booking?.payment?.method;
      const map = {
        BANK_TRANSFER: 'Chuyển khoản',
        MOMO: 'MoMo',
        VNPAY: 'VNPay',
        CREDIT_CARD: 'Thẻ',
        CASH: 'Tiền mặt',
      };
      return map[m] || m || '—';
    },
    slotSummary() {
      const items = this.booking?.items;
      if (!items?.length) return '—';
      const parts = items.map((it) => {
        const court = it.timeSlot?.court?.name || 'Sân';
        const st = it.timeSlot?.startTime;
        const en = it.timeSlot?.endTime;
        if (!st || !en) return court;
        const d0 = new Date(st);
        const d1 = new Date(en);
        const date = d0.toLocaleDateString('vi-VN');
        const t0 = d0.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        const t1 = d1.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${court} · ${date} ${t0} – ${t1}`;
      });
      return parts.join(' · ');
    },
  },
  methods: {
    formatMoney(v) {
      const n = Number(v ?? 0);
      return `${n.toLocaleString('vi-VN')}đ`;
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500;700&display=swap');

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.nbm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  background: rgba(15, 22, 35, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.nbm-panel {
  width: min(100%, 520px);
  max-height: min(92vh, 680px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(15, 22, 35, 0.18);
  border: 1px solid #eaecf2;
  font-family: 'DM Sans', sans-serif;
}

.nbm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 12px;
  border-bottom: 1px solid #eaecf2;
}

.nbm-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 6px 10px;
  border-radius: 999px;
  margin-bottom: 10px;
}
.nbm-badge .material-icons {
  font-size: 16px !important;
}

.nbm-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f1623;
  margin: 0 0 6px;
}

.nbm-sub {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.45;
}

.nbm-x {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.nbm-x:hover {
  background: #e2e8f0;
  color: #0f1623;
}

.nbm-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.nbm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.nbm-field.span2 {
  grid-column: 1 / -1;
}

.nbm-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9aa3bc;
  margin-bottom: 4px;
}

.nbm-val {
  font-size: 14px;
  font-weight: 600;
  color: #0f1623;
  line-height: 1.35;
}

.nbm-val.mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  word-break: break-all;
}

.nbm-money {
  color: #1d4ed8;
  font-size: 15px;
}

.nbm-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 20px 18px;
  border-top: 1px solid #eaecf2;
  background: #fafbfc;
}

.nbm-btn {
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.1s;
}

.nbm-btn.secondary {
  background: #fff;
  border: 1px solid #eaecf2;
  color: #475569;
}
.nbm-btn.secondary:hover {
  background: #f8fafc;
}

.nbm-btn.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}
.nbm-btn.primary:hover {
  transform: translateY(-1px);
}

.nbm-ico {
  font-size: 18px !important;
}

@media (max-width: 520px) {
  .nbm-grid {
    grid-template-columns: 1fr;
  }
  .nbm-field.span2 {
    grid-column: 1;
  }
}
</style>
