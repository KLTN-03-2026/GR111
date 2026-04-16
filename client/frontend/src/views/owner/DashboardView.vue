<template>
  <div class="dashboard-container">
    <!-- Header Summary Stats -->
    <div class="stats-grid">
      <StatCard 
        v-for="(stat, i) in summaryStats" 
        :key="stat.label" 
        :stat="stat" 
        :delay="i * 80" 
      />
    </div>

    <!-- Visual Calendar (Full width) -->
    <VisualCalendar :courts="courts" :bookings="allBookings" />

    <div class="content-row">
      <!-- Recent Bookings Table -->
      <div style="flex:2">
        <RecentBookings :bookings="recentBookings" />
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

    <!-- Modals -->
    <OfflineBookingModal 
      :show="showOfflineModal" 
      :courts="courts" 
      @close="showOfflineModal = false"
      @submit="submitOfflineBooking"
    />
  </div>
</template>

<script>
import StatCard from '../../components/owner/dashboard/StatCard.vue';
import RecentBookings from '../../components/owner/dashboard/RecentBookings.vue';
import QuickActions from '../../components/owner/dashboard/QuickActions.vue';
import CourtStatus from '../../components/owner/dashboard/CourtStatus.vue';
import VisualCalendar from '../../components/owner/dashboard/VisualCalendar.vue';
import OfflineBookingModal from '../../components/owner/dashboard/OfflineBookingModal.vue';

import { clubService } from '@/services/club.service';
import { courtService } from '@/services/court.service';
import { bookingService } from '@/services/booking.service';
import { toast } from 'vue3-toastify';

export default {
  name: 'OwnerDashboardView',
  components: {
    StatCard,
    RecentBookings,
    QuickActions,
    CourtStatus,
    VisualCalendar,
    OfflineBookingModal
  },
  data() {
    return {
      currentClubId: null,
      summaryStats: [
        { label: 'Doanh thu tháng này', value: '0đ', icon: 'payments',       color: 'green',  trend: 'up',   change: 0, fill: 0 },
        { label: 'Lượt đặt sân',        value: '0',          icon: 'calendar_month', color: 'blue', trend: 'up',   change: 0,  fill: 0 },
        { label: 'Khách hàng mới',      value: '0',          icon: 'group',          color: 'teal', trend: 'up',   change: 0, fill: 0 },
        { label: 'Đánh giá trung bình', value: '0 / 5',      icon: 'star',           color: 'amber',trend: 'up',   change: 0,  fill: 0 },
      ],
      allBookings: [],
      recentBookings: [],
      courts: [],
      showOfflineModal: false,
    }
  },
  async mounted() {
    await this.initDashboard();
  },
  methods: {
    async initDashboard() {
      try {
        // 1. Get clubs and select the first one
        const clubRes = await clubService.getOwnerClubs();
        if (clubRes.data.success && clubRes.data.data.length > 0) {
          // Just using the first club for dashboard preview
          this.currentClubId = clubRes.data.data[0].id;
          
          await Promise.all([
            this.fetchCourts(),
            this.fetchBookings()
          ]);
          this.updateStats();
        }
      } catch (err) {
        console.error('Failed to init dashboard', err);
      }
    },
    async fetchCourts() {
      if (!this.currentClubId) return;
      try {
        const res = await courtService.getCourts(this.currentClubId);
        if (res.data.success) {
          this.courts = res.data.data.map(c => ({
             ...c,
             status: 'available', // Example status
             statusText: 'Trống sân'
          }));
        }
      } catch (err) {
         console.error('Failed to fetch courts', err);
      }
    },
    async fetchBookings() {
      if (!this.currentClubId) return;
      try {
        const date = new Date().toISOString().split('T')[0]; // Today
        const res = await bookingService.getBookingsByClub(this.currentClubId, date);
        if (res.data.success) {
          const bookings = res.data.data || [];
          this.allBookings = bookings;
          
          // Map to recentBookings format
          this.recentBookings = bookings.map(b => ({
            id: b.id,
            name: b.customerName || 'Khách',
            phone: b.customerPhone || 'N/A',
            court: b.court?.name || 'Sân',
            time: `${this.formatTime(b.startTime)} - ${this.formatTime(b.endTime)}`,
            date: new Date(b.bookingDate).toLocaleDateString('vi-VN'),
            amount: `${b.totalPrice?.toLocaleString('vi-VN') || 0}đ`,
            method: b.paymentMethod === 'ONLINE' ? 'Chuyển khoản' : 'Tiền mặt',
            status: b.status,
            statusText: this.getStatusText(b.status),
            statusClass: this.getStatusClass(b.status)
          })).slice(0, 10); // Display only recent 10
        }
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      }
    },
    updateStats() {
      // Mock update based on loaded data
      const totalBookings = this.allBookings.length;
      let revenue = 0;
      this.allBookings.forEach(b => {
          if (b.status === 'COMPLETED' || b.status === 'CONFIRMED') revenue += (b.totalPrice || 0);
      });
      
      this.summaryStats[0].value = `${revenue.toLocaleString('vi-VN')}đ`;
      this.summaryStats[0].fill = revenue > 0 ? 80 : 0;
      this.summaryStats[1].value = `${totalBookings}`;
      this.summaryStats[1].fill = totalBookings > 0 ? 60 : 0;
      this.summaryStats[1].change = totalBookings * 2; 

      // courts status processing...
      this.courts.forEach(court => {
         const busy = this.allBookings.some(b => b.courtId === court.id && ['CONFIRMED','PENDING'].includes(b.status));
         if (busy) { court.status = 'occupied'; court.statusText = 'Đang đá'; court.session = 'Có lịch đặt'; }
      });
    },
    async submitOfflineBooking(formData) {
      if (!this.currentClubId) return;
      try {
        const payload = {
          clubId: this.currentClubId,
          ...formData, // courtId, startTime, endTime, date, customerName, customerPhone
        };
        const res = await bookingService.createManualBooking(payload);
        if (res.data.success) {
          toast.success("Đặt sân thành công!");
          this.showOfflineModal = false;
          await this.fetchBookings();
          this.updateStats();
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi đặt sân.");
      }
    },
    handleLockCourt() {
      console.log('Opening lock court modal...');
    },
    handleViewReports() {
      this.$router.push('/owner/finance');
    },
    formatTime(t) {
      if (!t) return '';
      if (typeof t === 'string' && t.includes('T')) {
          return new Date(t).toLocaleTimeString('en-GB').slice(0,5);
      }
      return typeof t === 'string' ? t.slice(0,5) : t;
    },
    getStatusText(status) {
       switch(status) {
         case 'PENDING': return 'Chờ xác nhận';
         case 'CONFIRMED': return 'Đã xác nhận';
         case 'COMPLETED': return 'Hoàn thành';
         case 'CANCELLED': return 'Đã hủy';
         default: return status;
       }
    },
    getStatusClass(status) {
       switch(status) {
         case 'PENDING': return 'warning';
         case 'CONFIRMED': return 'success';
         case 'COMPLETED': return 'info';
         case 'CANCELLED': return 'danger';
         default: return '';
       }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

.dashboard-container {
  font-family: 'Barlow Condensed', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ── Stats Grid ────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* ── Layout ────────────────────────────────────────────────── */
.content-row {
  display: flex; gap: 20px; align-items: flex-start;
}
.side-content  { flex: 1; display: flex; flex-direction: column; gap: 20px; }

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 1280px) {
  .stats-grid   { grid-template-columns: repeat(2, 1fr); }
  .content-row  { flex-direction: column; }
  .side-content { flex-direction: row; }
  .side-content > * { flex: 1; }
}

@media (max-width: 768px) {
  .stats-grid   { grid-template-columns: 1fr 1fr; }
  .side-content { flex-direction: column; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>