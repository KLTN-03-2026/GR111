<template>
  <div class="card visual-calendar">
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-title-dot"></div>
        <h3 class="card-title">Lịch hiển thị trực quan (Hôm nay)</h3>
      </div>
    </div>
    
    <div class="calendar-wrapper">
      <div class="calendar-grid">
        <!-- Time Column -->
        <div class="time-col">
          <div class="time-cell header-cell">Giờ</div>
          <div v-for="hour in hours" :key="hour" class="time-cell">
            {{ hour }}:00
          </div>
        </div>
        
        <!-- Court Columns -->
        <div v-for="court in courts" :key="court.id" class="court-col">
          <div class="court-cell header-cell">{{ court.name }}</div>
          <div class="court-slots">
            <!-- Background grids -->
            <div v-for="hour in hours" :key="hour" class="slot-grid"></div>
            
            <!-- Bookings Overlay -->
            <div v-for="booking in getBookingsForCourt(court.id)" :key="booking.id" 
                 class="booking-event"
                 :class="booking.status"
                 :style="getEventStyle(booking)">
                 <div class="event-title">{{ booking.customerName || booking.name || 'Khách' }}</div>
                 <div class="event-time">{{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VisualCalendar',
  props: {
    courts: { type: Array, default: () => [] },
    bookings: { type: Array, default: () => [] }
  },
  data() {
    return {
      startHour: 6,
      endHour: 23
    };
  },
  computed: {
    hours() {
      const h = [];
      for (let i = this.startHour; i <= this.endHour; i++) h.push(i);
      return h;
    }
  },
  methods: {
    getBookingsForCourt(courtId) {
      return this.bookings.filter(b => b.courtId === courtId || (b.court && b.court.id === courtId));
    },
    getEventStyle(booking) {
      if (!booking.startTime || !booking.endTime) return {};
      // Parsing "HH:mm" from startTime and endTime
      const s = typeof booking.startTime === 'string' && booking.startTime.includes('T') 
          ? new Date(booking.startTime).toLocaleTimeString('en-GB').slice(0,5)
          : booking.startTime.slice(0,5);
      
      const e = typeof booking.endTime === 'string' && booking.endTime.includes('T') 
          ? new Date(booking.endTime).toLocaleTimeString('en-GB').slice(0,5)
          : booking.endTime.slice(0,5);

      const [sH, sM] = s.split(':').map(Number);
      const [eH, eM] = e.split(':').map(Number);

      const sTotalMinutes = sH * 60 + sM;
      const eTotalMinutes = eH * 60 + eM;
      
      const gridStartMinutes = this.startHour * 60;
      
      const topMinutes = sTotalMinutes - gridStartMinutes;
      const heightMinutes = eTotalMinutes - sTotalMinutes;

      // Assuming each hour is 60px height
      const slotHeight = 60;
      const topPx = (topMinutes / 60) * slotHeight;
      const heightPx = (heightMinutes / 60) * slotHeight;

      return {
        top: `${topPx}px`,
        height: `${heightPx}px`,
      };
    },
    formatTime(t) {
      if (!t) return '';
      if (typeof t === 'string' && t.includes('T')) {
          return new Date(t).toLocaleTimeString('en-GB').slice(0,5);
      }
      return typeof t === 'string' ? t.slice(0,5) : t;
    }
  }
}
</script>

<style scoped>
.card {
  background: #ffffff;
  border: 1px solid #eaecf2;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 16px rgba(15,22,35,0.06);
  margin-top: 20px;
}
.card-header {
  margin-bottom: 20px;
}
.card-title-group {
  display: flex; align-items: center; gap: 10px;
}
.card-title-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #059669;
}
.card-title {
  font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #0f1623; margin: 0;
}

.calendar-wrapper {
  overflow-x: auto;
  border: 1px solid #eaecf2;
  border-radius: 12px;
}
.calendar-grid {
  display: flex;
  min-width: 600px;
}
.time-col {
  width: 60px;
  flex-shrink: 0;
  border-right: 1px solid #eaecf2;
  background: #f8fafc;
}
.court-col {
  flex: 1;
  min-width: 120px;
  border-right: 1px solid #eaecf2;
}
.court-col:last-child {
  border-right: none;
}
.header-cell {
  height: 40px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #475569;
  border-bottom: 1px solid #eaecf2; background: #f8fafc;
}
.time-cell {
  height: 60px;
  display: flex; justify-content: center;
  font-size: 11px; color: #9aa3bc; padding-top: 5px;
}
.court-slots {
  position: relative;
}
.slot-grid {
  height: 60px;
  border-bottom: 1px dashed #eaecf2;
}
.booking-event {
  position: absolute;
  left: 4px; right: 4px;
  background: #eff6ff; border-left: 3px solid #3b82f6;
  border-radius: 4px; padding: 4px;
  font-size: 11px; color: #1e3a8a;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.booking-event.PENDING { background: #fffbeb; border-color: #f59e0b; color: #78350f; }
.booking-event.CONFIRMED { background: #ecfdf5; border-color: #10b981; color: #064e3b; }
.booking-event.COMPLETED { background: #f3f4f6; border-color: #6b7280; color: #1f2937; }

.event-title { font-weight: 700; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.event-time { font-size: 10px; opacity: 0.8; }
</style>
