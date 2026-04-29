<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-icon-wrap">
            <span class="material-icons modal-icon">add_location_alt</span>
          </div>
          <div>
            <h3 class="modal-title">Đặt sân hộ khách</h3>
            <p class="modal-subtitle">Đặt thủ công tại quầy (offline)</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <span class="material-icons">close</span>
        </button>
      </div>

      <form @submit.prevent="submitForm" class="modal-body">
        <!-- Thông tin khách -->
        <div class="section-label">
          <span class="material-icons section-icon">person</span> Thông tin khách hàng
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Tên khách hàng <span class="required">*</span></label>
            <input
              type="text"
              v-model="form.bookerName"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
          <div class="form-group">
            <label>Số điện thoại <span class="required">*</span></label>
            <input
              type="tel"
              v-model="form.bookerPhone"
              placeholder="0901234567"
              required
              pattern="[0-9]{10,11}"
            />
          </div>
        </div>

        <!-- Thông tin sân -->
        <div class="section-label">
          <span class="material-icons section-icon">sports_soccer</span> Thông tin sân & giờ
        </div>
        <div class="form-group">
          <label>Chọn sân <span class="required">*</span></label>
          <select v-model="form.courtId" required @change="onCourtChange">
            <option value="" disabled>-- Chọn sân --</option>
            <option v-for="court in courts" :key="court.id" :value="court.id">
              {{ court.name }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Ngày đặt <span class="required">*</span></label>
            <input type="date" v-model="form.date" required :min="today" />
          </div>
          <div class="form-group">
            <label>Giờ bắt đầu <span class="required">*</span></label>
            <select v-model="form.startHour" required>
              <option value="" disabled>-- Chọn giờ --</option>
              <option v-for="h in availableHours" :key="h" :value="h">
                {{ String(h).padStart(2,'0') }}:00
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Số slot <span class="required">*</span></label>
            <select v-model.number="form.slotCount">
              <option :value="1">1 slot ({{ slotDurationText }})</option>
              <option :value="2">2 slots ({{ slotDuration * 2 }} phút)</option>
              <option :value="3">3 slots ({{ slotDuration * 3 }} phút)</option>
              <option :value="4">4 slots ({{ slotDuration * 4 }} phút)</option>
            </select>
          </div>
        </div>

        <!-- Thời gian kết thúc tính tự động -->
        <div v-if="form.startHour !== '' && form.slotCount" class="time-preview">
          <span class="material-icons preview-icon">schedule</span>
          <span>Khung giờ: <strong>{{ timePreview }}</strong></span>
        </div>

        <!-- Thanh toán -->
        <div class="section-label">
          <span class="material-icons section-icon">payments</span> Thanh toán
        </div>
        <div class="pay-options">
          <label class="pay-option" :class="{ active: form.isPaid === true }">
            <input type="radio" :value="true" v-model="form.isPaid" />
            <div class="pay-option-body">
              <span class="material-icons pay-icon">check_circle</span>
              <div>
                <p class="pay-title">Đã thanh toán</p>
                <p class="pay-desc">Khách đã trả tiền mặt</p>
              </div>
            </div>
          </label>
          <label class="pay-option" :class="{ active: form.isPaid === false }">
            <input type="radio" :value="false" v-model="form.isPaid" />
            <div class="pay-option-body">
              <span class="material-icons pay-icon">pending</span>
              <div>
                <p class="pay-title">Chưa thanh toán</p>
                <p class="pay-desc">Thanh toán sau</p>
              </div>
            </div>
          </label>
        </div>

        <!-- Ghi chú -->
        <div class="form-group" style="margin-top:12px">
          <label>Ghi chú</label>
          <textarea v-model="form.note" placeholder="Thông tin thêm..." rows="2"></textarea>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="error-msg">
          <span class="material-icons">error</span>
          {{ errorMsg }}
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="$emit('close')">Hủy</button>
          <button type="submit" class="btn-submit" :disabled="isSubmitting || !isFormValid">
            <span v-if="isSubmitting" class="material-icons spin-icon">sync</span>
            <span v-else class="material-icons">save</span>
            {{ isSubmitting ? 'Đang tạo...' : 'Tạo đơn đặt sân' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OfflineBookingModal',
  props: {
    show:   { type: Boolean, required: true },
    courts: { type: Array,   default: () => [] },
    slotDuration: { type: Number, default: 60 }, // minutes per slot
  },
  emits: ['close', 'submit'],
  data() {
    return {
      form: {
        bookerName:  '',
        bookerPhone: '',
        courtId:     '',
        date:        new Date().toISOString().split('T')[0],
        startHour:   '',
        slotCount:   1,
        isPaid:      true,
        note:        '',
      },
      isSubmitting: false,
      errorMsg: '',
    };
  },
  computed: {
    today() {
      return new Date().toISOString().split('T')[0];
    },
    availableHours() {
      const hours = [];
      for (let h = 6; h <= 22; h++) hours.push(h);
      return hours;
    },
    slotDurationText() {
      return `${this.slotDuration} phút`;
    },
    endHour() {
      if (this.form.startHour === '') return '';
      const totalMins = this.form.startHour * 60 + this.slotDuration * this.form.slotCount;
      return Math.floor(totalMins / 60);
    },
    endMin() {
      if (this.form.startHour === '') return 0;
      const totalMins = this.form.startHour * 60 + this.slotDuration * this.form.slotCount;
      return totalMins % 60;
    },
    timePreview() {
      if (this.form.startHour === '') return '';
      const startStr = `${String(this.form.startHour).padStart(2,'0')}:00`;
      const endStr   = `${String(this.endHour).padStart(2,'0')}:${String(this.endMin).padStart(2,'0')}`;
      return `${startStr} – ${endStr}`;
    },
    isFormValid() {
      return this.form.bookerName.trim() &&
             this.form.bookerPhone.trim() &&
             this.form.courtId &&
             this.form.date &&
             this.form.startHour !== '';
    },
  },
  watch: {
    show(v) {
      if (v) { this.errorMsg = ''; }
      else   { this.resetForm(); }
    }
  },
  methods: {
    onCourtChange() {
      // reset start time when court changes
      this.form.startHour = '';
    },
    async submitForm() {
      if (!this.isFormValid) return;
      this.isSubmitting = true;
      this.errorMsg = '';
      try {
        // Build slots array: one object per slot
        const slots = [];
        for (let i = 0; i < this.form.slotCount; i++) {
          const slotStartMins = this.form.startHour * 60 + i * this.slotDuration;
          const h = Math.floor(slotStartMins / 60);
          const m = slotStartMins % 60;
          const startISO = new Date(
            `${this.form.date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`
          ).toISOString();
          slots.push({ courtId: this.form.courtId, startTime: startISO });
        }

        const payload = {
          slots,
          bookerName:  this.form.bookerName.trim(),
          bookerPhone: this.form.bookerPhone.trim(),
          bookerEmail: null,
          isPaid:      this.form.isPaid,
          note:        this.form.note.trim() || undefined,
        };

        this.$emit('submit', payload);
      } catch (e) {
        this.errorMsg = 'Có lỗi xảy ra. Vui lòng thử lại.';
        this.isSubmitting = false;
      }
    },
    // Called by parent after success/fail
    setSubmitting(v) { this.isSubmitting = v; },
    setError(msg)    { this.errorMsg = msg; this.isSubmitting = false; },
    resetForm() {
      this.form = {
        bookerName:  '',
        bookerPhone: '',
        courtId:     '',
        date:        new Date().toISOString().split('T')[0],
        startHour:   '',
        slotCount:   1,
        isPaid:      true,
        note:        '',
      };
      this.errorMsg = '';
      this.isSubmitting = false;
    },
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15,22,35,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(6px);
  padding: 16px;
}
.modal-content {
  background: #fff; width: 100%; max-width: 560px;
  border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,.18);
  animation: slideDown .3s ease; overflow: hidden; max-height: 90vh; overflow-y: auto;
}
@keyframes slideDown {
  from { opacity:0; transform: translateY(-24px) scale(.97); }
  to   { opacity:1; transform: translateY(0)     scale(1);   }
}

/* ── Header ─────────────────────────────────────── */
.modal-header {
  padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #eaecf2; background: #f8fafc;
}
.modal-title-group { display: flex; align-items: center; gap: 14px; }
.modal-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  background: #059669;
  display: flex; align-items: center; justify-content: center;
}
.modal-icon { font-size: 22px; color: #fff; }
.modal-title { margin: 0; font-size: 17px; font-weight: 700; color: #0f1623; }
.modal-subtitle { margin: 2px 0 0; font-size: 12px; color: #9aa3bc; }
.close-btn {
  background: none; border: 1px solid #eaecf2; border-radius: 8px;
  width: 34px; height: 34px; cursor: pointer; color: #9aa3bc;
  display: flex; align-items: center; justify-content: center; transition: all .2s;
}
.close-btn:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

/* ── Body ────────────────────────────────────────── */
.modal-body { padding: 20px 24px; }
.section-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  color: #059669; margin: 16px 0 10px;
}
.section-label:first-child { margin-top: 0; }
.section-icon { font-size: 14px; }

.form-row { display: flex; gap: 12px; }
.form-group { flex: 1; margin-bottom: 12px; }
.form-group label {
  display: block; margin-bottom: 6px;
  font-size: 12px; font-weight: 600; color: #4b5672;
}
.required { color: #ef4444; }
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%; padding: 10px 12px; border: 1.5px solid #eaecf2;
  border-radius: 10px; font-family: inherit; font-size: 14px;
  background: #fff; transition: border-color .2s; box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none; border-color: #059669; background: #f0fdf4;
}

/* ── Time Preview ─────────────────────────────────── */
.time-preview {
  display: flex; align-items: center; gap: 8px;
  background: #ecfdf5; border: 1px solid #a7f3d0;
  border-radius: 10px; padding: 9px 14px;
  font-size: 13px; color: #065f46; margin-bottom: 12px;
}
.preview-icon { font-size: 16px; }

/* ── Payment Options ──────────────────────────────── */
.pay-options { display: flex; gap: 12px; }
.pay-option {
  flex: 1; cursor: pointer;
  border: 1.5px solid #eaecf2; border-radius: 12px;
  padding: 12px; transition: all .2s;
}
.pay-option input[type="radio"] { display: none; }
.pay-option.active { border-color: #059669; background: #f0fdf4; }
.pay-option-body { display: flex; align-items: flex-start; gap: 10px; }
.pay-icon { font-size: 20px; color: #9aa3bc; margin-top: 2px; }
.pay-option.active .pay-icon { color: #059669; }
.pay-title { margin: 0; font-size: 13px; font-weight: 700; color: #0f1623; }
.pay-desc  { margin: 2px 0 0; font-size: 11px; color: #9aa3bc; }

/* ── Error ───────────────────────────────────────── */
.error-msg {
  display: flex; align-items: center; gap: 8px;
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
  color: #dc2626; font-size: 13px; padding: 10px 14px;
  margin-top: 12px;
}
.error-msg .material-icons { font-size: 16px; }

/* ── Footer ──────────────────────────────────────── */
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.btn-cancel {
  padding: 11px 22px; background: #fff; border: 1.5px solid #eaecf2;
  border-radius: 10px; font-weight: 600; cursor: pointer; color: #4b5672;
  font-size: 14px; transition: all .2s;
}
.btn-cancel:hover { border-color: #9aa3bc; }
.btn-submit {
  display: flex; align-items: center; gap: 6px;
  padding: 11px 22px;
  background: #059669;
  border: none; border-radius: 10px; font-weight: 700;
  color: #fff; cursor: pointer; font-size: 14px; transition: background .2s, transform .2s, box-shadow .2s;
  box-shadow: 0 3px 10px rgba(5,150,105,.28);
}
.btn-submit:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(5,150,105,.35);
}
.btn-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.btn-submit .material-icons { font-size: 16px; }
.spin-icon { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
