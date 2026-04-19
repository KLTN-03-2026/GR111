<template>
  <div class="dashboard-container">
    <!-- Dashboard Header with Filters -->
    <div class="dashboard-header">
      <div class="header-left">
        <h2 class="page-title">Tổng quan Dashboard</h2>
        <p class="page-subtitle">Quản lý hoạt động sân bãi và doanh thu từ câu lạc bộ của bạn.</p>
      </div>
      <div class="header-filters">
        <!-- Club Selector -->
        <div class="filter-group">
          <label><i class="material-icons-outlined">storefront</i> Câu lạc bộ</label>
          <select v-model="currentClubId" class="filter-select" @change="refreshAllData">
            <option v-for="club in ownerClubs" :key="club.id" :value="club.id">
              {{ club.name }}
            </option>
          </select>
        </div>
        
        <!-- Date Selector -->
        <div class="filter-group">
          <label><i class="material-icons-outlined">event</i> Ngày hiển thị</label>
          <input type="date" v-model="selectedDate" class="filter-date" @change="refreshAllData"/>
        </div>
      </div>
    </div>

    <!-- Visual Calendar (Full width) -->
    <VisualCalendar
      :courts="courts"
      :bookings="allBookings"
      :loading="calendarLoading"
      :new-booking-id="newBookingId"
      @date-change="onCalendarDateChange"
      @cell-click="onCalendarCellClick"
    />

    <div class="content-row">
      <!-- Recent Bookings Table -->
      <div style="flex:2">
        <RecentBookings 
          :bookings="recentBookings" 
          @confirm-payment="handleConfirmPayment"
          @view-booking="handleViewBooking"
        />
      </div>

      <!-- Side Panel -->
      <div class="side-content" style="flex:1">
        <!-- Quick Actions -->
        <QuickActions 
          @add-offline-booking="showOfflineModal = true"
          @lock-court="handleLockCourt"
          @view-reports="handleViewReports"
        />

        <!-- Court Status -->
        <CourtStatus :courts="courts" />
      </div>
    </div>

    <!-- Offline Booking Modal -->
    <OfflineBookingModal 
      :show="showOfflineModal" 
      :courts="courts"
      :slot-duration="slotDuration"
      ref="offlineModal"
      @close="showOfflineModal = false"
      @submit="submitOfflineBooking"
    />
  </div>
</template>

<script>
import StatCard           from '../../components/owner/dashboard/StatCard.vue';
import RecentBookings     from '../../components/owner/dashboard/RecentBookings.vue';
import QuickActions       from '../../components/owner/dashboard/QuickActions.vue';
import CourtStatus        from '../../components/owner/dashboard/CourtStatus.vue';
import VisualCalendar     from '../../components/owner/dashboard/VisualCalendar.vue';
import OfflineBookingModal from '../../components/owner/dashboard/OfflineBookingModal.vue';

import { clubService }    from '@/services/club.service';
import { courtService }   from '@/services/court.service';
import { bookingService } from '@/services/booking.service';
import { socketService }  from '@/services/socket.service.js';
import { toast }          from 'vue3-toastify';

export default {
  name: 'OwnerDashboardView',
  components: {
    StatCard, RecentBookings, QuickActions, CourtStatus, VisualCalendar, OfflineBookingModal
  },
  data() {
    return {
      currentClubId:   null,
      ownerClubs:      [],
      slotDuration:    60,   // minutes – overwritten after fetchClub
      calendarDate:    (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })(),
      selectedDate:    (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })(),
      calendarLoading: false,
      newBookingId:    null, // to pulse-highlight after create
      activeSocketVenueId: null,

      summaryStats: [
        { label: 'Doanh thu hôm nay', value: '0đ',    icon: 'payments',       color: 'green',  trend: 'up', change: 0, fill: 0 },
        { label: 'Lượt đặt sân',       value: '0',     icon: 'calendar_month', color: 'blue',   trend: 'up', change: 0, fill: 0 },
        { label: 'Khách hàng mới',     value: '0',     icon: 'group',          color: 'teal',   trend: 'up', change: 0, fill: 0 },
        { label: 'Đánh giá TB',        value: '0 / 5', icon: 'star',           color: 'amber',  trend: 'up', change: 0, fill: 0 },
      ],

      allBookings:    [],
      recentBookings: [],
      courts:         [],
      showOfflineModal: false,
    };
  },

  async mounted() {
    await this.initDashboard();
    
    // Connect socket and listen for updates
    socketService.connect();
    socketService.onBookingUpdate((data) => {
      if (data.clubId === this.currentClubId) {
        toast.info("Có đơn đặt sân mới hoặc cập nhật!");
        this.refreshAllData();
      }
    });

    // If there's a club, join its socket room
    if (this.currentClubId) {
      socketService.joinVenue(this.currentClubId);
      this.activeSocketVenueId = this.currentClubId;
    }
  },
  beforeUnmount() {
    if (this.activeSocketVenueId) {
      socketService.leaveVenue(this.activeSocketVenueId);
    }
    socketService.disconnect();
  },

  methods: {
    // ─────────────────────────────────────────────────────
    //  INIT
    // ─────────────────────────────────────────────────────
    async initDashboard() {
      try {
        const clubRes = await clubService.getOwnerClubs();
        if (clubRes.data?.success && clubRes.data.data.length > 0) {
          this.ownerClubs = clubRes.data.data;
          const club = clubRes.data.data[0];
          this.currentClubId = club.id;
          this.slotDuration  = club.slotDuration || 60;
          this.selectedDate = this.calendarDate;

          await Promise.all([this.fetchCourts(), this.fetchBookings()]);
          this.updateStats();
        }
      } catch (err) {
        console.error('Dashboard init failed', err);
      }
    },

    // ─────────────────────────────────────────────────────
    //  DATA FETCHING
    // ─────────────────────────────────────────────────────
    async fetchCourts() {
      if (!this.currentClubId) return;
      try {
        const res = await courtService.getCourts(this.currentClubId);
        if (res.data?.success) {
          this.courts = res.data.data.map(c => ({
            ...c,
            status:     'available',
            statusText: 'Trống sân',
          }));
        }
      } catch (err) {
        console.error('fetchCourts failed', err);
      }
    },

    async fetchBookings(date) {
      if (!this.currentClubId) return;
      const targetDate = date || this.calendarDate;
      this.calendarLoading = true;
      try {
        const res = await bookingService.getBookingsByClub(this.currentClubId, targetDate);
        const rawList = res.data?.data || res.data || [];

        this.allBookings = rawList;

        // Map to RecentBookings format (reads real API fields)
        this.recentBookings = rawList.map(b => {
          // items[0].timeSlot contains court + time info
          const firstItem = b.items?.[0];
          const slot      = firstItem?.timeSlot;
          const courtName = slot?.court?.name || '—';
          const startT    = slot?.startTime ? this.formatTime(slot.startTime) : '';
          const endT      = slot?.endTime   ? this.formatTime(slot.endTime)   : '';
          const moreSlots = b.items?.length > 1 ? ` +${b.items.length - 1}` : '';

          return {
            id:          b.id,
            name:        b.bookerName  || b.user?.fullName || 'Khách vãng lai',
            phone:       b.bookerPhone || b.user?.phone    || '—',
            court:       courtName + moreSlots,
            time:        startT && endT ? `${startT} – ${endT}` : '—',
            date:        new Date(slot?.startTime || b.createdAt).toLocaleDateString('vi-VN'),
            amount:      `${Number(b.finalAmount || b.totalAmount || 0).toLocaleString('vi-VN')}đ`,
            method:      b.payment?.method === 'CASH' ? 'Tiền mặt' : (b.payment?.method || '—'),
            status:      b.status,
            statusText:  this.getStatusText(b.status),
            statusClass: this.getStatusClass(b.status),
          };
        }).slice(0, 10);

      } catch (err) {
        console.error('fetchBookings failed', err);
      } finally {
        this.calendarLoading = false;
      }
    },

    // ─────────────────────────────────────────────────────
    //  STATS
    // ─────────────────────────────────────────────────────
    updateStats() {
      const total   = this.allBookings.length;
      let revenue   = 0;
      this.allBookings.forEach(b => {
        if (['COMPLETED', 'CONFIRMED'].includes(b.status)) {
          revenue += Number(b.finalAmount || b.totalAmount || 0);
        }
      });

      this.summaryStats[0].value = `${revenue.toLocaleString('vi-VN')}đ`;
      this.summaryStats[0].fill  = revenue > 0 ? Math.min(revenue / 5000000 * 100, 100) : 0;
      this.summaryStats[1].value = String(total);
      this.summaryStats[1].fill  = total > 0 ? Math.min(total / 20 * 100, 100) : 0;
      this.summaryStats[1].change = total;

      // Update court busy status
      this.courts.forEach(court => {
        const busyBooking = this.allBookings.find(b =>
          b.items?.some(i => i.timeSlot?.court?.id === court.id || i.timeSlot?.courtId === court.id)
          && ['CONFIRMED', 'PENDING'].includes(b.status)
        );
        if (busyBooking) {
          court.status     = 'occupied';
          court.statusText = 'Đang có lịch';
          court.session    = `${busyBooking.bookerName || 'Khách'}`;
        }
      });
    },

    // ─────────────────────────────────────────────────────
    //  CALENDAR EVENTS
    // ─────────────────────────────────────────────────────
    async onCalendarDateChange(dateStr) {
      this.calendarDate = dateStr;
      this.selectedDate = dateStr;
      await this.fetchBookings(dateStr);
    },

    onCalendarCellClick({ court, hour }) {
      // Pre-fill offline modal with selected court & hour
      this.showOfflineModal = true;
      this.$nextTick(() => {
        if (this.$refs.offlineModal) {
          this.$refs.offlineModal.form.courtId   = court.id;
          this.$refs.offlineModal.form.startHour = hour;
          this.$refs.offlineModal.form.date      = this.calendarDate;
        }
      });
    },

    // ─────────────────────────────────────────────────────
    //  OFFLINE BOOKING
    // ─────────────────────────────────────────────────────
    async submitOfflineBooking(payload) {
      if (!this.currentClubId) return;
      try {
        const fullPayload = { clubId: this.currentClubId, ...payload };
        const res = await bookingService.createManualBooking(fullPayload);
        const created = res.data || res;

        if (created?.success !== false) {
          toast.success('✅ Đặt sân thành công! Lịch đã được cập nhật.');
          this.showOfflineModal = false;
          this.$refs.offlineModal?.resetForm();

          // Highlight new booking on calendar
          this.newBookingId = created?.data?.id || created?.id || null;
          setTimeout(() => { this.newBookingId = null; }, 8000);

          // Reload calendar for same date
          await this.fetchBookings(this.calendarDate);
          this.updateStats();
        } else {
          this.$refs.offlineModal?.setError(created?.message || 'Đặt sân thất bại.');
          toast.error(created?.message || 'Đặt sân thất bại.');
        }
      } catch (err) {
        const msg = err?.response?.data?.message || 'Lỗi kết nối. Vui lòng thử lại.';
        this.$refs.offlineModal?.setError(msg);
        this.$refs.offlineModal?.setSubmitting(false);
        toast.error(msg);
      }
    },

    // ─────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────
    async refreshAllData() {
      if (!this.currentClubId) return;
      if (this.selectedDate) {
        this.calendarDate = this.selectedDate;
      }

      this.ensureSocketVenueSubscription();
      await Promise.all([this.fetchCourts(), this.fetchBookings(this.calendarDate)]);
      this.updateStats();
    },

    ensureSocketVenueSubscription() {
      if (!this.currentClubId || this.currentClubId === this.activeSocketVenueId) return;

      if (this.activeSocketVenueId) {
        socketService.leaveVenue(this.activeSocketVenueId);
      }
      socketService.joinVenue(this.currentClubId);
      this.activeSocketVenueId = this.currentClubId;
    },

    async handleConfirmPayment(booking) {
      if (!booking?.id) return;
      try {
        const res = await bookingService.confirmPayment(booking.id);
        if (res?.success === false) {
          toast.error(res?.message || 'Xác nhận thanh toán thất bại.');
          return;
        }
        toast.success('Đã xác nhận thanh toán.');
        await this.refreshAllData();
      } catch (err) {
        const msg = err?.response?.data?.message || 'Không thể xác nhận thanh toán.';
        toast.error(msg);
      }
    },

    handleViewBooking(booking) {
      if (!booking?.id) return;
      this.$router.push({ path: '/owner/bookings', query: { bookingId: String(booking.id) } });
    },

    handleLockCourt()   { console.log('Lock court – TODO'); },
    handleViewReports() { this.$router.push('/owner/finance'); },

    formatTime(t) {
      if (!t) return '';
      const d = new Date(t);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    },

    getStatusText(s) {
      return { PENDING:'Chờ xác nhận', CONFIRMED:'Đã xác nhận', WAITING_PAYMENT:'Chờ TT',
               COMPLETED:'Hoàn thành', CANCELLED:'Đã hủy' }[s] || s;
    },
    getStatusClass(s) {
      return { PENDING:'warning', CONFIRMED:'success', WAITING_PAYMENT:'info',
               COMPLETED:'info',  CANCELLED:'danger' }[s] || '';
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

.dashboard-container {
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ── Stats Grid ────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* ── Layout ────────────────────────── */
.content-row   { display: flex; gap: 20px; align-items: flex-start; }
.side-content  { flex: 1; display: flex; flex-direction: column; gap: 20px; }

/* ── Responsive ────────────────────── */
@media (max-width: 1280px) {
  .stats-grid  { grid-template-columns: repeat(2, 1fr); }
  .content-row { flex-direction: column; }
  .side-content { flex-direction: row; }
  .side-content > * { flex: 1; }
}
@media (max-width: 768px) {
  .header-filters { flex-direction: column; }
  .stats-grid   { grid-template-columns: 1fr 1fr; }
  .side-content { flex-direction: column; }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>