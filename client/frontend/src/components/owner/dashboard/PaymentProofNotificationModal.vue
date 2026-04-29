<template>
  <transition name="fade">
    <div
      v-if="show && booking"
      class="ppm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ppm-title"
      @click.self="$emit('close')"
    >
      <div class="ppm-panel">
        <div class="ppm-head">
          <div class="ppm-head-text">
            <h2 id="ppm-title" class="ppm-title">Xác nhận chuyển khoản</h2>
            <p class="ppm-sub">Khách đã gửi minh chứng thanh toán. Kiểm tra thông tin và ảnh trước khi xác nhận.</p>
          </div>
          <button type="button" class="ppm-x" aria-label="Đóng" @click="$emit('close')">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="ppm-body">
          <div class="ppm-grid">
            <div class="ppm-field">
              <span class="ppm-label">Mã đơn</span>
              <span class="ppm-val mono">{{ booking.bookingCode || booking.id }}</span>
            </div>
            <div class="ppm-field">
              <span class="ppm-label">Khách</span>
              <span class="ppm-val">{{ booking.bookerName || '—' }}</span>
            </div>
            <div class="ppm-field">
              <span class="ppm-label">Điện thoại</span>
              <span class="ppm-val">{{ booking.bookerPhone || '—' }}</span>
            </div>
            <div class="ppm-field">
              <span class="ppm-label">Số tiền</span>
              <span class="ppm-val ppm-money">{{ formatMoney(booking.finalAmount ?? booking.totalAmount) }}</span>
            </div>
            <div class="ppm-field span2">
              <span class="ppm-label">Sân &amp; khung giờ</span>
              <span class="ppm-val">{{ slotSummary }}</span>
            </div>
          </div>

          <div class="ppm-proof">
            <span class="ppm-label">Ảnh minh chứng chuyển khoản</span>
            <div v-if="proofUrl" class="ppm-img-wrap">
              <a :href="proofUrl" target="_blank" rel="noopener noreferrer" class="ppm-img-link">
                <img :src="proofUrl" alt="Minh chứng chuyển khoản" class="ppm-img" />
                <span class="ppm-zoom"><span class="material-icons">open_in_new</span> Mở ảnh gốc</span>
              </a>
            </div>
            <p v-else class="ppm-no-proof">Chưa có ảnh minh chứng.</p>
          </div>
        </div>

        <div class="ppm-foot">
          <button type="button" class="ppm-btn secondary" :disabled="confirming" @click="$emit('close')">
            Đóng
          </button>
          <button
            type="button"
            class="ppm-btn primary"
            :disabled="confirming || !proofUrl"
            @click="$emit('confirm', booking)"
          >
            <span v-if="confirming" class="ppm-spin" aria-hidden="true"></span>
            <span v-else class="material-icons ppm-ico">verified</span>
            {{ confirming ? 'Đang xử lý…' : 'Xác nhận đã nhận chuyển khoản' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'PaymentProofNotificationModal',
  props: {
    show: { type: Boolean, default: false },
    booking: { type: Object, default: null },
    confirming: { type: Boolean, default: false },
  },
  emits: ['close', 'confirm'],
  computed: {
    proofUrl() {
      return this.booking?.payment?.proofImageUrl || '';
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

.ppm-overlay {
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

.ppm-panel {
  width: min(100%, 520px);
  max-height: min(92vh, 720px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(15, 22, 35, 0.18);
  border: 1px solid #eaecf2;
  font-family: 'DM Sans', sans-serif;
}

.ppm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 12px;
  border-bottom: 1px solid #eaecf2;
}

.ppm-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f1623;
  margin: 0 0 6px;
}

.ppm-sub {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.45;
}

.ppm-x {
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
.ppm-x:hover {
  background: #e2e8f0;
  color: #0f1623;
}

.ppm-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.ppm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin-bottom: 18px;
}

.ppm-field.span2 {
  grid-column: 1 / -1;
}

.ppm-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9aa3bc;
  margin-bottom: 4px;
}

.ppm-val {
  font-size: 14px;
  font-weight: 600;
  color: #0f1623;
  line-height: 1.35;
}

.ppm-val.mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  word-break: break-all;
}

.ppm-money {
  color: #059669;
  font-size: 15px;
}

.ppm-proof {
  margin-top: 4px;
}

.ppm-img-wrap {
  margin-top: 10px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #eaecf2;
  background: #f8fafc;
}

.ppm-img-link {
  display: block;
  position: relative;
  text-decoration: none;
  color: inherit;
}

.ppm-img {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  display: block;
  background: #0f1623;
}

.ppm-zoom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 12px;
  background: rgba(15, 22, 35, 0.82);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ppm-zoom .material-icons {
  font-size: 16px !important;
}

.ppm-no-proof {
  margin: 10px 0 0;
  font-size: 14px;
  color: #94a3b8;
}

.ppm-foot {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 20px 18px;
  border-top: 1px solid #eaecf2;
  background: #fafbfc;
}

.ppm-btn {
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
  transition: opacity 0.15s, transform 0.1s;
}

.ppm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ppm-btn.secondary {
  background: #fff;
  border: 1px solid #eaecf2;
  color: #475569;
}
.ppm-btn.secondary:hover:not(:disabled) {
  background: #f8fafc;
}

.ppm-btn.primary {
  background: #059669;
  color: #fff;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.28);
}
.ppm-btn.primary:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.ppm-ico {
  font-size: 18px !important;
}

.ppm-spin {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ppm-spin 0.7s linear infinite;
}

@keyframes ppm-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .ppm-grid {
    grid-template-columns: 1fr;
  }
  .ppm-field.span2 {
    grid-column: 1;
  }
}
</style>
