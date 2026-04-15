<template>
  <div class="slot-view">

    <!-- ── Header ─────────────────────────────────────────────── -->
    <div class="vheader">
      <div class="h-left">
        <h1 class="vtitle">Quản lý khung giờ</h1>
        <p class="vsub">Khoá / mở khung giờ cho sân của bạn</p>
      </div>
      <div class="h-right">
        <div class="legend">
          <span class="leg-dot available"></span><span>Trống</span>
          <span class="leg-dot locked"></span><span>Đã khoá</span>
          <span class="leg-dot booked"></span><span>Đã đặt</span>
        </div>
      </div>
    </div>

    <!-- ── Filter Bar ──────────────────────────────────────────── -->
    <div class="filter-bar">
      <!-- Club select -->
      <div class="f-item">
        <span class="material-icons f-icon">business</span>
        <select v-model="selectedClubId" @change="onClubChange">
          <option value="" disabled>— Chọn câu lạc bộ —</option>
          <option v-for="c in clubs" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Court select -->
      <div class="f-item">
        <span class="material-icons f-icon">sports_soccer</span>
        <select v-model="selectedCourtId" @change="fetchSlots" :disabled="!courts.length">
          <option value="" disabled>— Chọn sân —</option>
          <option v-for="c in courts" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Date picker -->
      <div class="f-item date-item">
        <span class="material-icons f-icon">calendar_today</span>
        <input type="date" v-model="selectedDate" @change="fetchSlots" :min="todayStr" />
      </div>

      <!-- Nav prev / next day -->
      <div class="day-nav">
        <button class="day-btn" @click="shiftDay(-1)" :disabled="selectedDate <= todayStr">
          <span class="material-icons">chevron_left</span>
        </button>
        <span class="day-label">{{ formattedDate }}</span>
        <button class="day-btn" @click="shiftDay(1)">
          <span class="material-icons">chevron_right</span>
        </button>
      </div>

      <button class="btn-refresh" @click="fetchSlots" :disabled="slotsLoading" title="Làm mới">
        <span class="material-icons" :class="{ spinning: slotsLoading }">refresh</span>
      </button>
    </div>

    <!-- ── Quick-action bar (bulk lock) ─────────────────────────── -->
    <div class="quick-bar" v-if="selectedCourtId && slots.length">
      <span class="qb-label">Thao tác nhanh:</span>
      <button class="qb-btn lock-all" @click="bulkToggle('LOCKED')"
        :disabled="bulkLoading || !availableSlots.length">
        <span class="material-icons">lock</span>
        Khoá tất cả trống ({{ availableSlots.length }})
      </button>
      <button class="qb-btn open-all" @click="bulkToggle('AVAILABLE')"
        :disabled="bulkLoading || !lockedSlots.length">
        <span class="material-icons">lock_open</span>
        Mở tất cả khoá ({{ lockedSlots.length }})
      </button>
    </div>

    <!-- ── No court selected ────────────────────────────────────── -->
    <div v-if="!selectedCourtId" class="empty-glass">
      <div class="empty-icon"><span class="material-icons">event_busy</span></div>
      <h3>Chọn sân để xem lịch khung giờ</h3>
      <p>Vui lòng chọn câu lạc bộ và sân bóng để quản lý khóa / mở khung giờ.</p>
    </div>

    <!-- ── Loading skeleton ─────────────────────────────────────── -->
    <div v-else-if="slotsLoading" class="slot-grid">
      <div v-for="n in 12" :key="n" class="slot-card sk"></div>
    </div>

    <!-- ── Closed day ────────────────────────────────────────────── -->
    <div v-else-if="!slotsLoading && slots.length === 0" class="empty-glass">
      <div class="empty-icon"><span class="material-icons">do_not_disturb</span></div>
      <h3>Ngày này cơ sở đóng cửa</h3>
      <p>Không có khung giờ nào được tạo. Kiểm tra lại lịch mở cửa trong Cài đặt.</p>
    </div>

    <!-- ── Slot grid ─────────────────────────────────────────────── -->
    <div v-else class="slot-grid">
      <div
        v-for="slot in slots"
        :key="slot.id"
        class="slot-card"
        :class="slotClass(slot)"
      >
        <div class="sc-time">
          <span class="material-icons sc-icon">{{ slotIcon(slot) }}</span>
          <div>
            <div class="sc-start">{{ fmtTime(slot.startTime) }}</div>
            <div class="sc-end">→ {{ fmtTime(slot.endTime) }}</div>
          </div>
        </div>

        <div class="sc-badge" :class="slot.status.toLowerCase()">
          {{ statusLabel(slot) }}
        </div>

        <!-- Booking sub-status -->
        <div v-if="slot.bookingStatus" class="sc-booking-status" :class="slot.bookingStatus.toLowerCase()">
          {{ bookingStatusLabel(slot.bookingStatus) }}
        </div>

        <!-- Action buttons  -->
        <div class="sc-actions" v-if="slot.status !== 'BOOKED'">
          <button
            v-if="slot.status === 'AVAILABLE'"
            class="sc-btn lock-btn"
            :disabled="slot._loading"
            @click="toggleSlot(slot, 'LOCKED')"
          >
            <span v-if="slot._loading" class="mini-spin"></span>
            <span v-else class="material-icons">lock</span>
            Khoá
          </button>
          <button
            v-else-if="slot.status === 'LOCKED'"
            class="sc-btn open-btn"
            :disabled="slot._loading"
            @click="toggleSlot(slot, 'AVAILABLE')"
          >
            <span v-if="slot._loading" class="mini-spin"></span>
            <span v-else class="material-icons">lock_open</span>
            Mở
          </button>
        </div>

        <div class="sc-actions" v-else>
          <span class="booked-label">
            <span class="material-icons">event_available</span>
            Đã có đặt
          </span>
        </div>
      </div>
    </div>

    <!-- ── Toast ─────────────────────────────────────────────────── -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <span class="material-icons">{{ toast.type === 'success' ? 'check_circle' : 'error_outline' }}</span>
        {{ toast.msg }}
      </div>
    </transition>

  </div>
</template>

<script>
import { courtService } from '@/services/court.service';
import { clubService }  from '@/services/club.service';

export default {
  name: 'SlotManagementView',

  data() {
    const today = new Date();
    const pad   = n => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
    return {
      clubs:           [],
      courts:          [],
      slots:           [],
      selectedClubId:  '',
      selectedCourtId: '',
      selectedDate:    todayStr,
      todayStr,
      slotsLoading:    false,
      bulkLoading:     false,
      toast: { show: false, msg: '', type: 'success' },
    };
  },

  computed: {
    formattedDate() {
      if (!this.selectedDate) return '';
      const d = new Date(this.selectedDate + 'T00:00:00');
      const days = ['CN','T2','T3','T4','T5','T6','T7'];
      return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    },
    availableSlots() { return this.slots.filter(s => s.status === 'AVAILABLE'); },
    lockedSlots()    { return this.slots.filter(s => s.status === 'LOCKED'); },
  },

  async mounted() {
    await this.fetchClubs();
  },

  methods: {
    // ── Fetch data ──────────────────────────────────────────────
    async fetchClubs() {
      try {
        const res = await clubService.Getallthedetails();
        if (res.data.success) {
          this.clubs = res.data.data ?? [];
          if (this.clubs.length) {
            this.selectedClubId = this.clubs[0].id;
            await this.fetchCourts();
          }
        }
      } catch (e) { console.error('fetchClubs', e); }
    },

    async fetchCourts() {
      if (!this.selectedClubId) return;
      try {
        const res = await courtService.getCourts(this.selectedClubId);
        if (res.data.success) {
          this.courts = (res.data.data ?? []).filter(c => c.status === 'ACTIVE');
          this.selectedCourtId = this.courts.length ? this.courts[0].id : '';
          if (this.selectedCourtId) await this.fetchSlots();
        }
      } catch (e) { console.error('fetchCourts', e); }
    },

    async fetchSlots() {
      if (!this.selectedCourtId || !this.selectedDate) return;
      this.slotsLoading = true;
      this.slots = [];
      try {
        const res = await courtService.getSlots(this.selectedCourtId, this.selectedDate);
        if (res.data.success) {
          this.slots = (res.data.data ?? []).map(s => ({ ...s, _loading: false }));
        }
      } catch (e) {
        console.error('fetchSlots', e);
        this.showToast('Không thể tải khung giờ, vui lòng thử lại.', 'error');
      } finally {
        this.slotsLoading = false;
      }
    },

    // ── Toggle single slot ──────────────────────────────────────
    async toggleSlot(slot, newStatus) {
      slot._loading = true;
      try {
        await courtService.toggleSlotLock(
          this.selectedCourtId,
          slot.startTime,
          slot.endTime,
          newStatus
        );
        slot.status   = newStatus;
        slot.id       = slot.id.startsWith('v-') ? slot.id : slot.id; // keep id
        const msg = newStatus === 'LOCKED' ? '🔒 Đã khoá khung giờ' : '🔓 Đã mở khung giờ';
        this.showToast(msg, 'success');
        // Refresh to get real id from DB
        await this.fetchSlots();
      } catch (e) {
        const msg = e.response?.data?.message ?? 'Có lỗi xảy ra';
        this.showToast(msg, 'error');
      } finally {
        slot._loading = false;
      }
    },

    // ── Bulk toggle ─────────────────────────────────────────────
    async bulkToggle(newStatus) {
      const targets = newStatus === 'LOCKED' ? this.availableSlots : this.lockedSlots;
      if (!targets.length) return;
      this.bulkLoading = true;
      let successCount = 0;
      for (const slot of targets) {
        try {
          await courtService.toggleSlotLock(
            this.selectedCourtId, slot.startTime, slot.endTime, newStatus
          );
          successCount++;
        } catch { /* skip individual error */ }
      }
      this.bulkLoading = false;
      const action = newStatus === 'LOCKED' ? 'khoá' : 'mở';
      this.showToast(`Đã ${action} ${successCount}/${targets.length} khung giờ`, 'success');
      await this.fetchSlots();
    },

    // ── Day nav ─────────────────────────────────────────────────
    shiftDay(delta) {
      const d = new Date(this.selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + delta);
      const pad = n => String(n).padStart(2, '0');
      this.selectedDate = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      this.fetchSlots();
    },

    onClubChange() {
      this.courts = [];
      this.slots  = [];
      this.selectedCourtId = '';
      this.fetchCourts();
    },

    // ── Helpers ─────────────────────────────────────────────────
    fmtTime(iso) {
      if (!iso) return '--:--';
      const d = new Date(iso);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    },

    slotClass(slot) {
      return {
        'status-available': slot.status === 'AVAILABLE',
        'status-locked':    slot.status === 'LOCKED',
        'status-booked':    slot.status === 'BOOKED',
      };
    },

    slotIcon(slot) {
      if (slot.status === 'BOOKED')    return 'event_available';
      if (slot.status === 'LOCKED')    return 'lock';
      return 'schedule';
    },

    statusLabel(slot) {
      const map = { AVAILABLE: 'Trống', LOCKED: 'Đã khoá', BOOKED: 'Đã đặt' };
      return map[slot.status] ?? slot.status;
    },

    bookingStatusLabel(bs) {
      const map = {
        PENDING:   '⏳ Chờ xác nhận',
        CONFIRMED: '✅ Đã xác nhận',
        COMPLETED: '🏆 Hoàn thành',
        CANCELLED: '❌ Đã hủy',
      };
      return map[bs] ?? bs;
    },

    showToast(msg, type = 'success') {
      this.toast = { show: true, msg, type };
      setTimeout(() => { this.toast.show = false; }, 3000);
    },
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800&display=swap');
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

/* ── Root ── */
.slot-view {
  font-family: 'DM Sans', sans-serif;
  color: #1e293b;
  padding-bottom: 40px;
}

/* ── Header ── */
.vheader {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.vtitle {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 30px; font-weight: 800; color: #0f172a; margin: 0;
}
.vsub { font-size: 14px; color: #64748b; margin: 4px 0 0; }

.legend {
  display: flex; align-items: center; gap: 10px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  padding: 8px 16px; border-radius: 12px; font-size: 13px; color: #475569;
}
.leg-dot {
  width: 10px; height: 10px; border-radius: 50%; display: inline-block;
}
.leg-dot.available { background: #22c55e; }
.leg-dot.locked    { background: #f59e0b; }
.leg-dot.booked    { background: #3b82f6; }

/* ── Filter Bar ── */
.filter-bar {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 10px; margin-bottom: 16px;
  background: #fff; border: 1px solid #e2e8f0;
  padding: 12px 16px; border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.f-item {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 6px 12px; background: #f8fafc;
}
.f-icon { font-size: 18px; color: #94a3b8; }
.f-item select, .f-item input[type="date"] {
  border: none; background: transparent;
  font-family: 'DM Sans', sans-serif; font-size: 14px; color: #334155;
  outline: none; min-width: 140px; cursor: pointer;
}

.day-nav {
  display: flex; align-items: center; gap: 6px; margin-left: auto;
}
.day-btn {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border: 1px solid #e2e8f0;
  border-radius: 8px; background: #f8fafc; cursor: pointer;
  transition: all 0.2s; color: #475569;
}
.day-btn:hover:not(:disabled) { background: #f0fdf4; color: #16a34a; border-color: #86efac; }
.day-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.day-btn .material-icons { font-size: 20px; }

.day-label {
  font-size: 14px; font-weight: 600; color: #334155;
  min-width: 130px; text-align: center;
}

.btn-refresh {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border: 1px solid #e2e8f0;
  border-radius: 10px; background: #f8fafc; cursor: pointer;
  color: #64748b; transition: all 0.2s;
}
.btn-refresh:hover:not(:disabled) { background: #f0fdf4; color: #16a34a; }
.btn-refresh .material-icons { font-size: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

/* ── Quick bar ── */
.quick-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 20px;
}
.qb-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
.qb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.qb-btn .material-icons { font-size: 16px; }
.qb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lock-all { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.lock-all:hover:not(:disabled) { background: #ffedd5; }
.open-all { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.open-all:hover:not(:disabled) { background: #dcfce7; }

/* ── Slot Grid ── */
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.slot-card {
  background: #fff; border-radius: 16px;
  padding: 16px; display: flex; flex-direction: column;
  gap: 10px; border: 2px solid transparent;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  transition: all 0.25s;
}
.slot-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }

/* Status variants */
.status-available { border-color: #bbf7d0; background: #f0fdf4; }
.status-locked    { border-color: #fde68a; background: #fffbeb; }
.status-booked    { border-color: #bfdbfe; background: #eff6ff; }

/* Skeleton */
.slot-card.sk {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  height: 130px;
  border: none;
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* Time display */
.sc-time { display: flex; align-items: center; gap: 10px; }
.sc-icon { font-size: 22px; color: inherit; }
.status-available .sc-icon { color: #16a34a; }
.status-locked    .sc-icon { color: #d97706; }
.status-booked    .sc-icon { color: #3b82f6; }

.sc-start { font-size: 20px; font-weight: 700; color: #0f172a; }
.sc-end   { font-size: 12px; color: #94a3b8; }

/* Status badge */
.sc-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600; width: fit-content;
}
.sc-badge.available { background: #dcfce7; color: #15803d; }
.sc-badge.locked    { background: #fef3c7; color: #b45309; }
.sc-badge.booked    { background: #dbeafe; color: #1d4ed8; }

/* Booking sub-status */
.sc-booking-status {
  font-size: 11px; padding: 2px 8px; border-radius: 8px;
  width: fit-content;
}
.sc-booking-status.pending   { background: #fef9c3; color: #854d0e; }
.sc-booking-status.confirmed { background: #dcfce7; color: #166534; }
.sc-booking-status.completed { background: #e0f2fe; color: #0369a1; }
.sc-booking-status.cancelled { background: #fee2e2; color: #991b1b; }

/* Action buttons */
.sc-actions { margin-top: auto; }
.sc-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 8px 0; border: none; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.sc-btn .material-icons { font-size: 16px; }
.sc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.lock-btn { background: #fff7ed; color: #c2410c; }
.lock-btn:hover:not(:disabled) { background: #ffedd5; }
.open-btn { background: #f0fdf4; color: #15803d; }
.open-btn:hover:not(:disabled) { background: #dcfce7; }

.booked-label {
  display: flex; align-items: center; gap: 4px;
  color: #3b82f6; font-size: 12px; font-weight: 600;
}
.booked-label .material-icons { font-size: 15px; }

/* Mini spinner */
.mini-spin {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,0.15);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

/* ── Empty state ── */
.empty-glass {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 300px; text-align: center;
  background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
  border: 1px dashed #e2e8f0; border-radius: 20px;
  padding: 40px; color: #64748b;
}
.empty-icon { font-size: 56px; margin-bottom: 16px; line-height: 1; }
.empty-icon .material-icons { font-size: 56px; color: #cbd5e1; }
.empty-glass h3 { font-size: 20px; font-weight: 700; color: #334155; margin: 0 0 8px; }
.empty-glass p  { font-size: 14px; margin: 0; max-width: 380px; }

/* ── Toast ── */
.toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 9000;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 14px;
  font-size: 14px; font-weight: 600; color: #fff;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  max-width: 360px;
}
.toast.success { background: linear-gradient(135deg, #16a34a, #15803d); }
.toast.error   { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.toast .material-icons { font-size: 20px; }

.toast-enter-active, .toast-leave-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
</style>
