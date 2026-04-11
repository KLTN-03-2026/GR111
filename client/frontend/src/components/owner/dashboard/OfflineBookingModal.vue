<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Đặt sân tại quầy</h3>
        <button class="close-btn" @click="$emit('close')"><span class="material-icons">close</span></button>
      </div>

      <form @submit.prevent="submitForm" class="modal-body">
        <div class="form-group">
          <label>Khách hàng *</label>
          <input type="text" v-model="form.customerName" placeholder="Tên khách hàng" required />
        </div>
        <div class="form-group">
          <label>Số điện thoại *</label>
          <input type="tel" v-model="form.customerPhone" placeholder="0123456789" required />
        </div>
        <div class="form-group">
          <label>Chọn Sân *</label>
          <select v-model="form.courtId" required>
            <option value="" disabled>-- Chọn sân --</option>
            <option v-for="court in courts" :key="court.id" :value="court.id">{{ court.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Giờ bắt đầu *</label>
            <input type="time" v-model="form.startTime" required />
          </div>
          <div class="form-group">
            <label>Giờ kết thúc *</label>
            <input type="time" v-model="form.endTime" required />
          </div>
        </div>
        <div class="form-group">
          <label>Ngày đặt *</label>
          <input type="date" v-model="form.date" required />
        </div>
        <div class="form-group">
          <label>Ghi chú</label>
          <textarea v-model="form.notes" placeholder="Ghi chú thêm..."></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="$emit('close')">Hủy</button>
          <button type="submit" class="btn-submit" :disabled="isSubmitting">
            <span v-if="isSubmitting">Đang xử lý...</span>
            <span v-else>Tạo đơn</span>
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
    show: { type: Boolean, required: true },
    courts: { type: Array, default: () => [] },
  },
  data() {
    return {
      form: {
        customerName: '',
        customerPhone: '',
        courtId: '',
        startTime: '',
        endTime: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      },
      isSubmitting: false
    };
  },
  methods: {
    async submitForm() {
      this.isSubmitting = true;
      try {
        this.$emit('submit', { ...this.form });
        this.resetForm();
      } finally {
        this.isSubmitting = false;
      }
    },
    resetForm() {
      this.form = {
        customerName: '',
        customerPhone: '',
        courtId: '',
        startTime: '',
        endTime: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      };
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 22, 35, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: #fff; width: 100%; max-width: 500px;
  border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  animation: slideDown 0.3s ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
.modal-header {
  padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #eaecf2;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f1623; }
.close-btn { background: none; border: none; cursor: pointer; color: #9aa3bc; }
.modal-body { padding: 24px; }
.form-row { display: flex; gap: 16px; }
.form-group { margin-bottom: 16px; flex: 1; }
.form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #4b5672; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 12px 14px; border: 1px solid #eaecf2; border-radius: 8px;
  font-family: inherit; font-size: 14px;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: #059669; background: #f0fdf9;
}
.modal-footer {
  margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;
}
.btn-cancel {
  padding: 10px 20px; background: #fff; border: 1px solid #eaecf2; border-radius: 8px;
  font-weight: 600; cursor: pointer; color: #4b5672;
}
.btn-submit {
  padding: 10px 20px; background: #059669; border: none; border-radius: 8px;
  font-weight: 600; color: #fff; cursor: pointer;
}
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
