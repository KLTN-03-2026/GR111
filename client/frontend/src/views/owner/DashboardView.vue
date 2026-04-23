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
      <div class="content-main">
        <RecentBookings 
          :bookings="recentBookings" 
          @confirm-payment="handleConfirmPayment"
          @view-booking="handleViewBooking"
        />
      </div>

      <!-- Side Panel -->
      <aside class="side-content">
        <!-- Quick Actions -->
        <QuickActions 
          @add-offline-booking="showOfflineModal = true"
          @lock-court="handleLockCourt"
          @view-reports="handleViewReports"
        />

        <!-- Court Status -->
        <CourtStatus :courts="courts" />
      </aside>
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

    <PaymentProofNotificationModal
      :show="showPaymentProofModal"
      :booking="paymentProofModalBooking"
      :confirming="paymentProofConfirmLoading"
      @close="closePaymentProofModal"
      @confirm="handlePaymentProofModalConfirm"
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
import PaymentProofNotificationModal from '../../components/owner/dashboard/PaymentProofNotificationModal.vue';

import { clubService }    from '@/services/club.service';
import { courtService }   from '@/services/court.service';
import { bookingService } from '@/services/booking.service';
import { socketService }  from '@/services/socket.service.js';
import { toast }          from 'vue3-toastify';

export default {
  name: 'OwnerDashboardView',
  components: {
    StatCard,
    RecentBookings,
    QuickActions,
    CourtStatus,
    VisualCalendar,
    OfflineBookingModal,
    PaymentProofNotificationModal,
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

      showPaymentProofModal: false,
      paymentProofModalBooking: null,
      paymentProofConfirmLoading: false,
    };
  },

  async mounted() {
    await this.initDashboard();
    
    // Connect socket and listen for updates (callback phải gán trước khi join-venue để nhận recent-notifications)
    socketService.connect();
    socketService.onBookingUpdate(async (data) => {
      const clubId = data?.booking?.clubId ?? data?.clubId;
      if (!clubId || String(clubId) !== String(this.currentClubId)) return;

      if (data?.type === 'payment-proof-submitted') {
        toast.info('Khách đã gửi minh chứng chuyển khoản.');
        const bid = data?.booking?.id;
        if (bid) await this.openPaymentProofModalByBookingId(bid);
        await this.refreshAllData();
      } else {
        toast.info('Có đơn đặt sân mới hoặc cập nhật.');
        await this.refreshAllData();
      }
    });

    socketService.onRecentNotifications(async (list) => {
      if (!Array.isArray(list) || !list.length || !this.currentClubId) return;
      const cid = String(this.currentClubId);
      const relevant = list.filter((n) => {
        const id = n?.booking?.clubId ?? n?.clubId;
        return id && String(id) === cid;
      });
      const proof = [...relevant].reverse().find((n) => n.type === 'payment-proof-submitted');
      if (proof?.booking?.id && !this.showPaymentProofModal) {
        await this.openPaymentProofModalByBookingId(proof.booking.id);
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

          const payMethod = b.payment?.method;
          const methodLabel =
            payMethod === 'CASH'
              ? 'Tiền mặt'
              : payMethod === 'BANK_TRANSFER'
                ? 'Chuyển khoản'
                : payMethod || '—';

          const canConfirmPayment =
            b.status === 'PENDING' ||
            (b.status === 'WAITING_PAYMENT' &&
              payMethod === 'BANK_TRANSFER' &&
              !!b.payment?.proofImageUrl);

          return {
            id:          b.id,
            name:        b.bookerName  || b.user?.fullName || 'Khách vãng lai',
            phone:       b.bookerPhone || b.user?.phone    || '—',
            court:       courtName + moreSlots,
            time:        startT && endT ? `${startT} – ${endT}` : '—',
            date:        new Date(slot?.startTime || b.createdAt).toLocaleDateString('vi-VN'),
            amount:      `${Number(b.finalAmount || b.totalAmount || 0).toLocaleString('vi-VN')}đ`,
            method:      methodLabel,
            status:      b.status,
            statusText:  this.getStatusText(b.status),
            statusClass: this.getStatusClass(b.status),
            canConfirmPayment,
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
        this.closePaymentProofModal();
        await this.refreshAllData();
      } catch (err) {
        const msg = err?.response?.data?.message || 'Không thể xác nhận thanh toán.';
        toast.error(msg);
      }
    },

    closePaymentProofModal() {
      this.showPaymentProofModal = false;
      this.paymentProofModalBooking = null;
      this.paymentProofConfirmLoading = false;
    },

    /** Tải toàn bộ đơn CLB (không lọc ngày) để mở modal khi socket báo có proof — đơn có thể không thuộc ngày đang xem lịch */
    async openPaymentProofModalByBookingId(bookingId) {
      if (!this.currentClubId || !bookingId) return;
      try {
        const res = await bookingService.getBookingsByClub(this.currentClubId);
        const rawList = res.data?.data || res.data || [];
        const b = rawList.find((x) => String(x.id) === String(bookingId));
        if (b?.payment?.proofImageUrl) {
          this.paymentProofModalBooking = b;
          this.showPaymentProofModal = true;
        }
      } catch (e) {
        console.error('openPaymentProofModalByBookingId', e);
      }
    },

    async handlePaymentProofModalConfirm(booking) {
      if (!booking?.id) return;
      this.paymentProofConfirmLoading = true;
      try {
        const res = await bookingService.confirmPayment(booking.id);
        if (res?.success === false) {
          toast.error(res?.message || 'Xác nhận thanh toán thất bại.');
          return;
        }
        toast.success('Đã xác nhận thanh toán.');
        this.closePaymentProofModal();
        await this.refreshAllData();
      } catch (err) {
        const msg = err?.response?.data?.message || 'Không thể xác nhận thanh toán.';
        toast.error(msg);
      } finally {
        this.paymentProofConfirmLoading = false;
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
  max-width: 100%;
}

/* ── Header & filters ───────────────── */
.dashboard-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.header-left {
  flex: 1;
  min-width: min(100%, 260px);
}

.page-title {
  font-family: 'Syne', sans-serif;
  font-size: clamp(1.25rem, 4vw, 1.75rem);
  font-weight: 800;
  color: #0f1623;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.5;
  max-width: 42rem;
}

.header-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 160px;
}

.filter-group label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.filter-group label .material-icons-outlined {
  font-size: 18px;
  color: #059669;
}

.filter-select,
.filter-date {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #eaecf2;
  font-size: 15px;
  font-family: inherit;
  font-weight: 500;
  color: #0f1623;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 22, 35, 0.04);
  width: 100%;
  box-sizing: border-box;
}

.filter-select:focus,
.filter-date:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
}

/* ── Stats Grid (reserved) ───────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* ── Main layout ─────────────────────── */
.content-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.content-main {
  flex: 2;
  min-width: 0;
}

.side-content {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Responsive ──────────────────────── */
@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-row {
    flex-direction: column;
  }

  .content-main,
  .side-content {
    flex: none;
    width: 100%;
    min-width: 0;
  }

  .side-content {
    flex-direction: row;
    order: -1;
  }

  .side-content > * {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    gap: 20px;
  }

  .header-filters {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 0;
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .side-content {
    flex-direction: column;
    order: -1;
  }

  .side-content > * {
    flex: none;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-subtitle {
    font-size: 0.8125rem;
  }
}
</style>