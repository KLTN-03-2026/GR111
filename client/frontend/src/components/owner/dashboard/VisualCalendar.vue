<template>
  <div class="card visual-calendar">
    <!-- Header -->
    <div class="cal-header">
      <div class="title-group">
        <div class="title-dot"></div>
        <h3 class="cal-title">Lịch booking trực quan</h3>
      </div>
      <div class="cal-controls">
        <button class="nav-btn" @click="prevDay">
          <span class="material-icons">chevron_left</span>
        </button>
        <div class="date-display">
          <span class="material-icons cal-icon">calendar_today</span>
          <span class="date-text">{{ displayDate }}</span>
          <span v-if="isToday" class="today-badge">Hôm nay</span>
        </div>
        <button class="nav-btn" @click="nextDay">
          <span class="material-icons">chevron_right</span>
        </button>
        <button class="today-btn" @click="goToday" v-if="!isToday">Hôm nay</button>
      </div>
      <div class="legend">
        <span class="legend-item leg-confirmed"><span class="legend-dot"></span>Xác nhận</span>
        <span class="legend-item leg-pending"><span class="legend-dot"></span>Chờ xử lý</span>
        <span class="legend-item leg-waiting"><span class="legend-dot"></span>Chờ TT</span>
        <span class="legend-item leg-completed"><span class="legend-dot"></span>Hoàn thành</span>
        <span class="legend-item leg-cancelled"><span class="legend-dot"></span>Đã hủy</span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="cal-loading">
      <span class="material-icons spin-icon">sync</span>
      <span>Đang tải lịch...</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!courts.length" class="cal-empty">
      <span class="material-icons empty-icon">event_busy</span>
      <p>Chưa có sân nào. Hãy thêm sân trong phần quản lý.</p>
    </div>

    <!-- Calendar Grid -->
    <div v-else class="calendar-wrapper">
      <div class="calendar-grid" :style="gridTemplateStyle">
        <!-- Time header (top-left corner) -->
        <div class="corner-cell">Giờ</div>

        <!-- Court headers -->
        <div v-for="court in courts" :key="'h-'+court.id" class="court-header">
          <span class="material-icons court-icon">sports_soccer</span>
          <span class="court-name">{{ court.name }}</span>
          <span class="court-type">{{ court.type || '' }}</span>
        </div>

        <!-- Time slots rows -->
        <template v-for="hour in hours" :key="'row-'+hour">
          <!-- Time label -->
          <div class="time-label" :class="{ 'current-hour': isCurrentHour(hour) }">
            {{ String(hour).padStart(2,'0') }}:00
          </div>

          <!-- Court cells for this hour -->
          <div
            v-for="court in courts"
            :key="'cell-'+hour+'-'+court.id"
            class="time-slot-cell"
            :class="{ 'current-hour-col': isCurrentHour(hour) }"
            @click="onCellClick(court, hour)"
          >
            <!-- Booking blocks -->
            <template v-for="seg in getSegments(court.id, hour)" :key="seg.bookingId+'-'+seg.startMin">
              <div
                class="booking-block"
                :class="[statusClass(seg.status), { 'is-new': seg.isNew }]"
                :style="blockStyle(seg)"
                @click.stop="onBlockClick(seg)"
                :title="seg.label"
              >
                <div class="block-name">{{ seg.name }}</div>
                <div class="block-time">{{ seg.timeRange }}</div>
                <span class="block-status-dot"></span>
              </div>
            </template>

            <!-- Current time line -->
            <div
              v-if="isCurrentHour(hour)"
              class="now-line"
              :style="{ top: nowLineTop + 'px' }"
            ></div>
          </div>
        </template>
      </div>
    </div>

    <!-- Tooltip popup -->
    <Transition name="fade">
      <div v-if="activeBlock" class="booking-tooltip" :style="tooltipStyle">
        <div class="tooltip-header" :class="statusClass(activeBlock.status)">
          <span class="tooltip-status">{{ statusLabel(activeBlock.status) }}</span>
          <button class="tooltip-close" @click="activeBlock = null">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="tooltip-body">
          <div class="tt-row"><span class="material-icons tt-icon">person</span>{{ activeBlock.name }}</div>
          <div class="tt-row"><span class="material-icons tt-icon">phone</span>{{ activeBlock.phone || '—' }}</div>
          <div class="tt-row"><span class="material-icons tt-icon">schedule</span>{{ activeBlock.timeRange }}</div>
          <div class="tt-row"><span class="material-icons tt-icon">sports_soccer</span>{{ activeBlock.courtName }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
export default {
  name: 'VisualCalendar',
  props: {
    courts:   { type: Array, default: () => [] },
    bookings: { type: Array, default: () => [] },
    loading:  { type: Boolean, default: false },
    newBookingId: { type: String, default: null },
  },
  emits: ['cell-click', 'date-change'],
  data() {
    const today = new Date();
    today.setHours(0,0,0,0);
    return {
      currentDate: today,
      startHour: 6,
      endHour: 22,
      nowMinute: 0,
      activeBlock: null,
      tooltipStyle: {},
    };
  },
  mounted() {
    this.updateNow();
    this._nowTimer = setInterval(this.updateNow, 60000);
  },
  beforeUnmount() {
    clearInterval(this._nowTimer);
  },
  computed: {
    hours() {
      const h = [];
      for (let i = this.startHour; i <= this.endHour; i++) h.push(i);
      return h;
    },
    isToday() {
      const t = new Date(); t.setHours(0,0,0,0);
      return this.currentDate.getTime() === t.getTime();
    },
    displayDate() {
      return this.currentDate.toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
      });
    },
    gridTemplateStyle() {
      const courtCols = this.courts.map(() => 'minmax(120px, 1fr)').join(' ');
      return { gridTemplateColumns: `60px ${courtCols}` };
    },
    nowLineTop() {
      const now = new Date();
      const minInHour = now.getMinutes();
      return (minInHour / 60) * 56; // 56px per row
    },
    // Parse all bookings into segments (one per time-slot item)
    segments() {
      const segs = [];
      for (const booking of this.bookings) {
        if (!booking.items?.length) continue;
        for (const item of booking.items) {
          const slot = item.timeSlot;
          if (!slot?.startTime || !slot?.endTime) continue;
          const start = new Date(slot.startTime);
          const end   = new Date(slot.endTime);
          segs.push({
            bookingId: booking.id,
            courtId:   slot.court?.id || slot.courtId,
            courtName: slot.court?.name || '',
            startH: start.getHours(),
            startMin: start.getMinutes(),
            endH: end.getHours(),
            endMin: end.getMinutes(),
            name: booking.bookerName || 'Khách',
            phone: booking.bookerPhone || '',
            status: booking.status,
            isNew: booking.id === this.newBookingId,
            timeRange: `${this.fmtTime(start)} – ${this.fmtTime(end)}`,
            label: `${booking.bookerName} | ${this.fmtTime(start)}–${this.fmtTime(end)}`,
          });
        }
      }
      return segs;
    },
  },
  methods: {
    fmtTime(d) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    },
    updateNow() {
      const n = new Date();
      this.nowMinute = n.getMinutes();
    },
    isCurrentHour(hour) {
      if (!this.isToday) return false;
      return new Date().getHours() === hour;
    },
    toLocalDateStr(d) {
      // Dùng local time để tránh lệch ngày do múi giờ (UTC+7)
      const y  = d.getFullYear();
      const m  = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    },
    prevDay() {
      const d = new Date(this.currentDate);
      d.setDate(d.getDate() - 1);
      this.currentDate = d;
      this.$emit('date-change', this.toLocalDateStr(d));
    },
    nextDay() {
      const d = new Date(this.currentDate);
      d.setDate(d.getDate() + 1);
      this.currentDate = d;
      this.$emit('date-change', this.toLocalDateStr(d));
    },
    goToday() {
      const t = new Date(); t.setHours(0,0,0,0);
      this.currentDate = t;
      this.$emit('date-change', this.toLocalDateStr(t));
    },
    // Get booking segments for a specific court & hour cell
    getSegments(courtId, hour) {
      return this.segments.filter(s =>
        s.courtId === courtId && s.startH === hour
      );
    },
    // Position block inside its hour cell
    blockStyle(seg) {
      const topPx    = (seg.startMin / 60) * 56;
      const durMins  = (seg.endH - seg.startH) * 60 + (seg.endMin - seg.startMin);
      const heightPx = Math.max((durMins / 60) * 56 - 4, 20);
      return { top: topPx + 'px', height: heightPx + 'px' };
    },
    statusClass(status) {
      const map = {
        CONFIRMED:      'st-confirmed',
        PENDING:        'st-pending',
        WAITING_PAYMENT:'st-waiting',
        COMPLETED:      'st-completed',
        CANCELLED:      'st-cancelled',
      };
      return map[status] || 'st-default';
    },
    statusLabel(status) {
      const map = {
        CONFIRMED:      'Đã xác nhận',
        PENDING:        'Chờ xác nhận',
        WAITING_PAYMENT:'Chờ thanh toán',
        COMPLETED:      'Hoàn thành',
        CANCELLED:      'Đã hủy',
      };
      return map[status] || status;
    },
    onCellClick(court, hour) {
      this.$emit('cell-click', { court, hour, date: this.currentDate });
    },
    onBlockClick(seg) {
      this.activeBlock = seg;
    },
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

/* ── Card ─────────────────────────────────────────── */
.card {
  background: #fff;
  border: 1px solid #eaecf2;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 16px rgba(15,22,35,.06);
}

/* ── Header ───────────────────────────────────────── */
.cal-header {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 14px; margin-bottom: 20px;
}
.title-group { display: flex; align-items: center; gap: 10px; }
.title-dot { width: 8px; height: 8px; border-radius: 50%; background: #059669; }
.cal-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#0f1623; margin:0; }

.cal-controls { display:flex; align-items:center; gap:8px; margin-left:auto; }
.nav-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid #eaecf2; background: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.nav-btn:hover { border-color: #059669; color: #059669; background: #ecfdf5; }
.nav-btn .material-icons { font-size: 18px; }
.date-display {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #eaecf2;
}
.cal-icon { font-size: 15px; color: #059669; }
.date-text { font-size: 13px; font-weight: 600; color: #0f1623; }
.today-badge {
  font-size: 10px; font-weight: 700; color: #059669;
  background: #ecfdf5; padding: 2px 7px; border-radius: 100px;
}
.today-btn {
  padding: 6px 12px; border-radius: 8px;
  background: #059669; color: #fff; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
}

/* ── Legend ───────────────────────────────────────── */
.legend { display: flex; gap: 14px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #4b5672; font-weight: 500; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-item.leg-confirmed .legend-dot { background: #10b981; }
.legend-item.leg-pending    .legend-dot { background: #f59e0b; }
.legend-item.leg-waiting    .legend-dot { background: #3b82f6; }
.legend-item.leg-completed  .legend-dot { background: #6b7280; }
.legend-item.leg-cancelled  .legend-dot { background: #ef4444; }

/* ── Loading / Empty ──────────────────────────────── */
.cal-loading, .cal-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 60px 20px; color: #9aa3bc;
}
.spin-icon { font-size: 32px; animation: spin 1s linear infinite; }
.empty-icon { font-size: 40px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Calendar Grid ────────────────────────────────── */
.calendar-wrapper { overflow-x: auto; border: 1px solid #eaecf2; border-radius: 12px; }
.calendar-grid {
  display: grid;
  min-width: 500px;
}

/* Corner / Time labels / Court headers */
.corner-cell {
  grid-column: 1; grid-row: 1;
  height: 44px; display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #9aa3bc; text-transform: uppercase;
  background: #f8fafc; border-bottom: 1px solid #eaecf2; border-right: 1px solid #eaecf2;
  position: sticky; top: 0; left: 0; z-index: 3;
}
.court-header {
  height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; background: #f8fafc; border-bottom: 1px solid #eaecf2; border-right: 1px solid #eaecf2;
  position: sticky; top: 0; z-index: 2; padding: 4px 8px;
}
.court-icon { font-size: 14px; color: #059669; }
.court-name { font-size: 12px; font-weight: 700; color: #0f1623; }
.court-type { font-size: 10px; color: #9aa3bc; }

.time-label {
  height: 56px; display: flex; align-items: flex-start; justify-content: center;
  padding-top: 6px; font-size: 11px; color: #9aa3bc;
  border-bottom: 1px solid #eaecf2; border-right: 1px solid #eaecf2;
  background: #f8fafc; position: sticky; left: 0; z-index: 1;
}
.time-label.current-hour { color: #059669; font-weight: 700; background: #f0fdf8; }

.time-slot-cell {
  height: 56px; position: relative;
  border-bottom: 1px solid #f1f5f9; border-right: 1px solid #eaecf2;
  cursor: pointer; transition: background .15s;
}
.time-slot-cell:hover { background: #f8fafb; }
.time-slot-cell.current-hour-col { background: rgba(5,150,105,.03); }
.time-slot-cell:last-child { border-right: none; }

/* ── Current time line ────────────────────────────── */
.now-line {
  position: absolute; left: 0; right: 0; height: 2px;
  background: #ef4444; z-index: 2;
  box-shadow: 0 0 6px rgba(239,68,68,.4);
}
.now-line::before {
  content: '';
  position: absolute; left: -4px; top: -3px;
  width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
}

/* ── Booking Blocks ───────────────────────────────── */
.booking-block {
  position: absolute; left: 3px; right: 3px;
  border-radius: 6px; padding: 3px 6px;
  border-left: 3px solid transparent;
  font-size: 10px; overflow: hidden;
  cursor: pointer; z-index: 1;
  transition: all .2s; box-shadow: 0 1px 4px rgba(0,0,0,.08);
}
.booking-block:hover { transform: scale(1.02); box-shadow: 0 3px 10px rgba(0,0,0,.12); z-index: 2; }

.st-confirmed      { background: #ecfdf5; border-color: #10b981; color: #065f46; }
.st-pending        { background: #fffbeb; border-color: #f59e0b; color: #78350f; }
.st-waiting        { background: #eff6ff; border-color: #3b82f6; color: #1e3a8a; }
.st-completed      { background: #f3f4f6; border-color: #6b7280; color: #1f2937; }
.st-cancelled      { background: #fef2f2; border-color: #ef4444; color: #7f1d1d; opacity: .7; }
.st-default        { background: #f1f5f9; border-color: #94a3b8; color: #334155; }

/* New booking pulse animation */
.is-new {
  animation: pulse-glow 2s ease-in-out 3;
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  50%       { box-shadow: 0 0 0 4px rgba(5,150,105,.25), 0 3px 12px rgba(5,150,105,.3); }
}

.block-name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.block-time { font-size: 9px; opacity: .8; }
.block-status-dot {
  position: absolute; top: 5px; right: 5px;
  width: 5px; height: 5px; border-radius: 50%; background: currentColor;
}

/* ── Tooltip ──────────────────────────────────────── */
.booking-tooltip {
  position: fixed; z-index: 9999;
  background: #fff; border-radius: 14px;
  box-shadow: 0 8px 30px rgba(15,22,35,.15);
  min-width: 220px; overflow: hidden;
  border: 1px solid #eaecf2;
}
.tooltip-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; font-size: 12px; font-weight: 700;
}
.tooltip-status { text-transform: uppercase; letter-spacing: .04em; }
.tooltip-close {
  background: none; border: none; cursor: pointer; color: inherit; padding: 0;
  display: flex; align-items: center;
}
.tooltip-close .material-icons { font-size: 16px; }
.tooltip-header.st-confirmed      { background:#ecfdf5; color:#065f46; }
.tooltip-header.st-pending        { background:#fffbeb; color:#78350f; }
.tooltip-header.st-waiting        { background:#eff6ff; color:#1e3a8a; }
.tooltip-header.st-completed      { background:#f3f4f6; color:#1f2937; }
.tooltip-header.st-cancelled      { background:#fef2f2; color:#7f1d1d; }

.tooltip-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.tt-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #0f1623; }
.tt-icon { font-size: 14px; color: #9aa3bc; }

/* ── Transition ───────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
