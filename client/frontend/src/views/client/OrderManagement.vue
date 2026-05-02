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
import '@/assets/ordermanager.css';

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