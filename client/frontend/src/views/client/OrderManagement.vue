<template>
  <div class="chk-page">
    <div class="chk-header-simple">
      <div class="container d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <button class="chk-back-btn" @click="$router.push('/')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 class="chk-title mb-0">Lịch sử đặt sân</h1>
        </div>
        <div class="user-pill d-none d-md-flex">
          <div class="user-pill__avatar">{{ userInitials }}</div>
          <div class="user-pill__info">
            <div class="fw-bold fs-6">{{ userName }}</div>
            <div class="text-muted small">{{ userPhone }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="container mt-4">
      <!-- STATS GRID -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--blue"><span class="material-icons">receipt_long</span></div>
            <div class="stat-card__val">{{ orders.length }}</div>
            <div class="stat-card__lab">Tổng đơn hàng</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--green"><span class="material-icons">payments</span></div>
            <div class="stat-card__val">{{ formatPrice(totalSpent) }}đ</div>
            <div class="stat-card__lab">Tổng chi tiêu</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--amber"><span class="material-icons">pending_actions</span></div>
            <div class="stat-card__val">{{ pendingCount }}</div>
            <div class="stat-card__lab">Đang chờ xử lý</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--red"><span class="material-icons">cancel_presentation</span></div>
            <div class="stat-card__val">{{ cancelledCount }}</div>
            <div class="stat-card__lab">Số đơn đã hủy</div>
          </div>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="filter-bar mb-4">
        <div class="material-icons text-muted">filter_list</div>
        <select v-model="statusFilter" class="filter-select">
          <option value="all">Tất cả trạng thái</option>
          <option value="WAITING_PAYMENT">Chờ thanh toán</option>
          <option value="PENDING">Chờ xác nhận</option>
          <option value="CONFIRMED">Đã xác nhận</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        <div class="d-none d-md-flex align-items-center gap-2 ms-auto">
          <input type="date" v-model="dateFilter" class="filter-date" />
          <button v-if="statusFilter !== 'all' || dateFilter" @click="resetFilters" class="btn-reset">Xóa lọc</button>
        </div>
      </div>

      <!-- ORDERS LIST -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-success"></div>
        <p class="mt-3 fw-bold text-muted">Đang tải lịch sử đơn hàng...</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <div class="empty-state__icon">📭</div>
        <h3>Chưa có đơn hàng nào</h3>
        <p>Có vẻ như bạn chưa đặt sân nào. Hãy bắt đầu niềm đam mê ngay!</p>
        <button class="btn btn-success fw-bold px-4 py-2 mt-2" @click="$router.push('/')">Khám phá sân ngay</button>
      </div>

      <div v-else class="row g-4">
        <div v-for="order in paginatedOrders" :key="order.id" class="col-md-6 col-xl-4">
          <div class="order-card-premium" @click="openDetail(order)">
            <div class="card-p-header">
              <span class="p-code">#{{ order.bookingCode }}</span>
              <span :class="['p-status', 'p-status--' + order.status.toLowerCase()]">
                {{ statusLabel(order.status) }}
              </span>
            </div>
            <div class="card-p-body">
              <h3 class="p-venue">{{ order.club?.name || 'Sân bóng' }}</h3>
              <div class="p-meta">
                <div class="p-meta-item">
                  <span class="material-icons">event</span>
                  {{ formatDate(order.items[0]?.timeSlot?.startTime) }}
                </div>
                <div class="p-meta-item">
                  <span class="material-icons">schedule</span>
                  {{ formatTimeRange(order.items) }}
                </div>
              </div>
              <div class="p-footer">
                <div class="p-total">{{ formatPrice(order.finalAmount) }}đ</div>
                <div class="p-method">
                   <span class="material-icons">payments</span>
                   {{ payLabel(order.payment?.method) }}
                </div>
              </div>
            </div>
            <div class="card-p-actions">
              <button class="btn-detail">Xem chi tiết</button>
              <button v-if="order.status === 'WAITING_PAYMENT'" class="btn-cancel" @click.stop="confirmCancel(order)">Hủy đơn</button>
            </div>
          </div>
        </div>
      </div>

      <!-- PAGINATION -->
      <div v-if="totalPages > 1" class="d-flex justify-content-center mt-5 mb-5 gap-2">
        <button v-for="p in totalPages" :key="p" :class="['page-btn', { active: currentPage === p }]" @click="currentPage = p">
          {{ p }}
        </button>
      </div>
    </div>

    <!-- DETAIL DRAWER -->
    <transition name="drawer">
      <div v-if="detailOrder" class="drawer-overlay" @click.self="detailOrder = null">
        <div class="drawer">
          <div class="drawer-header-p">
            <div class="d-flex align-items-center gap-3">
              <button class="btn-close-drawer" @click="detailOrder = null"><span class="material-icons">close</span></button>
              <div>
                <div class="fw-black text-dark fs-5">Chi tiết đơn #{{ detailOrder.bookingCode }}</div>
                <div class="text-muted small">{{ formatDate(detailOrder.items[0]?.timeSlot?.startTime) }}</div>
              </div>
            </div>
          </div>
          <div class="drawer-body-p">
            <!-- Items -->
            <div class="section-title">Khung giờ đặt</div>
            <div class="booking-items-list mb-4">
              <div v-for="item in detailOrder.items" :key="item.id" class="booking-item">
                <div class="booking-item__info">
                  <div class="fw-bold text-dark">{{ item.timeSlot.court.name }}</div>
                  <div class="text-muted small">{{ formatSlotTime(item.timeSlot) }}</div>
                </div>
                <div class="booking-item__price">{{ formatPrice(item.price) }}đ</div>
              </div>
            </div>

            <!-- Summary -->
            <div class="section-title">Tổng quan thanh toán</div>
            <div class="summary-box mb-4">
              <div class="s-row"><span>Tạm tính:</span><span>{{ formatPrice(detailOrder.totalAmount) }}đ</span></div>
              <div v-if="detailOrder.discountAmount > 0" class="s-row s-row--discount"><span>Giảm giá:</span><span>-{{ formatPrice(detailOrder.discountAmount) }}đ</span></div>
              <div class="s-row s-row--total"><span>Tổng cộng:</span><span>{{ formatPrice(detailOrder.finalAmount) }}đ</span></div>
              <div class="s-row"><span>Phương thức:</span><span>{{ payLabel(detailOrder.payment?.method) }}</span></div>
            </div>

            <!-- Payment Proof -->
            <div v-if="detailOrder.payment?.proofImageUrl" class="section-title">Minh chứng thanh toán</div>
            <div v-if="detailOrder.payment?.proofImageUrl" class="proof-view mb-4" @click="openImage(detailOrder.payment.proofImageUrl)">
               <img :src="detailOrder.payment.proofImageUrl" class="img-fluid rounded-3 border" />
               <div class="proof-overlay"><span class="material-icons">zoom_in</span> Nhấn để xem lớn</div>
            </div>

            <!-- Notes -->
            <div v-if="detailOrder.note" class="section-title">Ghi chú</div>
             <p class="text-muted small mb-4 p-3 bg-light rounded-3">{{ detailOrder.note }}</p>
          </div>
          <div class="drawer-footer-p">
             <button v-if="detailOrder.status === 'WAITING_PAYMENT'" class="btn btn-outline-danger w-100 fw-bold rounded-pill mb-2" @click="confirmCancel(detailOrder)">Hủy đơn đặt sân</button>
             <button class="btn btn-success w-100 fw-bold rounded-pill py-2" @click="detailOrder = null">Đóng chi tiết</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- CONFIRM CANCEL -->
    <div v-if="cancelTarget" class="modal-p-overlay" @click.self="cancelTarget = null">
      <div class="modal-p-card">
        <div class="modal-p-icon">⚠️</div>
        <h3 class="fw-black mt-3">Xác nhận hủy đơn</h3>
        <p class="text-muted small">Bạn có chắc muốn hủy đơn đặt sân <strong>#{{ cancelTarget.bookingCode }}</strong>? Hành động này không thể hoàn tác.</p>
        <div class="d-flex gap-3 mt-4">
          <button class="btn btn-light flex-grow-1 fw-bold rounded-pill" @click="cancelTarget = null">Quay lại</button>
          <button class="btn btn-danger flex-grow-1 fw-bold rounded-pill shadow-sm" @click="proceedCancel" :disabled="isProcessing">
            {{ isProcessing ? 'Đang lý...' : 'Xác nhận hủy' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { bookingService } from '@/services/booking.service';
import { authService } from '@/services/auth.service';
import { toast } from 'vue3-toastify';

export default {
  name: 'OrderManagement',
  data() {
    return {
      orders: [],
      user: null,
      isLoading: true,
      isProcessing: false,
      statusFilter: 'all',
      dateFilter: '',
      currentPage: 1,
      pageSize: 6,
      detailOrder: null,
      cancelTarget: null,
    };
  },
  computed: {
    userName() { return this.user?.fullName || 'Người dùng'; },
    userPhone() { return this.user?.phone || ''; },
    userInitials() { return this.userName.split(' ').map(n => n[0]).join('').slice(0, 2); },
    
    totalSpent() { 
      return this.orders
        .filter(o => o.status === 'COMPLETED' || o.status === 'CONFIRMED')
        .reduce((s, o) => s + Number(o.finalAmount), 0); 
    },
    pendingCount() { return this.orders.filter(o => ['WAITING_PAYMENT', 'PENDING'].includes(o.status)).length; },
    cancelledCount() { return this.orders.filter(o => o.status === 'CANCELLED').length; },

    filteredOrders() {
      let list = [...this.orders];
      if (this.statusFilter !== 'all') {
        list = list.filter(o => o.status === this.statusFilter);
      }
      if (this.dateFilter) {
        list = list.filter(o => {
          const startTime = o.items[0]?.timeSlot?.startTime;
          if (!startTime) return false;
          return startTime.startsWith(this.dateFilter);
        });
      }
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    
    totalPages() { return Math.ceil(this.filteredOrders.length / this.pageSize); },
    paginatedOrders() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredOrders.slice(start, start + this.pageSize);
    },
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      try {
        const [ordersRes, userRes] = await Promise.all([
          bookingService.getMyBookings(),
          authService.getMe()
        ]);
        this.orders = ordersRes.data || [];
        this.user = userRes.data?.data;
      } catch (err) {
        console.error("Lỗi dữ liệu:", err);
        toast.error("Không thể tải lịch sử đơn hàng");
      } finally {
        this.isLoading = false;
      }
    },

    formatPrice(v) { return new Intl.NumberFormat('vi-VN').format(v); },
    formatDate(d) { 
      if (!d) return '—';
      return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    formatSlotTime(slot) {
      const start = new Date(slot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(slot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${start} – ${end}`;
    },
    formatTimeRange(items) {
      if (!items?.length) return '—';
      const sorted = [...items].sort((a,b) => new Date(a.timeSlot.startTime) - new Date(b.timeSlot.startTime));
      const start = new Date(sorted[0].timeSlot.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(sorted[sorted.length-1].timeSlot.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${start} – ${end}`;
    },

    statusLabel(s) {
      const map = {
        WAITING_PAYMENT: 'Chờ thanh toán',
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy'
      };
      return map[s] || s;
    },
    payLabel(p) {
      const map = { BANK_TRANSFER: 'Chuyển khoản', MOMO: 'MoMo', VNPAY: 'VNPAY', CREDIT_CARD: 'Thẻ QT', CASH: 'Tiền mặt' };
      return map[p] || 'VNPay';
    },

    resetFilters() {
      this.statusFilter = 'all';
      this.dateFilter = '';
      this.currentPage = 1;
    },
    
    openDetail(o) { this.detailOrder = o; },
    confirmCancel(o) { this.cancelTarget = o; },
    
    async proceedCancel() {
      if (this.isProcessing) return;
      this.isProcessing = true;
      try {
        await bookingService.cancelBooking(this.cancelTarget.bookingCode);
        toast.success("Đã hủy đơn hàng thành công");
        this.cancelTarget = null;
        this.detailOrder = null;
        await this.fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể hủy đơn hàng này");
      } finally {
        this.isProcessing = false;
      }
    },

    openImage(url) { window.open(url, '_blank'); }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&display=swap');

.chk-page {
  font-family: 'Lexend', sans-serif;
  background: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
}

.chk-header-simple {
  background: white;
  padding: 16px 0;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.chk-title { font-weight: 800; font-size: 18px; color: #0f172a; }
.chk-back-btn {
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
}
.chk-back-btn:hover { background: #e2e8f0; transform: translateX(-3px); }

.user-pill {
  background: #f1f5f9;
  padding: 5px 15px 5px 5px;
  border-radius: 40px;
  align-items: center;
  gap: 12px;
}
.user-pill__avatar {
  width: 32px; height: 32px;
  background: #198754; color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 12px;
}

/* STAT CARDS */
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid #edf2f7;
  text-align: center;
  transition: transform .2s;
}
.stat-card:hover { transform: translateY(-5px); }
.stat-card__icon {
  width: 44px; height: 44px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
}
.stat-card__icon--blue { background: #eff6ff; color: #2563eb; }
.stat-card__icon--green { background: #f0fdf4; color: #16a34a; }
.stat-card__icon--amber { background: #fffbeb; color: #d97706; }
.stat-card__icon--red { background: #fff1f2; color: #dc2626; }
.stat-card__val { font-weight: 900; font-size: 20px; line-height: 1.2; }
.stat-card__lab { font-size: 11px; font-weight: 600; color: #64748b; margin-top: 4px; }

/* FILTERS */
.filter-bar {
  background: white;
  padding: 12px 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 15px;
}
.filter-select, .filter-date {
  border: 1.5px solid #edf2f7;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  background: #f8fafc;
  outline: none;
}
.filter-select:focus, .filter-date:focus { border-color: #198754; }
.btn-reset {
  background: #fff1f2; color: #dc2626;
  border: none; padding: 8px 16px;
  border-radius: 10px; font-weight: 700; font-size: 12px;
  cursor: pointer;
}

/* ORDER CARDS */
.order-card-premium {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  position: relative;
  transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.order-card-premium:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.06);
  border-color: #198754;
}
.card-p-header {
  padding: 18px 20px 10px;
  display: flex; justify-content: space-between; align-items: center;
}
.p-code { font-family: monospace; font-weight: 800; font-size: 13px; color: #64748b; }
.p-status {
  font-size: 10px; font-weight: 800; text-transform: uppercase;
  padding: 4px 10px; border-radius: 10px;
}
.p-status--confimed, .p-status--confirmed { background: #dcfce7; color: #166534; }
.p-status--pending, .p-status--waiting_payment { background: #fef3c7; color: #92400e; }
.p-status--cancelled { background: #fee2e2; color: #991b1b; }
.p-status--completed { background: #eff6ff; color: #1e40af; }

.card-p-body { padding: 0 20px 20px; }
.p-venue { font-weight: 900; font-size: 18px; margin-bottom: 12px; }
.p-meta { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.p-meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; font-weight: 500; }
.p-meta-item .material-icons { font-size: 18px; color: #94a3b8; }
.p-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 15px; border-top: 1px dashed #e2e8f0;
}
.p-total { font-weight: 900; font-size: 20px; color: #198754; }
.p-method { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #94a3b8; }
.p-method .material-icons { font-size: 14px; }

.card-p-actions {
  display: flex; gap: 1px; background: #e2e8f0; border-top: 1px solid #e2e8f0;
}
.card-p-actions button {
  flex: 1; border: none; background: #f8fafc; padding: 12px;
  font-size: 13px; font-weight: 700; transition: all .2s;
}
.btn-detail { color: #198754; }
.btn-cancel { color: #dc2626; }
.card-p-actions button:hover { background: #f1f5f9; }

/* DRAWER */
.drawer-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: flex-end;
}
.drawer {
  width: 500px; max-width: 100vw; background: white; height: 100vh;
  display: flex; flex-direction: column;
}
.drawer-header-p { padding: 24px; border-bottom: 1px solid #f1f5f9; }
.btn-close-drawer {
  background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.drawer-body-p { flex: 1; padding: 24px; overflow-y: auto; }
.section-title {
  font-size: 11px; font-weight: 800; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;
}
.booking-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px; background: #f8fafc; border-radius: 12px; margin-bottom: 8px;
}
.booking-item__price { font-weight: 800; color: #198754; }
.summary-box { background: #f1f5f9; border-radius: 16px; padding: 20px; }
.s-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
.s-row--total { border-top: 1px solid #cbd5e1; padding-top: 12px; margin-top: 12px; font-weight: 900; font-size: 18px; }
.s-row--discount { color: #dc2626; }

.proof-view { position: relative; cursor: pointer; }
.proof-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; opacity: 0; transition: .2s;
  border-radius: 8px;
}
.proof-view:hover .proof-overlay { opacity: 1; }

.drawer-footer-p { padding: 20px 24px 40px; border-top: 1px solid #f1f5f9; }

/* MODAL */
.modal-p-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
  z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-p-card {
  background: white; border-radius: 32px; padding: 32px; max-width: 400px; width: 100%; text-align: center;
}
.modal-p-icon { font-size: 48px; }

/* EMPTY STATE */
.empty-state { text-align: center; padding: 100px 20px; }
.empty-state__icon { font-size: 64px; margin-bottom: 20px; }

.page-btn {
  width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid #e2e8f0;
  background: white; font-weight: 800; transition: .2s;
}
.page-btn.active { background: #198754; color: white; border-color: #198754; }

@media (max-width: 768px) {
  .drawer { width: 100vw; }
}

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.3s; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.3s; }
.drawer-enter-from .drawer { transform: translateX(100%); }
.drawer-leave-to .drawer { transform: translateX(100%); }

@media (max-width: 640px) {
  .chk-page { padding: 12px; }
  .stat-card { padding: 15px 10px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .user-pill { display: none !important; }
}
</style>