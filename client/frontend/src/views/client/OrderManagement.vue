<template>
  <div class="order-page">
    <!-- PREMIUM HEADER -->
    <div class="order-header">
      <div class="container py-4">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <button class="icon-btn-p back-btn" @click="$router.push('/')" title="Quay lại trang chủ">
              <span class="material-icons">arrow_back</span>
            </button>
            <div>
              <h1 class="page-title-p mb-0">Lịch sử đặt sân</h1>
              <p class="page-subtitle-p d-none d-md-block">Quản lý các đơn đặt sân và theo dõi lịch trình của bạn</p>
            </div>
          </div>
          
          <div class="user-pill-p d-none d-md-flex">
            <div class="user-pill-p__info">
              <span class="user-pill-p__name">{{ userName }}</span>
              <span class="user-pill-p__phone">{{ userPhone }}</span>
            </div>
            <div class="user-pill-p__avatar">{{ userInitials }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-4">
      <!-- STATS BENTO GRID -->
      <div class="row g-3 mb-5">
        <div class="col-6 col-md-3">
          <div class="stat-box">
            <div class="stat-box__icon total"><span class="material-icons">receipt_long</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ orders.length }}</div>
              <div class="stat-box__label">Tổng đơn hàng</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-box">
            <div class="stat-box__icon spent"><span class="material-icons">payments</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ formatPrice(totalSpent) }}đ</div>
              <div class="stat-box__label">Tổng chi tiêu</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-box">
            <div class="stat-box__icon pending"><span class="material-icons">pending_actions</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ pendingCount }}</div>
              <div class="stat-box__label">Đang chờ xử lý</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-box">
            <div class="stat-box__icon cancelled"><span class="material-icons">cancel_presentation</span></div>
            <div class="stat-box__content">
              <div class="stat-box__value">{{ cancelledCount }}</div>
              <div class="stat-box__label">Số đơn đã hủy</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SEARCH & FILTERS -->
      <div class="filter-card mb-4">
        <div class="row align-items-center g-3">
          <div class="col-md-4">
            <div class="search-input-wrapper">
              <span class="material-icons search-icon">filter_list</span>
              <select v-model="statusFilter" class="form-select-p">
                <option value="all">Tất cả trạng thái</option>
                <option value="WAITING_PAYMENT">Chờ thanh toán</option>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
          <div class="col-md-4">
            <div class="search-input-wrapper">
              <span class="material-icons search-icon">calendar_today</span>
              <input type="date" v-model="dateFilter" class="form-control-p" placeholder="Chọn ngày..." />
            </div>
          </div>
          <div class="col-md-4 text-md-end">
            <button v-if="statusFilter !== 'all' || dateFilter" @click="resetFilters" class="btn-text-action">
              <span class="material-icons size-18">refresh</span> Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <!-- ORDERS FEED -->
      <div v-if="isLoading" class="loader-wrapper py-5">
        <div class="spinner-premium"></div>
        <p class="mt-4 loader-text">Đang tải lịch sử đơn hàng...</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state-p py-5">
        <div class="empty-icon-wrapper">
          <span class="material-icons">history_toggle_off</span>
        </div>
        <h3 class="empty-title">Chưa có đơn hàng nào</h3>
        <p class="empty-text">Bạn chưa thực hiện đơn đặt sân nào. Bắt đầu niềm đam mê thể thao ngay hôm nay!</p>
        <button class="btn-premium btn-premium--emerald shadow-emerald mt-3" @click="$router.push('/')">
          Khám phá sân ngay
        </button>
      </div>

      <div v-else>
        <div class="row g-4">
          <transition-group name="stagger">
            <div v-for="(order, index) in paginatedOrders" :key="order.id" class="col-lg-6 col-xl-4" :style="{ '--delay': index * 0.1 + 's' }">
              <div class="order-card-p" @click="openDetail(order)">
                <div class="order-card-p__header">
                  <div class="order-code">#{{ order.bookingCode }}</div>
                  <div :class="['status-badge-p', order.status.toLowerCase()]">
                    {{ statusLabel(order.status) }}
                  </div>
                </div>
                
                <div class="order-card-p__body">
                  <div class="venue-info">
                    <h3 class="venue-name">{{ order.club?.name || 'Sân bóng' }}</h3>
                    <p class="venue-address" v-if="order.club?.address">
                      <span class="material-icons">location_on</span> {{ order.club.address }}
                    </p>
                  </div>
                  
                  <div class="booking-meta">
                    <div class="meta-item">
                      <div class="meta-icon"><span class="material-icons">event</span></div>
                      <div class="meta-text">
                        <span class="label">Ngày đặt</span>
                        <span class="value">{{ formatDate(order.items[0]?.timeSlot?.startTime) }}</span>
                      </div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-icon"><span class="material-icons">schedule</span></div>
                      <div class="meta-text">
                        <span class="label">Khung giờ</span>
                        <span class="value">{{ formatTimeRange(order.items) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="order-card-p__footer">
                  <div class="price-wrap">
                    <span class="price-label">Tổng cộng</span>
                    <span class="price-value">{{ formatPrice(order.finalAmount) }}đ</span>
                  </div>
                  <div class="method-wrap">
                    <span class="method-icon"><span class="material-icons">payments</span></span>
                    <span>{{ payLabel(order.payment?.method) }}</span>
                  </div>
                </div>
                
                <div class="order-card-p__actions">
                  <button class="action-btn-p detail">Chi tiết</button>
                  <button v-if="order.status === 'WAITING_PAYMENT'" class="action-btn-p cancel" @click.stop="confirmCancel(order)">Hủy đơn</button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- MODERN PAGINATION -->
        <div v-if="totalPages > 1" class="pagination-wrapper mt-5">
          <button class="pag-btn prev" :disabled="currentPage === 1" @click="currentPage--">
            <span class="material-icons">chevron_left</span>
          </button>
          <div class="pag-numbers">
            <button v-for="p in totalPages" :key="p" :class="['pag-btn num', { active: currentPage === p }]" @click="currentPage = p">
              {{ p }}
            </button>
          </div>
          <button class="pag-btn next" :disabled="currentPage === totalPages" @click="currentPage++">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <transition name="modal-fade">
      <div v-if="detailOrder" class="modal-overlay-p" @click.self="detailOrder = null">
        <div class="modal-card-p wide">
          <div class="modal-card__header-p">
            <div class="d-flex align-items-center gap-3">
              <div class="modal-icon-p"><span class="material-icons">receipt_long</span></div>
              <div>
                <h2 class="modal-title-p">Chi tiết đơn hàng</h2>
                <span class="modal-booking-code">Mã đơn: #{{ detailOrder.bookingCode }}</span>
              </div>
            </div>
            <button class="modal-close-btn-p" @click="detailOrder = null">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="modal-card__body-p">
            <div class="row g-4">
              <!-- Left Column: Booking Details -->
              <div class="col-md-7">
                <div class="detail-section">
                  <h4 class="section-title-p">Thông tin sân & Khung giờ</h4>
                  <div class="venue-detail-card mb-4">
                    <div class="venue-detail-card__venue">
                      <div class="venue-icon"><span class="material-icons">sports_soccer</span></div>
                      <div>
                        <div class="venue-name-inner">{{ detailOrder.club?.name }}</div>
                        <div class="venue-addr-inner">{{ detailOrder.club?.address }}</div>
                      </div>
                    </div>
                    
                    <div class="slots-list mt-3">
                      <div v-for="item in detailOrder.items" :key="item.id" class="slot-item-p">
                        <div class="slot-info">
                          <span class="court-name">{{ item.timeSlot.court.name }}</span>
                          <span class="slot-time">{{ formatSlotTime(item.timeSlot) }}</span>
                        </div>
                        <div class="slot-price">{{ formatPrice(item.price) }}đ</div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="detailOrder.note" class="note-section-p">
                    <h4 class="section-title-p">Ghi chú từ khách hàng</h4>
                    <div class="note-box-p">{{ detailOrder.note }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Right Column: Payment & Summary -->
              <div class="col-md-5">
                <div class="detail-section">
                  <h4 class="section-title-p">Thanh toán</h4>
                  <div class="payment-summary-card">
                    <div class="summary-line">
                      <span>Tạm tính</span>
                      <span>{{ formatPrice(detailOrder.totalAmount) }}đ</span>
                    </div>
                    <div v-if="detailOrder.discountAmount > 0" class="summary-line discount">
                      <span>Giảm giá</span>
                      <span>-{{ formatPrice(detailOrder.discountAmount) }}đ</span>
                    </div>
                    <div class="summary-line total">
                      <span>Tổng cộng</span>
                      <span class="total-val">{{ formatPrice(detailOrder.finalAmount) }}đ</span>
                    </div>
                    <div class="summary-line method mt-3 pt-3 border-top">
                      <span>Phương thức</span>
                      <span class="method-tag">{{ payLabel(detailOrder.payment?.method) }}</span>
                    </div>
                  </div>
                  
                  <div v-if="detailOrder.payment?.proofImageUrl" class="proof-section mt-4">
                    <h4 class="section-title-p">Minh chứng thanh toán</h4>
                    <div class="proof-card-p" @click="openImage(detailOrder.payment.proofImageUrl)">
                      <img :src="detailOrder.payment.proofImageUrl" alt="Payment Proof" />
                      <div class="proof-overlay-p">
                        <span class="material-icons">zoom_in</span>
                        <span>Nhấn để xem ảnh lớn</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-card__footer-p px-4 pb-4">
             <button v-if="detailOrder.status === 'WAITING_PAYMENT'" class="btn-premium btn-premium--light text-danger w-100 mb-2" @click="confirmCancel(detailOrder)">
               Hủy đơn đặt sân
             </button>
             <button class="btn-premium btn-premium--emerald shadow-emerald w-100" @click="detailOrder = null">Đóng chi tiết</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- CONFIRM CANCEL MODAL -->
    <transition name="modal-fade">
      <div v-if="cancelTarget" class="modal-overlay-p" @click.self="cancelTarget = null">
        <div class="modal-card-p small">
          <div class="cancel-modal-content py-4 text-center">
            <div class="alert-icon-p"><span class="material-icons">warning_amber</span></div>
            <h3 class="modal-title-p mt-3">Xác nhận hủy đơn</h3>
            <p class="modal-text-p px-4">Bạn có chắc muốn hủy đơn đặt sân <strong>#{{ cancelTarget.bookingCode }}</strong>? Hành động này không thể hoàn tác.</p>
            
            <div class="d-flex gap-2 px-4 mt-4">
              <button class="btn-premium btn-premium--light flex-grow-1" @click="cancelTarget = null">Quay lại</button>
              <button class="btn-premium btn-premium--dark flex-grow-1" @click="proceedCancel" :disabled="isProcessing">
                <span v-if="isProcessing" class="spinner-tiny me-2"></span>
                {{ isProcessing ? 'Đang hủy...' : 'Đúng, hủy đơn' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
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
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');

.order-page {
  font-family: 'Lexend', sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
  color: #0f172a;
}

/* ── HEADER ── */
.order-header {
  background: #ffffff;
  border-bottom: 1px solid #edf2f7;
  position: sticky;
  top: 0;
  z-index: 100;
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
  margin-top: -2px;
}

.icon-btn-p {
  width: 44px; height: 44px;
  border-radius: 12px;
  border: none;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  color: #475569;
}
.icon-btn-p:hover { background: #e2e8f0; color: #0f172a; }

.user-pill-p {
  background: #f8fafc;
  border: 1.5px solid #edf2f7;
  padding: 6px 6px 6px 16px;
  border-radius: 50px;
  align-items: center;
  gap: 12px;
}
.user-pill-p__info { display: flex; flex-direction: column; text-align: right; }
.user-pill-p__name { font-weight: 800; font-size: 14px; line-height: 1.2; }
.user-pill-p__phone { font-size: 11px; color: #94a3b8; font-weight: 600; }
.user-pill-p__avatar {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 12px;
}

/* ── STAT BOXES ── */
.stat-box {
  background: #ffffff;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid #edf2f7;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  transition: all 0.3s ease;
}
.stat-box:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); }

.stat-box__icon {
  width: 52px; height: 52px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
}
.stat-box__icon.total { background: #eff6ff; color: #2563eb; }
.stat-box__icon.spent { background: #ecfdf5; color: #059669; }
.stat-box__icon.pending { background: #fffbeb; color: #d97706; }
.stat-box__icon.cancelled { background: #fff1f2; color: #e11d48; }

.stat-box__value { font-weight: 900; font-size: 1.35rem; color: #0f172a; line-height: 1.2; }
.stat-box__label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── FILTERS ── */
.filter-card {
  background: white;
  padding: 20px;
  border-radius: 24px;
  border: 1px solid #edf2f7;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.search-input-wrapper { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 14px; color: #94a3b8; font-size: 20px; pointer-events: none; }

.form-select-p, .form-control-p {
  width: 100%;
  padding: 12px 16px 12px 42px;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  outline: none;
  transition: all 0.2s;
  appearance: none;
}
.form-select-p:focus, .form-control-p:focus { border-color: #10b981; background: #ffffff; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }

.btn-text-action {
  background: transparent; border: none;
  color: #e11d48; font-weight: 800; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 10px; transition: .2s;
}
.btn-text-action:hover { background: #fff1f2; }

/* ── ORDER CARDS ── */
.order-card-p {
  background: #ffffff;
  border-radius: 28px;
  border: 1px solid #edf2f7;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  height: 100%;
}
.order-card-p::after {
  content: ''; position: absolute; top:0; left:0; width:4px; height:100%;
  background: #e2e8f0; transition: .3s;
}
.order-card-p:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-color: #10b981; }
.order-card-p:hover::after { background: #10b981; }

.order-card-p__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.order-code { font-family: 'Lexend', monospace; font-weight: 800; font-size: 13px; color: #94a3b8; }

.status-badge-p {
  font-size: 10px; font-weight: 900; text-transform: uppercase;
  padding: 4px 12px; border-radius: 20px; letter-spacing: 0.05em;
}
.status-badge-p.waiting_payment, .status-badge-p.pending { background: #fef3c7; color: #d97706; }
.status-badge-p.confirmed { background: #dcfce7; color: #059669; }
.status-badge-p.completed { background: #eff6ff; color: #2563eb; }
.status-badge-p.cancelled { background: #fff1f2; color: #e11d48; }

.venue-name { font-weight: 900; font-size: 1.25rem; color: #0f172a; margin-bottom: 4px; }
.venue-address { font-size: 12.5px; color: #64748b; display: flex; align-items: center; gap: 4px; font-weight: 500; }
.venue-address .material-icons { font-size: 16px; color: #94a3b8; }

.booking-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
.meta-item { display: flex; align-items: center; gap: 10px; }
.meta-icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: #f8fafc; color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
}
.meta-text { display: flex; flex-direction: column; }
.meta-text .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.meta-text .value { font-size: 13px; font-weight: 800; color: #1e293b; }

.order-card-p__footer {
  margin-top: auto; padding-top: 16px; border-top: 1px dashed #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
}
.price-wrap { display: flex; flex-direction: column; }
.price-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.price-value { font-weight: 900; font-size: 1.35rem; color: #059669; }

.method-wrap { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #94a3b8; }
.method-icon { font-size: 18px; }

.order-card-p__actions {
  display: flex; gap: 10px; margin-top: 20px;
}
.action-btn-p {
  flex: 1; padding: 10px; border-radius: 12px; border: none;
  font-size: 13px; font-weight: 800; transition: .2s;
}
.action-btn-p.detail { background: #ecfdf5; color: #059669; }
.action-btn-p.detail:hover { background: #dcfce7; }
.action-btn-p.cancel { background: #fff1f2; color: #e11d48; }
.action-btn-p.cancel:hover { background: #ffe4e6; }

/* ── MODALS ── */
.modal-overlay-p {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-card-p {
  background: white; border-radius: 32px; width: 100%;
  box-shadow: 0 30px 60px rgba(0,0,0,0.15); overflow: hidden;
  display: flex; flex-direction: column;
}
.modal-card-p.wide { max-width: 850px; }
.modal-card-p.small { max-width: 450px; }

.modal-card__header-p { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
.modal-icon-p { width:48px; height:48px; border-radius:14px; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center; }
.modal-title-p { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 1.5rem; margin: 0; text-transform: uppercase; }
.modal-booking-code { font-size: 12px; font-weight: 700; color: #94a3b8; display: block; }
.modal-close-btn-p { border: none; background: #f1f5f9; width: 40px; height: 40px; border-radius: 12px; display: flex; justify-content: center; align-items: center; transition: .2s; }
.modal-close-btn-p:hover { background: #e2e8f0; color: #ef4444; }

.modal-card__body-p { padding: 32px; max-height: 70vh; overflow-y: auto; }

.section-title-p { font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; position: relative; padding-left: 12px; }
.section-title-p::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #10b981; border-radius: 2px; }

.venue-detail-card { background: #f8fafc; border-radius: 20px; padding: 20px; border: 1.5px solid #edf2f7; }
.venue-detail-card__venue { display: flex; gap: 16px; align-items: center; }
.venue-icon { width: 48px; height: 48px; border-radius: 12px; background: #ffffff; color: #10b981; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }
.venue-name-inner { font-weight: 900; font-size: 1.15rem; }
.venue-addr-inner { font-size: 12.5px; color: #64748b; font-weight: 500; }

.slot-item-p { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: white; border-radius: 12px; margin-bottom: 8px; border: 1px solid #edf2f7; }
.slot-info { display: flex; flex-direction: column; }
.court-name { font-weight: 800; font-size: 14px; color: #0f172a; }
.slot-time { font-size: 12.5px; color: #64748b; font-weight: 600; }
.slot-price { font-weight: 900; color: #059669; }

.payment-summary-card { background: #1e293b; color: white; border-radius: 24px; padding: 24px; }
.summary-line { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14.5px; font-weight: 500; color: #cbd5e1; }
.summary-line.discount { color: #fb7185; }
.summary-line.total { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); color: white; }
.total-val { font-weight: 900; font-size: 1.5rem; }
.method-tag { background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; }

.proof-card-p { position: relative; border-radius: 20px; overflow: hidden; border: 2px dashed #e2e8f0; cursor: pointer; }
.proof-card-p img { width: 100%; height: auto; display: block; transition: .3s; }
.proof-overlay-p { position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; opacity: 0; transition: .2s; }
.proof-overlay-p span { font-weight: 700; font-size: 13px; margin-top: 8px; }
.proof-card-p:hover .proof-overlay-p { opacity: 1; }
.proof-card-p:hover img { transform: scale(1.05); }

.note-box-p { background: #fffbeb; border-radius: 16px; padding: 16px; border: 1px solid #fde68a; font-size: 13.5px; color: #92400e; font-weight: 500; line-height: 1.6; }

/* ── PAGINATION ── */
.pagination-wrapper { display: flex; align-items: center; justify-content: center; gap: 16px; }
.pag-btn {
  width: 44px; height: 44px; border-radius: 14px; border: 1.5px solid #e2e8f0;
  background: white; color: #475569; display: flex; align-items: center; justify-content: center;
  transition: .2s; font-weight: 800;
}
.pag-btn:hover:not(:disabled) { border-color: #10b981; color: #10b981; }
.pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pag-numbers { display: flex; gap: 8px; }
.pag-btn.num.active { background: #10b981; color: white; border-color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }

/* ── EMPTY STATE ── */
.empty-state-p { text-align: center; display: flex; flex-direction: column; align-items: center; }
.empty-icon-wrapper { width: 100px; height: 100px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; color: #cbd5e1; }
.empty-icon-wrapper span { font-size: 48px; }
.empty-title { font-weight: 900; font-size: 1.5rem; margin-bottom: 8px; }
.empty-text { color: #64748b; font-size: 15px; max-width: 350px; }

/* ── UTILS ── */
.btn-premium { font-family: 'Lexend', sans-serif; padding: 12px 28px; border-radius: 16px; font-weight: 800; border: none; transition: .2s; }
.btn-premium--emerald { background: #059669; color: white; }
.btn-premium--emerald:hover { background: #047857; transform: translateY(-2px); }
.btn-premium--light { background: #f1f5f9; color: #475569; }
.btn-premium--light:hover { background: #e2e8f0; }
.btn-premium--dark { background: #1e293b; color: white; }
.btn-premium--dark:hover { background: #0f172a; }
.shadow-emerald { box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2); }

.spinner-premium { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
.spinner-tiny { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TRANSITIONS ── */
.stagger-enter-active { animation: fadeInUp 0.4s both; animation-delay: var(--delay); }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.95); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .page-title-p { font-size: 1.35rem; }
  .stat-box { padding: 16px; gap: 12px; }
  .stat-box__icon { width: 44px; height: 44px; font-size: 20px; }
  .stat-box__value { font-size: 1.15rem; }
}
</style>