<template>
  <div class="owner-layout">
    <div
      v-if="mobileNavOpen"
      class="sidebar-backdrop"
      aria-hidden="true"
      @click="closeMobileNav"
    />
    <OwnerSidebar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="mobileNavOpen"
      :is-locked="isLocked"
      :is-kyc-approved="isKycApproved"
    />
    <div class="main-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <OwnerHeader :mobile-drawer-open="mobileNavOpen" @toggle-sidebar="toggleSidebar" />

      <transition name="banner-slide">
        <div v-if="pendingPaymentTotal > 0" class="owner-pending-strip" role="status">
          <span class="material-icons-outlined owner-pending-strip-icon">notifications_active</span>
          <span class="owner-pending-strip-text">
            <strong>{{ pendingPaymentTotal }}</strong> đơn chờ thanh toán / xác nhận trên các CLB của bạn — có thể có đơn mới vừa đặt.
          </span>
          <button type="button" class="owner-pending-strip-btn" @click="openPendingQueuePanel">
            Xử lý ngay
          </button>
        </div>
      </transition>

      <!-- Banner 1: Trial countdown (chưa nộp hồ sơ) -->
      <transition name="banner-slide">
        <div v-if="!isVerified && !isTrialExpired" class="trial-banner">
          <div class="trial-banner-left">
            <span class="material-icons">timer</span>
            <span>Bạn đang dùng thử miễn phí. Hồ sơ bị khóa sau: <strong>{{ timeLeftFormatted }}</strong></span>
          </div>
          <div class="trial-progress">
            <div class="trial-bar" :style="{ width: trialPercent + '%' }"></div>
          </div>
          <router-link to="/owner/settings" class="trial-cta">
            <span class="material-icons">edit_note</span> Cập nhật hồ sơ
          </router-link>
        </div>
      </transition>

      <!-- Banner 2: Đang chờ Admin duyệt KYC (PENDING) -->
      <transition name="banner-slide">
        <div v-if="isPendingReview" class="trial-banner pending-banner">
          <div class="trial-banner-left">
            <span class="material-icons">pending_actions</span>
            <span>Hồ sơ KYC của bạn đang <strong>chờ Admin xét duyệt</strong>. Các tính năng sẽ mở khóa sau khi được duyệt.</span>
          </div>
          <router-link to="/owner/settings?tab=kyc" class="trial-cta pending-cta">
            <span class="material-icons">visibility</span> Xem hồ sơ
          </router-link>
        </div>
      </transition>

      <!-- Banner 3: Bị từ chối KYC (REJECTED) -->
      <transition name="banner-slide">
        <div v-if="isKycRejected" class="trial-banner rejected-banner">
          <div class="trial-banner-left">
            <span class="material-icons">cancel</span>
            <span>Hồ sơ KYC bị <strong>từ chối</strong>. Vui lòng cập nhật lại thông tin và nộp lại.</span>
          </div>
          <router-link to="/owner/settings?tab=kyc" class="trial-cta rejected-cta">
            <span class="material-icons">edit</span> Nộp lại hồ sơ
          </router-link>
        </div>
      </transition>

      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <!-- Cung cấp isLocked cho tất cả các View con qua provide/inject -->
            <component :is="Component" :is-locked="isLocked" />
          </transition>
        </router-view>
      </main>
    </div>

    <PaymentProofNotificationModal
      :show="showPaymentProofModal"
      :booking="paymentProofModalBooking"
      :confirming="paymentProofConfirmLoading"
      @close="closePaymentProofModal"
      @confirm="handlePaymentProofModalConfirm"
    />

    <NewBookingNotificationModal
      :show="showNewBookingModal"
      :booking="newBookingModalBooking"
      :confirm-loading="newBookingConfirmLoading"
      @close="closeNewBookingModal"
      @view-detail="handleNewBookingModalViewDetail"
      @confirm="handleConfirmPaymentFromNewBookingModal"
    />

    <transition name="fade">
      <div
        v-if="showPendingQueuePanel"
        class="opq-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="opq-title"
        @click.self="closePendingQueuePanel"
      >
        <div class="opq-panel">
          <div class="opq-head">
            <div>
              <h2 id="opq-title" class="opq-title">Đơn chờ thanh toán / xác nhận</h2>
              <p class="opq-sub">Danh sách theo tất cả CLB của bạn — xử lý trực tiếp tại đây.</p>
            </div>
            <button type="button" class="opq-x" aria-label="Đóng" @click="closePendingQueuePanel">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="opq-body">
            <div v-if="pendingQueueLoading" class="opq-state">
              <span class="opq-spinner" aria-hidden="true" />
              <span>Đang tải danh sách…</span>
            </div>
            <p v-else-if="!pendingQueueRows.length" class="opq-state opq-muted">
              Không còn đơn chờ xử lý.
            </p>
            <ul v-else class="opq-list">
              <li
                v-for="row in pendingQueueRows"
                :key="`${row.clubId}-${row.booking.id}`"
                class="opq-item"
              >
                <div class="opq-item-main">
                  <div class="opq-item-top">
                    <span class="opq-badge">{{ statusLabelPending(row.booking.status) }}</span>
                    <span class="opq-code mono">{{ row.booking.bookingCode || row.booking.id }}</span>
                  </div>
                  <div class="opq-club">{{ row.clubName }}</div>
                  <div class="opq-line">{{ row.booking.bookerName || row.booking.user?.fullName || 'Khách' }}</div>
                  <div class="opq-line opq-muted-sm">{{ slotPreview(row.booking) }}</div>
                  <div class="opq-amount">{{ formatMoneyPending(row.booking.finalAmount ?? row.booking.totalAmount) }}</div>
                </div>
                <div class="opq-item-actions">
                  <button
                    v-if="canConfirmPendingBooking(row.booking)"
                    type="button"
                    class="opq-btn opq-btn-primary"
                    :disabled="pendingQueueConfirmId === row.booking.id"
                    @click="confirmPendingQueueRow(row)"
                  >
                    <span v-if="pendingQueueConfirmId === row.booking.id" class="opq-spin" aria-hidden="true" />
                    <span v-else class="material-icons opq-ico">verified</span>
                    {{
                      pendingQueueConfirmId === row.booking.id ? 'Đang xử lý…' : 'Xác nhận'
                    }}
                  </button>
                  <p v-else class="opq-hint">
                    <template v-if="row.booking.status === 'WAITING_PAYMENT' && row.booking.payment?.method === 'BANK_TRANSFER' && !row.booking.payment?.proofImageUrl">
                      Chờ khách gửi ảnh CK.
                    </template>
                    <template v-else>
                      Không thể xác nhận tự động từ đây.
                    </template>
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { provide } from 'vue';
import OwnerSidebar from '../components/layout/OwnerSidebar.vue';
import OwnerHeader from '../components/layout/OwnerHeader.vue';
import PaymentProofNotificationModal from '../components/owner/dashboard/PaymentProofNotificationModal.vue';
import NewBookingNotificationModal from '../components/owner/dashboard/NewBookingNotificationModal.vue';
import { useOwnerTrial } from '../composables/useOwnerTrial.js';
import { clubService } from '@/services/club.service';
import { bookingService } from '@/services/booking.service';
import { socketService } from '@/services/socket.service.js';
import { toast } from 'vue3-toastify';

export default {
  name: 'OwnerLayout',
  components: {
    OwnerSidebar,
    OwnerHeader,
    PaymentProofNotificationModal,
    NewBookingNotificationModal,
  },
  setup() {
    const { isLocked, isVerified, isKycApproved, isPendingReview, isKycRejected, isTrialExpired, timeLeftFormatted, trialPercent, startTrial, refreshStatus } = useOwnerTrial();

    // Đồng bộ ngay lập tức
    refreshStatus();

    // Cung cấp isLocked cho mọi component con (Vue provide/inject)
    provide('isLocked', isLocked);

    return { isLocked, isVerified, isKycApproved, isPendingReview, isKycRejected, isTrialExpired, timeLeftFormatted, trialPercent, startTrial, refreshStatus };
  },
  data() {
    return {
      isSidebarCollapsed: false,
      mobileNavOpen: false,
      _mqMobile: null,

      ownerClubIds: [],
      /** @type {{ id: string|number, name: string }[]} */
      ownerClubsMeta: [],
      pendingPaymentTotal: 0,

      showPendingQueuePanel: false,
      pendingQueueLoading: false,
      pendingQueueRows: [],
      pendingQueueConfirmId: null,

      showPaymentProofModal: false,
      paymentProofModalBooking: null,
      paymentProofConfirmLoading: false,

      showNewBookingModal: false,
      newBookingModalBooking: null,
      newBookingConfirmLoading: false,
    }
  },
  watch: {
    $route() {
      this.closeMobileNav();
      this.closePendingQueuePanel();
    },
  },
  mounted() {
    // Khởi động timer ngay khi vào Dashboard
    this.startTrial();
    // Đồng bộ trạng thái mới nhất từ backend
    this.refreshStatus();

    this._mqMobile = window.matchMedia('(max-width: 1024px)');
    this._onMqChange = () => {
      if (!this._mqMobile.matches) {
        this.mobileNavOpen = false;
      }
    };
    this._mqMobile.addEventListener('change', this._onMqChange);

    this.initOwnerRealtimeHub();
  },
  beforeUnmount() {
    if (this._mqMobile && this._onMqChange) {
      this._mqMobile.removeEventListener('change', this._onMqChange);
    }
    socketService.disconnect();
  },
  methods: {
    isMobileLayout() {
      return typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;
    },
    toggleSidebar() {
      if (this.isMobileLayout()) {
        this.mobileNavOpen = !this.mobileNavOpen;
        return;
      }
      this.mobileNavOpen = false;
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    closeMobileNav() {
      this.mobileNavOpen = false;
    },

    dispatchRealtimeDetail(data) {
      window.dispatchEvent(new CustomEvent('owner-booking-realtime', { detail: data }));
    },

    ownerClubSet() {
      return new Set(this.ownerClubIds.map((id) => String(id)));
    },

    isOwnerClub(clubId) {
      return clubId != null && this.ownerClubSet().has(String(clubId));
    },

    async initOwnerRealtimeHub() {
      try {
        const clubRes = await clubService.getOwnerClubs();
        const payload = clubRes?.data;
        const clubs =
          payload?.success && Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (!clubs.length) return;

        this.ownerClubIds = clubs.map((c) => c.id);
        this.ownerClubsMeta = clubs.map((c) => ({
          id: c.id,
          name: c.name || `CLB #${c.id}`,
        }));

        socketService.connect();
        socketService.onBookingUpdate((data) => this.handleOwnerBookingSocket(data));
        socketService.onRecentNotifications((list) => this.handleOwnerRecentNotifications(list));

        clubs.forEach((c) => socketService.joinVenue(c.id));
        await this.refreshPendingTotals();
      } catch (e) {
        console.error('Owner realtime hub failed', e);
      }
    },

    async refreshPendingTotals() {
      let total = 0;
      for (const cid of this.ownerClubIds) {
        try {
          const res = await bookingService.getBookingsByClub(cid);
          const rawList = this.bookingListFromResponse(res);
          total += rawList.filter(
            (b) => b.status === 'WAITING_PAYMENT' || b.status === 'PENDING'
          ).length;
        } catch (_) {
          /* ignore */
        }
      }
      this.pendingPaymentTotal = total;
    },

    bookingListFromResponse(res) {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },

    async loadPendingQueueRows() {
      if (!this.ownerClubsMeta.length) return;
      this.pendingQueueLoading = true;
      try {
        const rows = [];
        for (const meta of this.ownerClubsMeta) {
          try {
            const res = await bookingService.getBookingsByClub(meta.id);
            const rawList = this.bookingListFromResponse(res);
            const pending = rawList.filter((b) =>
              ['PENDING', 'WAITING_PAYMENT'].includes(b.status)
            );
            for (const b of pending) {
              rows.push({ booking: b, clubId: meta.id, clubName: meta.name });
            }
          } catch (_) {
            /* skip club */
          }
        }
        rows.sort(
          (a, b) =>
            new Date(b.booking.createdAt || 0).getTime() -
            new Date(a.booking.createdAt || 0).getTime()
        );
        this.pendingQueueRows = rows;
      } finally {
        this.pendingQueueLoading = false;
      }
    },

    async openPendingQueuePanel() {
      this.showPendingQueuePanel = true;
      await this.loadPendingQueueRows();
    },

    closePendingQueuePanel() {
      this.showPendingQueuePanel = false;
      this.pendingQueueConfirmId = null;
    },

    statusLabelPending(status) {
      const map = {
        WAITING_PAYMENT: 'Chờ thanh toán',
        PENDING: 'Chờ xác nhận',
      };
      return map[status] || status || '—';
    },

    formatMoneyPending(v) {
      const n = Number(v ?? 0);
      return `${n.toLocaleString('vi-VN')}đ`;
    },

    slotPreview(booking) {
      const items = booking?.items;
      if (!items?.length) return '—';
      const it = items[0];
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
    },

    canConfirmPendingBooking(booking) {
      if (!booking) return false;
      const payMethod = booking.payment?.method;
      return (
        booking.status === 'PENDING' ||
        (booking.status === 'WAITING_PAYMENT' &&
          payMethod === 'BANK_TRANSFER' &&
          !!booking.payment?.proofImageUrl)
      );
    },

    async confirmPendingQueueRow(row) {
      const booking = row.booking;
      if (!booking?.id || !this.canConfirmPendingBooking(booking)) return;
      this.pendingQueueConfirmId = booking.id;
      try {
        const res = await bookingService.confirmPayment(booking.id);
        if (res?.success === false) {
          toast.error(res?.message || 'Xác nhận thanh toán thất bại.');
          return;
        }
        toast.success('Đã xác nhận thanh toán.');
        this.dispatchRealtimeDetail({
          type: 'payment-confirmed-local',
          clubId: row.clubId,
          booking,
        });
        await this.refreshPendingTotals();
        await this.loadPendingQueueRows();
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Không thể xác nhận thanh toán.');
      } finally {
        this.pendingQueueConfirmId = null;
      }
    },

    async refreshPendingQueueIfOpen() {
      if (!this.showPendingQueuePanel) return;
      await this.loadPendingQueueRows();
    },

    async handleOwnerBookingSocket(data) {
      const clubId = data?.clubId ?? data?.booking?.clubId;
      if (!this.isOwnerClub(clubId)) return;

      this.dispatchRealtimeDetail(data);

      if (data?.type === 'payment-proof-submitted') {
        toast.info('Khách đã gửi minh chứng chuyển khoản.');
        const bid = data?.booking?.id;
        if (bid) await this.openPaymentProofModalByBookingId(bid);
        await this.refreshPendingTotals();
        await this.refreshPendingQueueIfOpen();
        return;
      }

      if (data?.type === 'new-booking' || data?.type === 'manual-booking-created') {
        const bid = data?.booking?.id;
        let bookingPayload = data?.booking || null;
        if (bid && clubId) {
          const fresh = await this.enrichBookingByClub(bid, clubId);
          if (fresh) bookingPayload = fresh;
        }
        toast.success(
          data?.type === 'manual-booking-created'
            ? 'Đã tạo đơn tại quầy.'
            : 'Có đơn đặt sân mới từ khách!',
          { autoClose: 6000 }
        );
        this.newBookingModalBooking = bookingPayload;
        this.showNewBookingModal = !!bookingPayload;
        await this.refreshPendingTotals();
        await this.refreshPendingQueueIfOpen();
        return;
      }

      if (data?.type === 'booking-cancelled') {
        toast.info('Một đơn đặt sân đã bị hủy.');
      } else {
        toast.info('Có cập nhật đơn đặt sân.');
      }
      await this.refreshPendingTotals();
      await this.refreshPendingQueueIfOpen();
    },

    async handleOwnerRecentNotifications(list) {
      if (!Array.isArray(list) || !list.length) return;
      const relevant = list.filter((n) =>
        this.isOwnerClub(n?.clubId ?? n?.booking?.clubId)
      );
      const proof = [...relevant].reverse().find((n) => n.type === 'payment-proof-submitted');
      if (proof?.booking?.id && !this.showPaymentProofModal) {
        await this.openPaymentProofModalByBookingId(proof.booking.id);
      }
    },

    async enrichBookingByClub(bookingId, clubId) {
      try {
        const res = await bookingService.getBookingsByClub(clubId);
        const rawList = this.bookingListFromResponse(res);
        return rawList.find((x) => String(x.id) === String(bookingId)) || null;
      } catch (_) {
        return null;
      }
    },

    async openPaymentProofModalByBookingId(bookingId) {
      if (!bookingId) return;
      for (const cid of this.ownerClubIds) {
        try {
          const res = await bookingService.getBookingsByClub(cid);
          const rawList = this.bookingListFromResponse(res);
          const b = rawList.find((x) => String(x.id) === String(bookingId));
          if (b?.payment?.proofImageUrl) {
            this.paymentProofModalBooking = b;
            this.showPaymentProofModal = true;
            return;
          }
        } catch (_) {
          /* next club */
        }
      }
    },

    closePaymentProofModal() {
      this.showPaymentProofModal = false;
      this.paymentProofModalBooking = null;
      this.paymentProofConfirmLoading = false;
    },

    closeNewBookingModal() {
      this.showNewBookingModal = false;
      this.newBookingModalBooking = null;
      this.newBookingConfirmLoading = false;
    },

    handleNewBookingModalViewDetail(booking) {
      if (!booking?.id) return;
      this.closeNewBookingModal();
      try {
        sessionStorage.setItem('owner_prefill_booking_detail', JSON.stringify(booking));
      } catch (_) {
        /* ignore */
      }
      this.$router.push({ path: '/owner/bookings', query: { bookingId: String(booking.id) } });
    },

    async handleConfirmPaymentFromNewBookingModal(booking) {
      if (!booking?.id) return;
      this.newBookingConfirmLoading = true;
      try {
        const res = await bookingService.confirmPayment(booking.id);
        if (res?.success === false) {
          toast.error(res?.message || 'Xác nhận thanh toán thất bại.');
          return;
        }
        toast.success('Đã xác nhận thanh toán.');
        this.closeNewBookingModal();
        this.dispatchRealtimeDetail({
          type: 'payment-confirmed-local',
          clubId: booking.clubId,
          booking,
        });
        await this.refreshPendingTotals();
        await this.refreshPendingQueueIfOpen();
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Không thể xác nhận thanh toán.');
      } finally {
        this.newBookingConfirmLoading = false;
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
        this.dispatchRealtimeDetail({
          type: 'payment-confirmed-local',
          clubId: booking.clubId,
          booking,
        });
        await this.refreshPendingTotals();
        await this.refreshPendingQueueIfOpen();
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Không thể xác nhận thanh toán.');
      } finally {
        this.paymentProofConfirmLoading = false;
      }
    },
  },
}
</script>

<style scoped>
.owner-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Barlow', sans-serif;
  position: relative;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 998;
  -webkit-tap-highlight-color: transparent;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 280px;
  min-width: 0;
}

.main-wrapper.sidebar-collapsed {
  margin-left: 80px;
}

.owner-pending-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  padding: 12px 28px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  position: sticky;
  top: 80px;
  z-index: 99;
  background: linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%);
  border-bottom: 1px solid #a7f3d0;
}
.owner-pending-strip-icon {
  font-size: 22px !important;
  color: #059669;
  flex-shrink: 0;
}
.owner-pending-strip-text {
  color: #0f172a;
  flex: 1;
  min-width: 200px;
  line-height: 1.45;
}
.owner-pending-strip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  background: #059669;
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 10px;
  white-space: nowrap;
  transition: background 0.15s;
}
.owner-pending-strip-btn:hover {
  background: #047857;
}

/* Pending queue overlay */
.opq-overlay {
  position: fixed;
  inset: 0;
  z-index: 10045;
  background: rgba(15, 22, 35, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.opq-panel {
  width: min(100%, 520px);
  max-height: min(88vh, 720px);
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(15, 22, 35, 0.18);
  border: 1px solid #eaecf2;
  display: flex;
  flex-direction: column;
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}
.opq-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid #eaecf2;
}
.opq-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f1623;
}
.opq-sub {
  margin: 6px 0 0;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.4;
}
.opq-x {
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
}
.opq-x:hover {
  background: #e2e8f0;
  color: #0f1723;
}
.opq-body {
  padding: 12px 16px 18px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.opq-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 12px;
  font-size: 14px;
  color: #475569;
}
.opq-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid #e2e8f0;
  border-top-color: #059669;
  border-radius: 50%;
  animation: opq-spin 0.75s linear infinite;
}
@keyframes opq-spin {
  to {
    transform: rotate(360deg);
  }
}
.opq-muted {
  text-align: center;
}
.opq-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.opq-item {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}
.opq-item-main {
  flex: 1;
  min-width: 0;
}
.opq-item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.opq-badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 4px 8px;
  border-radius: 6px;
}
.opq-code {
  font-size: 12px;
  color: #64748b;
}
.opq-code.mono {
  font-family: ui-monospace, monospace;
}
.opq-club {
  font-size: 12px;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 4px;
}
.opq-line {
  font-size: 13px;
  font-weight: 600;
  color: #0f1623;
}
.opq-muted-sm {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
}
.opq-amount {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 800;
  color: #059669;
}
.opq-item-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  min-width: 132px;
}
.opq-btn {
  border: none;
  border-radius: 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.15s;
}
.opq-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}
.opq-btn-primary {
  background: linear-gradient(135deg, #059669, #047857);
  color: #fff;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}
.opq-btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
}
.opq-ico {
  font-size: 18px !important;
}
.opq-spin {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: opq-spin 0.75s linear infinite;
}
.opq-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: #64748b;
  max-width: 140px;
}

/* Trial Banner */
.trial-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: white;
  padding: 12px 28px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  position: sticky;
  top: 80px;
  z-index: 100;
}

.trial-banner-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.trial-banner-left .material-icons {
  font-size: 18px;
  color: #fbbf24;
}

.trial-banner-left strong { color: #fbbf24; }

.trial-progress {
  width: 120px;
  height: 4px;
  background: rgba(255,255,255,0.15);
  border-radius: 100px;
  overflow: hidden;
}

.trial-bar {
  height: 100%;
  background: #16a34a;
  border-radius: 100px;
  transition: width 1s linear;
}

.trial-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #16a34a;
  color: white;
  text-decoration: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.trial-cta:hover { background: #15803d; }
.trial-cta .material-icons { font-size: 16px; }

/* Banner trạng thái PENDING (Chờ duyệt) */
.pending-banner {
  background: linear-gradient(135deg, #78350f, #92400e);
}
.pending-banner .material-icons { color: #fcd34d !important; }
.pending-cta { background: #d97706 !important; }
.pending-cta:hover { background: #b45309 !important; }

/* Banner trạng thái REJECTED (Bị từ chối) */
.rejected-banner {
  background: linear-gradient(135deg, #7f1d1d, #991b1b);
}
.rejected-banner .material-icons { color: #fca5a5 !important; }
.rejected-cta { background: #dc2626 !important; }
.rejected-cta:hover { background: #b91c1c !important; }

/* Banner animation */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.3s ease;
}
.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}

.content-area {
  padding: 30px;
  flex: 1;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 1024px) {
  .main-wrapper { margin-left: 0 !important; }
  .trial-banner { flex-wrap: wrap; }
}

@media (max-width: 768px) {
  .content-area {
    padding: 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
</style>
