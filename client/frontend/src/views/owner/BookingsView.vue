<template>
  <div class="bookings-page">
    <!-- PREMIUM HEADER -->
    <div class="view-header">
      <div class="container py-4">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h1 class="page-title-p mb-0">Quản lý Đơn đặt sân</h1>
            <p class="page-subtitle-p d-none d-md-block">Theo dõi lịch trình sân bãi và quản lý yêu cầu từ khách hàng chuyên nghiệp.</p>
          </div>

          <div class="view-switch-p">
            <button 
              class="switch-btn-p" 
              :class="{ active: currentView === 'calendar' }"
              @click="currentView = 'calendar'"
            >
              <span class="material-icons">calendar_view_day</span>
              <span class="d-none d-sm-inline">Lịch trực quan</span>
            </button>
            <button 
              class="switch-btn-p" 
              :class="{ active: currentView === 'list' }"
              @click="currentView = 'list'"
            >
              <span class="material-icons">list_alt</span>
              <span class="d-none d-sm-inline">Danh sách</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <!-- STATS BENTO GRID -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-box-p">
            <div class="stat-box__icon total"><span class="material-icons">receipt_long</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ stats.total }}</div>
              <div class="stat-box__label">Tổng đơn hôm nay</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-box-p">
            <div class="stat-box__icon revenue"><span class="material-icons">payments</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ formatCurrency(stats.revenue) }}</div>
              <div class="stat-box__label">Doanh thu dự kiến</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-box-p">
            <div class="stat-box__icon pending"><span class="material-icons">pending_actions</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ stats.pending }}</div>
              <div class="stat-box__label">Chờ xử lý</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-box-p">
            <div class="stat-box__icon completed"><span class="material-icons">check_circle_outline</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ stats.completed }}</div>
              <div class="stat-box__label">Đã hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TOOLBAR: DATE & FILTERS -->
      <div class="toolbar-card mb-4">
        <div class="row align-items-center g-3">
          <div class="col-lg-4">
            <div class="date-navigator-p">
              <button class="nav-btn-p" @click="prevDay">
                <span class="material-icons">chevron_left</span>
              </button>
              <div class="current-date-box-p">
                <span class="material-icons">calendar_today</span>
                <span class="date-text-p">{{ formattedDate }}</span>
              </div>
              <button class="nav-btn-p" @click="nextDay">
                <span class="material-icons">chevron_right</span>
              </button>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="filter-group-p">
              <div class="filter-item-p">
                <span class="material-icons">business</span>
                <select v-model="selectedClubId" class="select-p">
                  <option v-for="club in clubs" :key="club.id" :value="club.id">{{ club.name }}</option>
                </select>
              </div>
              <div class="filter-item-p" v-if="currentView === 'list'">
                <span class="material-icons">filter_alt</span>
                <select v-model="statusFilter" class="select-p">
                  <option value="all">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ thanh toán</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          <div class="col-lg-3 text-lg-end">
            <div class="action-group-p">
               <button class="btn-icon-p" @click="refreshData" :disabled="isLoading" title="Tải lại">
                  <span class="material-icons" :class="{ 'spin': isLoading }">refresh</span>
               </button>
               <button class="btn-premium btn-premium--emerald shadow-emerald">
                 <span class="material-icons">add_circle</span>
                 <span>Đặt sân hộ</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW CONTENTS -->
      <div class="view-content-wrapper">
        <div v-if="isLoading" class="loader-wrapper py-5">
          <div class="spinner-premium"></div>
          <p class="mt-4 loader-text">Đang tải dữ liệu đơn hàng...</p>
        </div>

        <template v-else>
          <!-- 1. CALENDAR VIEW -->
          <div v-if="currentView === 'calendar'" class="calendar-card fade-in">
            <div class="calendar-scroll-x">
              <div class="calendar-grid-p">
                <!-- Time Column -->
                <div class="time-column-p">
                  <div class="grid-header-p">Thời gian</div>
                  <div v-for="h in timeSlots" :key="h" class="time-slot-p">{{ h }}</div>
                </div>
                
                <!-- Court Columns -->
                <div class="court-columns-p">
                  <div v-for="court in currentClubCourts" :key="court.id" class="court-column-p">
                    <div class="grid-header-p court">
                      <span class="court-name-p">{{ court.name }}</span>
                      <span class="court-type-p">{{ court.sportType }}</span>
                    </div>
                    
                    <div class="slots-container-p">
                      <div v-for="h in timeSlots" :key="h" class="slot-cell-p">
                        <!-- Booking Entry (1 ô = 1 giờ; nhiều slot 30p liên tiếp gộp 1 khối) -->
                        <div 
                          v-if="getBookingForSlot(court.id, h)" 
                          class="booking-item-p" 
                          :class="getBookingForSlot(court.id, h).status"
                          :style="bookingCalendarBlockStyle(getBookingForSlot(court.id, h))"
                          @click="openDetail(getBookingForSlot(court.id, h).originalBooking)"
                        >
                          <div class="booking-inner-p">
                            <p class="b-name-p">{{ getBookingForSlot(court.id, h).customerName }}</p>
                            <p class="b-time-p">{{ getBookingForSlot(court.id, h).startTime }} - {{ getBookingForSlot(court.id, h).endTime }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. LIST VIEW -->
          <div v-else class="list-card-p fade-in">
            <div v-if="filteredBookings.length === 0" class="empty-state-p py-5">
              <div class="empty-icon-wrapper">
                <span class="material-icons">event_busy</span>
              </div>
              <h3 class="empty-title">Không tìm thấy đơn nào</h3>
              <p class="empty-text">Chưa có đơn đặt sân nào cho ngày và bộ lọc đã chọn.</p>
            </div>
            
            <div v-else class="table-responsive">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sân</th>
                    <th>Thời gian</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th class="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="booking in filteredBookings" :key="`${booking.id}-${booking.courtId}-${booking.startTime}`">
                    <td><span class="order-id-p">#{{ booking.id.slice(-6) }}</span></td>
                    <td>
                      <div class="user-cell-p">
                        <div class="u-avatar-p">{{ booking.customerName.charAt(0) }}</div>
                        <div>
                          <p class="u-name-p">{{ booking.customerName }}</p>
                          <p class="u-phone-p">{{ booking.phone }}</p>
                        </div>
                      </div>
                    </td>
                    <td><span class="court-tag-p">{{ booking.courtName }}</span></td>
                    <td>
                      <div class="time-cell-p">
                        <p class="t-main-p">{{ booking.startTime }} - {{ booking.endTime }}</p>
                        <p class="t-sub-p">{{ booking.date }}</p>
                      </div>
                    </td>
                    <td><span class="amount-p">{{ formatCurrency(booking.amount) }}</span></td>
                    <td>
                      <span :class="['status-pill-p', booking.status.toLowerCase()]">
                        {{ getStatusLabel(booking.status) }}
                      </span>
                    </td>
                    <td class="text-end">
                      <div class="action-cell-p">
                        <button class="btn-action-p view" @click="openDetailById(booking.id)" title="Chi tiết">
                          <span class="material-icons">visibility</span>
                        </button>
                        <button 
                          v-if="booking.status === 'PENDING' || booking.status === 'WAITING_PAYMENT'" 
                          class="btn-action-p confirm" 
                          @click="handleConfirmPayment(booking.id)" 
                          title="Xác nhận thanh toán"
                        >
                          <span class="material-icons">check_circle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <transition name="modal-fade">
      <div v-if="detailBooking" class="modal-overlay-p" @click.self="detailBooking = null">
        <div class="modal-card-p wide">
          <div class="modal-card__header-p">
            <div class="d-flex align-items-center gap-3">
              <div class="modal-icon-p"><span class="material-icons">receipt_long</span></div>
              <div>
                <h2 class="modal-title-p">Chi tiết Đơn hàng</h2>
                <span class="modal-booking-code">Mã đơn: #{{ detailBooking.id }} ({{ detailBooking.bookingCode }})</span>
              </div>
            </div>
            <button class="modal-close-btn-p" @click="detailBooking = null">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="modal-card__body-p">
            <div class="row g-4">
              <!-- Left: Info -->
              <div class="col-md-7">
                <div class="detail-section-p">
                  <h4 class="section-title-p">Thông tin khách hàng</h4>
                  <div class="customer-info-card mb-4">
                    <div class="d-flex align-items-center gap-3">
                      <div class="u-avatar-large">{{ (detailBooking.bookerName || 'K').charAt(0) }}</div>
                      <div>
                        <div class="cust-name">{{ detailBooking.bookerName || detailBooking.user?.fullName || 'Khách vãng lai' }}</div>
                        <div class="cust-meta">
                          <span class="material-icons">phone</span> {{ detailBooking.bookerPhone || detailBooking.user?.phone || 'N/A' }}
                        </div>
                        <div class="cust-meta">
                          <span class="material-icons">email</span> {{ detailBooking.bookerEmail || detailBooking.user?.email || 'N/A' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h4 class="section-title-p">Sân & Thời gian</h4>
                  <div class="venue-detail-card-p mb-4">
                    <div v-for="item in detailBooking.items" :key="item.id" class="slot-item-p">
                      <div class="slot-info">
                        <span class="court-name-modal">{{ item.timeSlot.court.name }}</span>
                        <span class="slot-time-modal">{{ formatSlotTime(item.timeSlot) }}</span>
                      </div>
                      <div class="slot-price-modal">{{ formatCurrency(item.price) }}</div>
                    </div>
                  </div>

                  <div v-if="detailBooking.note" class="note-section-p">
                    <h4 class="section-title-p">Ghi chú</h4>
                    <div class="note-box-p">{{ detailBooking.note }}</div>
                  </div>
                </div>
              </div>

              <!-- Right: Payment -->
              <div class="col-md-5">
                <div class="detail-section-p">
                  <h4 class="section-title-p">Thanh toán & Trạng thái</h4>
                  <div class="booking-status-card mb-4">
                     <div class="status-row">
                       <span class="label">Trạng thái đơn:</span>
                       <span :class="['status-pill-p', detailBooking.status.toLowerCase()]">{{ getStatusLabel(detailBooking.status) }}</span>
                     </div>
                     <div class="status-row mt-3">
                       <span class="label">Hình thức:</span>
                       <span class="value">{{ payLabel(detailBooking.payment?.method) }}</span>
                     </div>
                  </div>

                  <div class="payment-summary-card-p">
                    <div class="summary-line-p">
                      <span>Tạm tính</span>
                      <span>{{ formatCurrency(detailBooking.totalAmount) }}</span>
                    </div>
                    <div v-if="detailBooking.discountAmount > 0" class="summary-line-p discount">
                      <span>Giảm giá</span>
                      <span>-{{ formatCurrency(detailBooking.discountAmount) }}</span>
                    </div>
                    <div class="summary-line-p total mt-3 pt-3">
                      <span>Tổng cộng</span>
                      <span class="total-val">{{ formatCurrency(detailBooking.finalAmount) }}</span>
                    </div>
                  </div>

                  <!-- Payment Proof mapping if exists -->
                  <div v-if="detailBooking.payment?.proofImageUrl" class="proof-section mt-4">
                    <h4 class="section-title-p">Minh chứng thanh toán</h4>
                    <div class="proof-card-p" @click="openImage(detailBooking.payment.proofImageUrl)">
                      <img :src="detailBooking.payment.proofImageUrl" alt="Proof" />
                      <div class="proof-overlay-p">
                        <span class="material-icons">zoom_in</span>
                        <span>Xem ảnh lớn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-card__footer-p">
            <div class="d-flex gap-2">
              <button 
                v-if="detailBooking.status === 'PENDING' || detailBooking.status === 'WAITING_PAYMENT'" 
                class="btn-premium btn-premium--emerald shadow-emerald flex-grow-1"
                @click="handleConfirmPayment(detailBooking.id)"
              >
                Xác nhận đã nhận tiền
              </button>
              <button 
                v-if="detailBooking.status === 'CONFIRMED'" 
                class="btn-premium btn-premium--dark flex-grow-1"
                @click="handleCompleteBooking(detailBooking.id)"
              >
                Đánh dấu đã hoàn thành
              </button>
              <button 
                v-if="['PENDING', 'WAITING_PAYMENT', 'CONFIRMED'].includes(detailBooking.status)" 
                class="btn-premium btn-premium--light text-danger"
                @click="handleCancelBooking(detailBooking.id)"
              >
                Hủy đơn
              </button>
              <button class="btn-premium btn-premium--light" @click="detailBooking = null">Đóng</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import { formatYmdVietnam } from '@/utils/dateInput';
import { bookingService } from '@/services/booking.service';
import { dashboardService } from '@/services/dashboard.service';
import { toast } from 'vue3-toastify';

export default {
  name: 'OwnerBookingsView',
  data() {
    return {
      currentView: 'calendar',
      selectedClubId: '',
      currentDate: new Date(),
      statusFilter: 'all',
      clubs: [],
      courts: [],
      rawBookings: [], // Mapped for display
      fullBookingData: [], // Original structure from BE
      isLoading: false,
      detailBooking: null,
    }
  },
  computed: {
    formattedDate() {
      return this.currentDate.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    currentClubCourts() {
      const club = this.clubs.find(c => c.id === this.selectedClubId);
      return club ? club.courts : [];
    },
    /** Lịch dạng bảng: mỗi hàng = đúng 1 giờ (không chia theo slotDuration 30p). */
    timeSlots() {
      const selectedClub = this.clubs.find(c => c.id === this.selectedClubId);
      if (!selectedClub) return [];

      let startHour = 5, startMin = 0, endHour = 23, endMin = 0;

      if (selectedClub.openingHours && selectedClub.openingHours.length > 0) {
        const currentDayOfWeek = this.currentDate.getDay();
        const todayOh = selectedClub.openingHours.find(oh => oh.dayOfWeek === currentDayOfWeek);
        if (todayOh && !todayOh.isClosed) {
          const openD = new Date(todayOh.openTime);
          const closeD = new Date(todayOh.closeTime);
          startHour = openD.getUTCHours();
          startMin = openD.getUTCMinutes();
          endHour = closeD.getUTCHours();
          endMin = closeD.getUTCMinutes();

          if (endHour < startHour || (endHour === startHour && endMin <= startMin)) {
            endHour += 24;
          }
        }
      }

      let currentTotalMin = startHour * 60 + startMin;
      let endTotalMin = endHour * 60 + endMin;
      currentTotalMin = Math.floor(currentTotalMin / 60) * 60;
      endTotalMin = Math.ceil(endTotalMin / 60) * 60;

      const slots = [];
      while (currentTotalMin < endTotalMin) {
        const h24 = Math.floor(currentTotalMin / 60);
        const displayH = ((h24 % 24) + 24) % 24;
        const displayM = currentTotalMin % 60;
        slots.push(`${displayH.toString().padStart(2, '0')}:${displayM.toString().padStart(2, '0')}`);
        currentTotalMin += 60;
      }
      return slots;
    },
    /**
     * Gộp các timeSlot liên tiếp (cùng đơn + cùng sân), map key `courtId|HH:00` của giờ bắt đầu.
     */
    calendarSlotMap() {
      const map = Object.create(null);
      const TOL_MS = 60_000;
      const fmt = (d) => {
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      };
      const rowLabel = (d) => `${String(d.getHours()).padStart(2, '0')}:00`;

      const pushCell = (booking, courtId, cur) => {
        const durMin = (cur.end.getTime() - cur.start.getTime()) / 60000;
        const spanHours = Math.max(1, Math.ceil(durMin / 60));
        const key = `${courtId}|${rowLabel(cur.start)}`;
        map[key] = {
          customerName: booking.bookerName || booking.user?.fullName || 'Khách vãng lai',
          startTime: fmt(cur.start),
          endTime: fmt(cur.end),
          spanHours,
          status: booking.status,
          originalBooking: booking,
        };
      };

      for (const booking of this.fullBookingData) {
        if (!booking.items?.length) continue;
        const byCourt = new Map();
        for (const item of booking.items) {
          if (!item.timeSlot?.court) continue;
          const cid = item.timeSlot.courtId;
          if (!byCourt.has(cid)) byCourt.set(cid, []);
          byCourt.get(cid).push({
            start: new Date(item.timeSlot.startTime),
            end: new Date(item.timeSlot.endTime),
          });
        }
        for (const [courtId, intervals] of byCourt) {
          intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
          let cur = { start: new Date(intervals[0].start), end: new Date(intervals[0].end) };
          for (let i = 1; i < intervals.length; i++) {
            const n = intervals[i];
            const gap = n.start.getTime() - cur.end.getTime();
            if (Math.abs(gap) <= TOL_MS) {
              if (n.end.getTime() > cur.end.getTime()) cur.end = new Date(n.end);
            } else {
              pushCell(booking, courtId, cur);
              cur = { start: new Date(n.start), end: new Date(n.end) };
            }
          }
          pushCell(booking, courtId, cur);
        }
      }
      return map;
    },
    stats() {
      const bookings = this.fullBookingData;
      return {
        total: bookings.length,
        revenue: bookings.reduce((sum, b) => sum + (b.status !== 'CANCELLED' ? Number(b.finalAmount) : 0), 0),
        pending: bookings.filter(b => ['PENDING', 'WAITING_PAYMENT'].includes(b.status)).length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length
      };
    },
    filteredBookings() {
      return this.rawBookings.filter(b => {
        const statusMatch = this.statusFilter === 'all' || b.status === this.statusFilter;
        return statusMatch;
      });
    }
  },
  watch: {
    selectedClubId(newVal, oldVal) {
      if (newVal) {
        this.fetchBookings();
      }
    },
    currentDate() {
      this.fetchBookings();
    }
  },
  async mounted() {
    this._onOwnerBookingRealtime = (ev) => {
      const data = ev.detail;
      const cid = data?.clubId ?? data?.booking?.clubId;
      if (!this.selectedClubId || !cid || String(cid) !== String(this.selectedClubId)) return;
      this.fetchBookings();
    };
    window.addEventListener('owner-booking-realtime', this._onOwnerBookingRealtime);

    await this.fetchClubs();
  },
  beforeUnmount() {
    if (this._onOwnerBookingRealtime) {
      window.removeEventListener('owner-booking-realtime', this._onOwnerBookingRealtime);
    }
  },
  methods: {
    async fetchClubs() {
      try {
        const response = await dashboardService.getClubs();
        if (response.success && response.data.length > 0) {
          this.clubs = response.data;
          this.selectedClubId = response.data[0].id;
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách CLB:", error);
        toast.error("Không thể tải danh sách CLB");
      }
    },
    async fetchBookings() {
      if (!this.selectedClubId) return;
      this.isLoading = true;
      try {
        const dateStr = formatYmdVietnam(this.currentDate);
        const response = await bookingService.getBookingsByClub(this.selectedClubId, dateStr);
        console.log("Fetch Bookings Response:", response);
        if (response.success) {
          const rawData = response.data || [];
          this.fullBookingData = rawData;
          
          const formatTime = (date) => {
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
          };

          const formatted = [];
          for (const booking of rawData) {
            if (!booking.items || !Array.isArray(booking.items)) {
              console.warn("Booking has no items:", booking.id);
              continue;
            }
            for (const item of booking.items) {
              if (!item.timeSlot || !item.timeSlot.court) {
                console.warn("Item missing timeSlot or court:", item.id);
                continue;
              }

              const start = new Date(item.timeSlot.startTime);
              const end = new Date(item.timeSlot.endTime);
              
              formatted.push({
                id: booking.id,
                clubId: booking.clubId,
                courtId: item.timeSlot.courtId,
                courtName: item.timeSlot.court.name,
                customerName: booking.bookerName || booking.user?.fullName || 'Khách vãng lai',
                phone: booking.bookerPhone || booking.user?.phone || 'N/A',
                startTime: formatTime(start),
                endTime: formatTime(end),
                date: start.toLocaleDateString('vi-VN'),
                amount: Number(item.price),
                status: booking.status,
                originalBooking: booking
              });
            }
          }
          this.rawBookings = formatted;
          console.log("Mapped rawBookings:", this.rawBookings);
          await this.tryOpenBookingFromHandoff();
        }
      } catch (error) {
        console.error("Lỗi tải bản ghi booking:", error);
        toast.error("Lỗi tải dữ liệu đơn đặt sân");
      } finally {
        this.isLoading = false;
      }
    },

    async tryOpenBookingFromHandoff() {
      const qid = this.$route.query.bookingId;
      if (!qid) return;
      try {
        const raw = sessionStorage.getItem('owner_prefill_booking_detail');
        if (raw) {
          const b = JSON.parse(raw);
          if (String(b.id) === String(qid)) {
            this.detailBooking = b;
            sessionStorage.removeItem('owner_prefill_booking_detail');
            return;
          }
        }
      } catch (_) { /* ignore */ }
      this.openDetailById(qid);
    },
    getBookingForSlot(courtId, slotLabel) {
      return this.calendarSlotMap[`${courtId}|${slotLabel}`] || null;
    },
    bookingCalendarBlockStyle(cell) {
      const span = cell?.spanHours || 1;
      const h = 70;
      return {
        minHeight: `${span * h - 8}px`,
        zIndex: span > 1 ? 2 : 1,
      };
    },
    getStatusLabel(status) {
      const labels = {
        WAITING_PAYMENT: 'Chờ thanh toán',
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy'
      };
      return labels[status] || status;
    },
    payLabel(method) {
      const map = { BANK_TRANSFER: 'Chuyển khoản', MOMO: 'MoMo', VNPAY: 'VNPAY', CREDIT_CARD: 'Thẻ QT', CASH: 'Tiền mặt' };
      return map[method] || 'Chưa chọn';
    },
    formatCurrency(val) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    },
    formatSlotTime(slot) {
      const start = new Date(slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(slot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${start} – ${end}`;
    },
    prevDay() {
      const d = new Date(this.currentDate);
      d.setDate(d.getDate() - 1);
      this.currentDate = d;
    },
    nextDay() {
      const d = new Date(this.currentDate);
      d.setDate(d.getDate() + 1);
      this.currentDate = d;
    },
    refreshData() {
      this.fetchBookings();
    },
    openDetail(booking) {
      this.detailBooking = booking;
    },
    openDetailById(id) {
      const booking = this.fullBookingData.find(b => b.id === id);
      if (booking) this.detailBooking = booking;
    },
    async handleConfirmPayment(bookingId) {
      if(!confirm("Bạn có chắc chắn muốn xác nhận thanh toán?")) return;
      try {
        const response = await bookingService.confirmPayment(bookingId);
        if(response.success){
          toast.success("Xác nhận thanh toán thành công");
          this.detailBooking = null;
          await this.fetchBookings();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Xác nhận thanh toán thất bại");
      }
    },
    async handleCancelBooking(bookingId) {
      if(!confirm("Bạn có chắc chắn muốn hủy đặt sân?")) return;
      try {
        const response = await bookingService.updateStatus(bookingId, 'CANCELLED');
        if(response.success){
          toast.success("Hủy đặt sân thành công");
          this.detailBooking = null;
          await this.fetchBookings(); 
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Hủy đặt sân thất bại");
      }
    },
    async handleCompleteBooking(bookingId) {
      if(!confirm("Khách đã chơi xong chưa?")) return;
      try {
        const response = await bookingService.updateStatus(bookingId, 'COMPLETED');
        if(response.success){
          toast.success("Đã hoàn thành lượt chơi");
          this.detailBooking = null;
          await this.fetchBookings();
        }
      } catch (error) {
        toast.error("Cập nhật thất bại");
      }
    },
    openImage(url) { window.open(url, '_blank'); }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');

.bookings-page {
  font-family: 'Lexend', sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
  color: #0f172a;
}

/* ── HEADER ── */
.view-header {
  background: white;
  border-bottom: 1px solid #edf2f7;
  position: sticky;
  top: 0;
  z-index: 101;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.page-title-p {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 1.75rem;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: -0.01em;
}
.page-subtitle-p {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.view-switch-p {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 14px;
}
.switch-btn-p {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.switch-btn-p.active {
  background: white;
  color: #10b981;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* ── STATS ── */
.stat-box-p {
  background: white;
  padding: 20px;
  border-radius: 24px;
  border: 1px solid #edf2f7;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  transition: .3s;
}
.stat-box-p:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); }

.stat-box__icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.stat-box__icon.total { background: #eff6ff; color: #2563eb; }
.stat-box__icon.revenue { background: #ecfdf5; color: #059669; }
.stat-box__icon.pending { background: #fffbeb; color: #d97706; }
.stat-box__icon.completed { background: #f0fdf4; color: #16a34a; }

.stat-box__value { font-weight: 900; font-size: 1.25rem; color: #0f172a; }
.stat-box__label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }

/* ── TOOLBAR ── */
.toolbar-card {
  background: white;
  padding: 16px 20px;
  border-radius: 24px;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.date-navigator-p {
  display: flex; align-items: center; gap: 8px;
}
.current-date-box-p {
  flex: 1;
  display: flex; align-items: center; gap: 8px;
  background: #f8fafc;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1.5px solid #edf2f7;
}
.date-text-p { font-weight: 700; font-size: 14px; color: #1e293b; }
.nav-btn-p {
  width: 40px; height: 40px; border-radius: 12px; border: none;
  background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center;
  transition: .2s;
}
.nav-btn-p:hover { background: #e2e8f0; color: #10b981; }

.filter-group-p { display: flex; gap: 12px; }
.filter-item-p {
  flex: 1; position: relative; display: flex; align-items: center;
  background: #f8fafc; border: 1.5px solid #edf2f7; border-radius: 12px;
  padding: 0 12px;
}
.filter-item-p .material-icons { color: #94a3b8; font-size: 18px; }
.select-p {
  width: 100%; border: none; background: transparent; padding: 10px 4px;
  outline: none; font-size: 13.5px; font-weight: 600; color: #1e293b;
}

.action-group-p { display: flex; gap: 8px; justify-content: flex-end; }
.btn-icon-p {
  width: 44px; height: 44px; border-radius: 12px; border: 1.5px solid #edf2f7;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center; transition: .2s;
}
.btn-icon-p:hover { background: #f8fafc; border-color: #10b981; color: #10b981; }

/* ── CALENDAR ── */
.calendar-card {
  background: white; border-radius: 28px; border: 1px solid #edf2f7; overflow: hidden;
}
.calendar-scroll-x { overflow-x: auto; }
.calendar-grid-p { display: flex; min-width: 900px; }

.time-column-p { width: 80px; flex-shrink: 0; border-right: 1px solid #f1f5f9; }
.grid-header-p {
  height: 60px; display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;
  border-bottom: 1px solid #f1f5f9; background: #fcfdfe;
}
.time-slot-p {
  height: 70px; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;
}

.court-columns-p { display: flex; flex: 1; }
.court-column-p { flex: 1; min-width: 160px; border-right: 1px solid #f1f5f9; }
.grid-header-p.court { flex-direction: column; }
.court-name-p { font-weight: 800; color: #0f172a; font-size: 14px; }
.court-type-p { font-size: 9px; color: #94a3b8; }

.slot-cell-p {
  height: 70px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  padding: 4px;
  overflow: visible;
}
.booking-item-p {
  position: absolute;
  left: 4px;
  right: 4px;
  top: 4px;
  min-height: calc(100% - 8px);
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  transition: .2s;
  overflow: hidden;
  border-left: 3px solid transparent;
  box-sizing: border-box;
}
.booking-item-p:hover { transform: scale(0.97); }
.booking-item-p.confirmed, .booking-item-p.CONFIRMED { background: #ecfdf5; color: #059669; border-left-color: #10b981; }
.booking-item-p.pending, .booking-item-p.PENDING, .booking-item-p.waiting_payment, .booking-item-p.WAITING_PAYMENT { background: #fffbeb; color: #d97706; border-left-color: #f59e0b; }
.booking-item-p.completed, .booking-item-p.COMPLETED { background: #f0fdf4; color: #16a34a; border-left-color: #22c55e; }
.booking-item-p.cancelled, .booking-item-p.CANCELLED { background: #fff1f2; color: #e11d48; border-left-color: #f43f5e; opacity: 0.6; }

.b-name-p { font-weight: 800; font-size: 11px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.b-time-p { font-size: 10px; font-weight: 600; margin: 1px 0 0 0; opacity: 0.8; }

/* ── LIST VIEW ── */
.list-card-p { background: white; border-radius: 28px; border: 1px solid #edf2f7; padding: 24px; }
.premium-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.premium-table th {
  padding: 12px 16px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8;
  letter-spacing: .05em; border-bottom: 2px solid #f1f5f9;
}
.premium-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.order-id-p { font-family: monospace; font-weight: 700; color: #94a3b8; font-size: 12px; }
.user-cell-p { display: flex; align-items: center; gap: 12px; }
.u-avatar-p { width: 32px; height: 32px; border-radius: 10px; background: #f1f5f9; color: #10b981; display: flex; align-items: center; justify-content: center; font-weight: 800; }
.u-name-p { font-weight: 800; font-size: 13.5px; margin: 0; }
.u-phone-p { font-size: 11px; color: #94a3b8; font-weight: 600; margin: 0; }
.court-tag-p { padding: 4px 10px; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 8px; font-size: 11px; font-weight: 700; }
.t-main-p { font-weight: 800; font-size: 13.5px; margin: 0; }
.t-sub-p { font-size: 11px; color: #94a3b8; margin: 0; }
.amount-p { font-weight: 900; color: #0f172a; }

.status-pill-p { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
.status-pill-p.confirmed, .status-pill-p.CONFIRMED { background: #dcfce7; color: #059669; }
.status-pill-p.pending, .status-pill-p.PENDING, .status-pill-p.waiting_payment, .status-pill-p.WAITING_PAYMENT { background: #fef3c7; color: #d97706; }
.status-pill-p.completed, .status-pill-p.COMPLETED { background: #f0fdf4; color: #16a34a; }
.status-pill-p.cancelled, .status-pill-p.CANCELLED { background: #fee2e2; color: #b91c1c; }

.action-cell-p { display: flex; gap: 8px; justify-content: flex-end; }
.btn-action-p {
  width: 32px; height: 32px; border-radius: 8px; border: none; background: #f1f5f9; color: #475569;
  display: flex; align-items: center; justify-content: center; transition: .2s;
}
.btn-action-p:hover { background: #e2e8f0; color: #0f172a; }
.btn-action-p.confirm:hover { background: #10b981; color: white; }

/* ── MODALS ── */
.modal-overlay-p {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-card-p {
  background: white; border-radius: 32px; width: 100%; max-width: 800px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.15); overflow: hidden;
  display: flex; flex-direction: column; animation: modalIn .3s both;
}
@keyframes modalIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-card__header-p { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-icon-p { width: 44px; height: 44px; border-radius: 12px; background: #ecfdf5; color: #10b981; display: flex; align-items: center; justify-content: center; }
.modal-title-p { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 1.25rem; margin: 0; text-transform: uppercase; }
.modal-booking-code { font-size: 11px; font-weight: 700; color: #94a3b8; }
.modal-close-btn-p { border: none; background: #f1f5f9; border-radius: 10px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: .2s; }
.modal-close-btn-p:hover { background: #fee2e2; color: #ef4444; }

.modal-card__body-p { padding: 24px; max-height: 70vh; overflow-y: auto; }
.section-title-p { font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.section-title-p::before { content: ''; width: 3px; height: 12px; background: #10b981; border-radius: 2px; }

.customer-info-card { background: #f8fafc; border-radius: 20px; padding: 16px; border: 1.5px solid #edf2f7; }
.u-avatar-large { width: 48px; height: 48px; border-radius: 14px; background: white; border: 1.5px solid #edf2f7; color: #10b981; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; }
.cust-name { font-weight: 900; font-size: 16px; margin-bottom: 4px; }
.cust-meta { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 6px; font-weight: 500; }
.cust-meta .material-icons { font-size: 16px; color: #94a3b8; }

.venue-detail-card-p { background: #f8fafc; border-radius: 20px; padding: 4px; border: 1.5px solid #edf2f7; }
.slot-item-p { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: white; border-radius: 16px; margin: 8px; border: 1px solid #edf2f7; }
.court-name-modal { font-weight: 800; font-size: 14px; display: block; }
.slot-time-modal { font-size: 12px; color: #64748b; font-weight: 600; }
.slot-price-modal { font-weight: 900; color: #059669; }

.booking-status-card { background: #f1f5f9; border-radius: 20px; padding: 16px; }
.status-row { display: flex; justify-content: space-between; align-items: center; }
.status-row .label { font-size: 12px; font-weight: 800; color: #64748b; }
.status-row .value { font-size: 13px; font-weight: 800; }

.payment-summary-card-p { background: #1e293b; color: white; border-radius: 20px; padding: 20px; }
.summary-line-p { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #cbd5e1; }
.summary-line-p.total { border-top: 1px solid rgba(255,255,255,0.1); color: white; }
.total-val { font-weight: 900; font-size: 1.5rem; }

.modal-card__footer-p { padding: 20px 24px; border-top: 1px solid #f1f5f9; }

.proof-card-p { position: relative; border-radius: 20px; overflow: hidden; border: 2px dashed #e2e8f0; cursor: pointer; max-height: 200px; }
.proof-card-p img { width: 100%; height: auto; display: block; object-fit: cover; }
.proof-overlay-p { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; opacity: 0; transition: .2s; }
.proof-card-p:hover .proof-overlay-p { opacity: 1; }

.note-box-p { background: #fffbeb; border-radius: 16px; padding: 12px 16px; border: 1px solid #fde68a; font-size: 13px; color: #92400e; font-weight: 500; }

/* ── UTILS ── */
.btn-premium { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 14px; font-weight: 800; border: none; transition: .2s; font-size: 14px; }
.btn-premium--emerald { background: #059669; color: white; }
.btn-premium--emerald:hover { background: #047857; transform: translateY(-2px); }
.btn-premium--light { background: #f1f5f9; color: #475569; }
.btn-premium--light:hover { background: #e2e8f0; }
.btn-premium--dark { background: #1e293b; color: white; }
.btn-premium--dark:hover { background: #0f172a; }
.shadow-emerald { box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2); }

.spinner-premium { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 991px) {
  .toolbar-card .row > div { text-align: left !important; }
}
</style>
