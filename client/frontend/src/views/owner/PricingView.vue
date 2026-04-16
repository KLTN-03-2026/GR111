<template>
  <div class="pricing-view fade-in">
    <div class="view-header">
      <div class="header-content">
        <h1 class="view-title">Quản lý Bảng giá & Khung giờ</h1>
        <p class="view-subtitle">Thiết lập linh hoạt giá tiền theo khung giờ, các ngày trong tuần và các dịp lễ đặc biệt cho từng sân bóng của bạn.</p>
      </div>
      <div class="court-selector-wrapper card">
        <label><span class="material-icons">sports_tennis</span> Chọn sân bóng:</label>
        <select v-model="selectedCourtId" @change="loadPricing" class="court-select">
          <option value="" disabled>-- Lựa chọn sân --</option>
          <option v-for="c in courts" :key="c.id" :value="c.id">
            {{ c.pricingCount === 0 ? '⚠️ ' : '✅ ' }}{{ c.name }} ({{ c.clubName }})
          </option>
        </select>
        <span v-if="selectedCourt && selectedCourt.pricingCount === 0" class="no-pricing-tag">
          <span class="material-icons" style="font-size:14px">warning_amber</span>
          Sân này chưa có bảng giá!
        </span>
      </div>
    </div>

    <!-- Warning banner: courts with no pricing -->
    <div v-if="courtsWithoutPricing.length > 0" class="no-pricing-banner">
      <span class="material-icons">warning_amber</span>
      <div>
        <strong>{{ courtsWithoutPricing.length }} sân chưa có bảng giá:</strong>
        <span v-for="c in courtsWithoutPricing" :key="c.id" class="npt-chip" @click="jumpToCourt(c.id)">
          {{ c.name }}
        </span>
      </div>
    </div>

    <!-- States: Loading, Empty, Select -->
    <div v-if="loadingCourts" class="loading-state card">
      <div class="spinner"></div>
      <p>Đang tải danh sách sân...</p>
    </div>

    <div v-else-if="courts.length === 0" class="empty-state card">
      <span class="material-icons">inventory_2</span>
      <h3>Bạn chưa có sân bóng nào</h3>
      <p>Vui lòng thêm sân bóng vào câu lạc bộ trước khi thiết lập bảng giá.</p>
      <router-link to="/owner/clubs" class="btn-primary mt-16">Quản lý câu lạc bộ</router-link>
    </div>

    <div v-else-if="!selectedCourtId" class="select-prompt card">
      <span class="material-icons">arrow_upward</span>
      <h3>Chưa chọn sân bóng</h3>
      <p>Vui lòng chọn một sân bóng ở phía trên để bắt đầu cấu hình giá.</p>
    </div>

    <template v-else>
      <div class="pricing-grid">
        <!-- Bảng giá định kỳ -->
        <div class="pricing-card card regular-section">
          <div class="card-header">
            <div class="header-main">
              <span class="icon-circle regular"><span class="material-icons">calendar_month</span></span>
              <div>
                <h3>Bảng giá Định kỳ</h3>
                <p>Áp dụng lặp lại theo Thứ trong tuần</p>
              </div>
            </div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <!-- Bulk copy button -->
              <button
                v-if="regularPricings.length > 0 && courtsInSameClub.length > 1"
                class="btn-copy-all"
                :disabled="isCopyingAll"
                @click="copyPricingToAllCourts"
                title="Sao chép bảng giá này đến tất cả sân khác trong cùng CLB"
              >
                <span class="material-icons">content_copy</span>
                <span v-if="isCopyingAll">Đang sao chép...</span>
                <span v-else>Sao chép cho tất cả sân</span>
              </button>
              <button class="btn-add" @click="openModal('regular')">
                <span class="material-icons">add</span> Thêm mới
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ngày áp dụng</th>
                  <th>Khung giờ</th>
                  <th>Giá / Giờ</th>
                  <th>Nhãn</th>
                  <th class="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, index) in regularPricings" :key="p.id || 'reg-' + index">
                  <td>
                    <span v-if="p.dayOfWeek === null" class="badge-day all">Hàng ngày</span>
                    <span v-else class="badge-day highlight">{{ getDayName(p.dayOfWeek) }}</span>
                  </td>
                  <td class="time-range">{{ formatTime(p.startTime) }} - {{ formatTime(p.endTime) }}</td>
                  <td class="price-val">{{ formatPrice(p.pricePerHour) }}</td>
                  <td><span v-if="p.label" class="label-tag">{{ p.label }}</span><span v-else>-</span></td>
                  <td class="text-right">
                    <div class="action-group-v5">
                      <button class="btn-action-edit" @click="openModal('regular', p)" title="Sửa khung giờ">
                        <span class="material-icons">edit</span>
                      </button>
                      <button class="btn-action-delete" @click="askDelete('regular', p.id)" title="Xóa khung giờ">
                        <span class="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="regularPricings.length === 0">
                  <td colspan="5" class="empty-table">Chưa có cấu hình giá định kỳ.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bảng giá ngày lễ -->
        <div class="pricing-card card special-section">
          <div class="card-header">
            <div class="header-main">
              <span class="icon-circle special"><span class="material-icons">celebration</span></span>
              <div>
                <h3>Giá Ngày Lễ & Đặc biệt</h3>
                <p>Ưu tiên áp dụng cho ngày cụ thể</p>
              </div>
            </div>
            <button class="btn-add special" @click="openModal('special')">
              <span class="material-icons">stars</span> Thêm ngày lễ
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Khung giờ</th>
                  <th>Giá / Giờ</th>
                  <th>Ghi chú</th>
                  <th class="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, index) in specialPricings" :key="s.id || 'spec-' + index">
                  <td><span class="date-val">{{ formatDate(s.specificDate) }}</span></td>
                  <td class="time-range">{{ formatTime(s.startTime) }} - {{ formatTime(s.endTime) }}</td>
                  <td class="price-val special">{{ formatPrice(s.pricePerHour) }}</td>
                  <td class="note-cell">{{ s.note || '-' }}</td>
                  <td class="text-right">
                    <div class="action-group-v5">
                      <button class="btn-action-edit" @click="openModal('special', s)" title="Sửa ngày lễ">
                        <span class="material-icons">edit</span>
                      </button>
                      <button class="btn-action-delete" @click="askDelete('special', s.id)" title="Xóa khung giờ">
                        <span class="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="specialPricings.length === 0">
                  <td colspan="5" class="empty-table">Chưa có cấu hình giá ngày đặc biệt.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal Form (Add/Update) -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal-content pricing-modal card elevation-high">
          <div class="modal-header header-special">
            <div class="modal-title-group">
               <span class="material-icons modal-icon-v5">{{ modalType === 'regular' ? 'schedule' : 'edit' }}</span>
               <h3 class="modal-title-v5">{{ form.id ? 'Cập Nhật' : 'Thêm Mới' }} {{ modalType === 'regular' ? 'Giá Định Kỳ' : 'Giá Ngày Đặc Biệt' }}</h3>
            </div>
            <button class="btn-close" @click="showModal = false"><span class="material-icons">close</span></button>
          </div>
          
          <div class="modal-body p-v5">
            <div class="form-row mb-v5">
              <div v-if="modalType === 'regular'" class="form-group full">
                <label class="form-label-v5">Ngày áp dụng trong tuần</label>
                <select v-model="form.dayOfWeek" class="form-input">
                  <option :value="null">Tất cả các ngày</option>
                  <option :value="1">Thứ Hai</option>
                  <option :value="2">Thứ Ba</option>
                  <option :value="3">Thứ Tư</option>
                  <option :value="4">Thứ Năm</option>
                  <option :value="5">Thứ Sáu</option>
                  <option :value="6">Thứ Bảy</option>
                  <option :value="0">Chủ Nhật</option>
                </select>
              </div>
              <div v-else class="form-group full">
                <label class="form-label-v5">Chọn ngày áp dụng</label>
                <input type="date" v-model="form.specificDate" class="form-input" />
              </div>
            </div>

            <div class="form-row split mb-20">
              <div class="form-group">
                <label class="form-label-v5">Giờ bắt đầu</label>
                <input type="time" v-model="form.startTime" class="form-input" :class="{'is-invalid': timeError}" />
              </div>
              <div class="form-group">
                <label class="form-label-v5">Giờ kết thúc</label>
                <input type="time" v-model="form.endTime" class="form-input" :class="{'is-invalid': timeError}" />
              </div>
            </div>
            <p v-if="timeError" class="error-text">Lỗi: Giờ kết thúc phải sau giờ bắt đầu.</p>

            <div class="form-row mb-v5">
              <div class="form-group full">
                <label class="form-label-v5">Giá tiền mỗi giờ (VNĐ)</label>
                <div class="price-input-wrapper">
                  <input type="number" v-model="form.pricePerHour" class="form-input price-custom" placeholder="VD: 250000" />
                  <span class="currency-label-v5">VNĐ</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full">
                <label class="form-label-v5">{{ modalType === 'regular' ? 'Nhãn (VD: Giờ vàng)' : 'Ghi chú (VD: Lễ 30/4)' }}</label>
                <input type="text" v-model="form.label" class="form-input" :placeholder="modalType === 'regular' ? 'VD: Khung giờ sáng' : 'VD: Ngày giải phóng'" />
              </div>
            </div>

            <div v-if="overlapError" class="conflict-alert animate-in">
              <div class="alert-icon"><span class="material-icons">warning</span></div>
              <div class="alert-content">
                <strong>Xung đột khung giờ!</strong>
                <p>Khung giờ này bị trùng với cấu hình đã có ({{ overlapError.time }}). Vui lòng điều chỉnh lại.</p>
              </div>
            </div>

            <div v-if="pricingPreview" class="pricing-preview-box">
              <span class="label">Tổng quan giá:</span>
              <span class="value">{{ formatPrice(form.pricePerHour) }}/giờ</span>
            </div>
          </div>

          <div class="modal-footer footer-special">
            <button class="btn-secondary-v5" @click="showModal = false">Quay lại</button>
            <button class="btn-submit-v5" @click="handleSave" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-small"></span>
              {{ isSaving ? 'Đang lưu...' : 'Xác nhận lưu' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Custom Confirmation Modal -->
      <div v-if="confirmDelete.show" class="modal-backdrop confirm-z" @click.self="confirmDelete.show = false">
        <div class="modal-content pricing-modal card confirm-container">
          <div class="modal-body p-confirm text-center">
            <div class="icon-warning-wrapper">
              <span class="material-icons text-red-large">warning</span>
            </div>
            <h3 class="confirm-title-v5">Xác nhận xóa bảng giá?</h3>
            <p class="confirm-desc-v5">Bạn có chắc chắn muốn xóa khung giờ này không? Hành động này sẽ loại bỏ hoàn toàn bảng giá khỏi hệ thống.</p>
            <div class="confirm-actions-v5">
              <button class="btn-delete-confirm" @click="executeDelete" :disabled="isDeleting">
                <span v-if="isDeleting" class="spinner-small"></span>
                {{ isDeleting ? 'Đang xử lý...' : 'ĐỒNG Ý XÓA' }}
              </button>
              <button class="btn-cancel-v5" @click="confirmDelete.show = false" :disabled="isDeleting">QUAY LẠI</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'OwnerPricingView',
  data() {
    return {
      courts: [],
      selectedCourtId: '',
      regularPricings: [],
      specialPricings: [],
      loadingCourts: true,
      isCopyingAll: false,
      showModal: false,
      modalType: 'regular',
      isSaving: false,
      isDeleting: false,
      timeError: false,
      confirmDelete: {
        show: false,
        type: '',
        id: null
      },
      form: {
        id: null,
        dayOfWeek: null,
        specificDate: '',
        startTime: '06:00',
        endTime: '22:00',
        pricePerHour: 200000,
        label: ''
      },
      overlapError: null
    };
  },
  computed: {
    pricingPreview() {
      return this.form.pricePerHour > 0;
    },
    selectedCourt() {
      return this.courts.find(c => c.id === this.selectedCourtId) || null;
    },
    courtsWithoutPricing() {
      return this.courts.filter(c => c.pricingCount === 0);
    },
    courtsInSameClub() {
      if (!this.selectedCourt) return [];
      return this.courts.filter(c => c.clubName === this.selectedCourt.clubName);
    }
  },
  mounted() {
    this.loadCourts();
  },
  methods: {
    async loadCourts() {
      this.loadingCourts = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/owner/courts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.courts = res.data?.data || [];
        if (this.courts.length > 0) {
          this.selectedCourtId = this.courts[0].id;
          this.loadPricing();
        }
      } catch (e) {
        console.error('Lỗi tải danh sách sân', e);
      } finally {
        this.loadingCourts = false;
      }
    },

    jumpToCourt(courtId) {
      this.selectedCourtId = courtId;
      this.loadPricing();
    },

    async copyPricingToAllCourts() {
      const otherCourts = this.courtsInSameClub.filter(c => c.id !== this.selectedCourtId);
      if (otherCourts.length === 0) return;

      const confirmed = confirm(
        `Sẽ sao chép ${this.regularPricings.length} khung giá định kỳ sang ${otherCourts.length} sân còn lại trong cùng CLB.\n\n` +
        `⚠️ Bảng giá định kỳ hiện có của các sân đích sẽ bị XÓA và thay thế.\n\n` +
        `Sân sẽ cập nhật: ${otherCourts.map(c => c.name).join(', ')}\n\nTiếp tục?`
      );
      if (!confirmed) return;

      this.isCopyingAll = true;
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let successCount = 0;
      let errorCount = 0;

      for (const court of otherCourts) {
        try {
          // 1. Fetch existing pricings for target court
          const res = await axios.get(`/api/owner/courts/${court.id}/pricing`, { headers });
          const existingRegular = res.data?.data?.regularPricings || [];

          // 2. Delete all existing regular pricings to avoid OVERLAP
          for (const ep of existingRegular) {
            await axios.delete(`/api/owner/courts/${court.id}/pricing?type=regular&id=${ep.id}`, { headers });
          }

          // 3. Create new pricings from source
          for (const p of this.regularPricings) {
            await axios.post(`/api/owner/courts/${court.id}/pricing`, {
              id: null,
              startTime: this.formatTimeRaw(p.startTime) + ':00',
              endTime: this.formatTimeRaw(p.endTime) + ':00',
              pricePerHour: Number(p.pricePerHour),
              dayOfWeek: p.dayOfWeek,
              label: p.label || ''
            }, { headers });
          }
          successCount++;
        } catch (e) {
          console.error(`Lỗi copy giá sang sân ${court.name}:`, e);
          errorCount++;
        }
      }

      // Reload courts list to update pricingCount badges
      await this.loadCourts();
      this.isCopyingAll = false;

      if (errorCount > 0) {
        alert(`Hoàn thành: ${successCount} sân thành công, ${errorCount} sân bị lỗi. Kiểm tra console để biết chi tiết.`);
      } else {
        alert(`✅ Đã sao chép bảng giá lên ${successCount} sân thành công!`);
      }
    },

    async loadPricing() {
      if (!this.selectedCourtId) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/owner/courts/${this.selectedCourtId}/pricing`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data?.data || {};
        this.regularPricings = data.regularPricings || [];
        this.specialPricings = data.specialPricings || [];
      } catch (e) {
        console.error('Lỗi tải bảng giá', e);
      }
    },

    openModal(type, item = null) {
      this.modalType = type;
      this.timeError = false;
      if (item) {
        // Nếu là sửa, fill dữ liệu cũ
        this.form = {
          id: item.id,
          dayOfWeek: item.dayOfWeek,
          specificDate: item.specificDate ? new Date(item.specificDate).toISOString().split('T')[0] : '',
          startTime: this.formatTimeRaw(item.startTime),
          endTime: this.formatTimeRaw(item.endTime),
          pricePerHour: item.pricePerHour,
          label: item.label || item.note || ''
        };
      } else {
        // Nếu là thêm mới, reset form
        this.form = {
          id: null,
          dayOfWeek: null,
          specificDate: new Date().toISOString().split('T')[0],
          startTime: '06:00',
          endTime: '22:00',
          pricePerHour: 200000,
          label: ''
        };
      }
      this.showModal = true;
      this.overlapError = null;
    },

    checkOverlap() {
      const start = this.form.startTime;
      const end = this.form.endTime;
      const day = this.form.dayOfWeek;
      const date = this.form.specificDate;
      
      const list = this.modalType === 'regular' ? this.regularPricings : this.specialPricings;
      
      for (const item of list) {
        if (item.id === this.form.id) continue;
        
        let match = false;
        if (this.modalType === 'regular') {
          // Check day overlap (null = all days)
          if (day === null || item.dayOfWeek === null || day === item.dayOfWeek) {
            match = true;
          }
        } else {
          // Check specific date overlap
          if (date === new Date(item.specificDate).toISOString().split('T')[0]) {
            match = true;
          }
        }

        if (match) {
          const itemStart = this.formatTimeRaw(item.startTime);
          const itemEnd = this.formatTimeRaw(item.endTime);
          
          // Time overlap logic
          if (start < itemEnd && end > itemStart) {
            this.overlapError = { time: `${itemStart} - ${itemEnd}` };
            return true;
          }
        }
      }
      this.overlapError = null;
      return false;
    },

    async handleSave() {
      if (!this.selectedCourtId) return;
      
      // Validate time
      if (this.form.startTime >= this.form.endTime) {
         this.timeError = true;
         return;
      }
      this.timeError = false;

      if (this.checkOverlap()) {
        return;
      }

      this.isSaving = true;
      try {
        const token = localStorage.getItem('token');
        const isSpecial = this.modalType === 'special';
        
        const payload = {
          id: this.form.id, // Giữ ID để Backend biết là Update hay Create
          startTime: this.form.startTime + ":00",
          endTime: this.form.endTime + ":00",
          pricePerHour: Number(this.form.pricePerHour) || 0,
        };

        if (isSpecial) {
           payload.specificDate = this.form.specificDate;
           payload.note = this.form.label || "";
        } else {
           // Đảm bảo dayOfWeek là số hoặc null
           payload.dayOfWeek = (this.form.dayOfWeek === null || this.form.dayOfWeek === "") ? null : Number(this.form.dayOfWeek);
           payload.label = this.form.label || "";
        }

        const method = isSpecial ? 'put' : 'post';
        await axios[method](`/api/owner/courts/${this.selectedCourtId}/pricing`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.showModal = false;
        this.loadPricing();
      } catch (e) {
        // Hiển thị lỗi từ Backend (Ví dụ: "OVERLAP_PRICING...")
        const msg = e.response?.data?.message || 'Có lỗi xảy ra khi lưu bảng giá';
        alert(msg);
      } finally {
        this.isSaving = false;
      }
    },

    askDelete(type, id) {
      this.confirmDelete = {
        show: true,
        type: type,
        id: id
      };
    },

    async executeDelete() {
      const { type, id } = this.confirmDelete;
      if (!id) return;
      
      this.isDeleting = true;
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/owner/courts/${this.selectedCourtId}/pricing?type=${type}&id=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.confirmDelete.show = false;
        this.loadPricing();
      } catch (e) {
        console.error('Delete error:', e);
        alert('Không thể xóa bảng giá. Vui lòng thử lại sau.');
      } finally {
        this.isDeleting = false;
      }
    },

    getDayName(d) {
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return days[d];
    },
    formatTime(t) {
      if (!t) return '--:--';
      // Xử lý cả chuỗi thời gian HH:mm:ss hoặc ISO string
      let hours, minutes;
      if (typeof t === 'string' && t.includes(':') && !t.includes('T')) {
          [hours, minutes] = t.split(':');
      } else {
          const date = new Date(t);
          hours = date.getUTCHours().toString().padStart(2, '0');
          minutes = date.getUTCMinutes().toString().padStart(2, '0');
      }
      return `${hours}:${minutes}`;
    },
    formatTimeRaw(t) {
       if (!t) return '06:00';
       if (typeof t === 'string' && t.includes(':') && !t.includes('T')) {
          return t.substring(0, 5); // Lấy HH:mm
       }
       const date = new Date(t);
       const h = date.getUTCHours().toString().padStart(2, '0');
       const m = date.getUTCMinutes().toString().padStart(2, '0');
       return `${h}:${m}`;
    },
    formatPrice(p) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }
};
</script>

<style scoped>
/* Main Layout */
.pricing-view { padding: 24px; max-width: 1400px; margin: 0 auto; color: #1e293b; }
.view-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 24px; }
.view-title { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 8px; line-height: 1; }
.view-subtitle { color: #64748b; font-size: 16px; }

/* Court Selector */
.court-selector-wrapper { padding: 16px 24px; display: flex; flex-direction: column; gap: 8px; min-width: 320px; }
.court-selector-wrapper label { font-size: 13px; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 6px; }
.court-select { border: 1px solid #e2e8f0; background: #f8fafc; padding: 12px; border-radius: 12px; font-weight: 700; color: #1e293b; cursor: pointer; font-size: 14px; transition: 0.2s; }
.court-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

/* Common Components */
.card { background: white; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #f1f5f9; }
.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Grid & Section Headers */
.pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.card-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
.header-main { display: flex; align-items: center; gap: 16px; }
.icon-circle { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.icon-circle.regular { background: #eff6ff; color: #3b82f6; }
.icon-circle.special { background: #f5f3ff; color: #8b5cf6; }
.card-header h3 { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 2px; }
.card-header p { font-size: 13px; color: #94a3b8; font-weight: 500; }

/* Buttons */
.btn-add { background: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
.btn-add:hover { background: #0f172a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2); }
.btn-add.special { background: #7c3aed; }
.btn-add.special:hover { background: #6d28d9; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2); }

/* Table Styling */
.table-container { overflow-x: auto; width: 100%; border-radius: 0 0 20px 20px; }
.data-table { width: 100%; border-collapse: collapse; min-width: 580px; }
.data-table th { padding: 18px 16px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.1em; border-bottom: 2px solid #f1f5f9; background: #f8fafc; }
.data-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; font-size: 14px; }
.data-table tr:hover td { background: #fcfdfe; }

.badge-day { padding: 6px 12px; border-radius: 100px; font-size: 11px; font-weight: 800; }
.badge-day.all { background: #f1f5f9; color: #64748b; }
.badge-day.highlight { background: #dcfce7; color: #166534; }

.price-val { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; }
.price-val.special { color: #7c3aed; }
.label-tag { background: #fffbeb; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #b45309; border: 1px solid #fef3c7; }
.note-cell { font-size: 13px; color: #64748b; font-style: italic; }

/* Nút sửa / xóa cao cấp */
.action-group-v5 { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

.btn-action-edit, .btn-action-delete {
  padding: 8px; border-radius: 12px; cursor: pointer; transition: 0.3s;
  display: inline-flex; align-items: center; justify-content: center;
}

.btn-action-edit {
  color: #3b82f6; background: #eff6ff; border: 1.5px solid #dbeafe; 
}
.btn-action-edit:hover { background: #3b82f6; color: white; border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }

.btn-action-delete {
  color: #ef4444; background: #fff1f2; border: 1.5px solid #fecdd3; 
}
.btn-action-delete:hover { background: #ef4444; color: white; border-color: #ef4444; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }

.btn-action-edit span, .btn-action-delete span { font-size: 20px; }

/* Modal Core Styles */
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
.pricing-modal { width: 100%; max-width: 520px; overflow: hidden; animation: zoomIn-v5 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes zoomIn-v5 { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

.header-special { background: #f8fafc; padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-title-group { display: flex; align-items: center; gap: 14px; }
.modal-icon-v5 { color: #3b82f6; font-size: 28px; }
.modal-title-v5 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }

.p-v5 { padding: 32px; }
.form-row { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.mb-v5 { margin-bottom: 24px; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex-direction: row; }

.form-label-v5 { font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 0.02em; }
.form-input { width: 100%; padding: 14px 16px; border: 2px solid #f1f5f9; border-radius: 14px; font-family: inherit; font-size: 15px; background: #f8fafc; transition: 0.2s; box-sizing: border-box; }
.form-input:focus { border-color: #3b82f6; background: white; outline: none; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); }

.price-input-wrapper { position: relative; width: 100%; }
.price-custom { font-size: 22px; font-weight: 800; color: #16a34a; padding-right: 60px; }
.currency-label-v5 { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-weight: 800; color: #94a3b8; font-size: 14px; pointer-events: none; }

.footer-special { background: #f8fafc; padding: 24px 32px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }
.btn-secondary-v5 { background: white; border: 1.5px solid #e2e8f0; padding: 12px 24px; border-radius: 12px; font-weight: 800; color: #64748b; cursor: pointer; transition: 0.2s; font-size: 14px; }
.btn-secondary-v5:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
.btn-submit-v5 { background: #3b82f6; color: white; border: none; padding: 12px 32px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; font-size: 14px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
.btn-submit-v5:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }

/* Confirmation Modal Specifics */
.confirm-z { z-index: 10001; }
.confirm-container { max-width: 420px; border-radius: 28px; border: none; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
.p-confirm { padding: 40px 32px; }
.icon-warning-wrapper { width: 72px; height: 72px; background: #fff1f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; animation: pulse-v5 2s infinite; }
@keyframes pulse-v5 { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
.text-red-large { color: #ef4444; font-size: 36px; }
.confirm-title-v5 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
.confirm-desc-v5 { font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 32px; }
.confirm-actions-v5 { display: flex; flex-direction: column; gap: 12px; }
.btn-delete-confirm { background: #ef4444; color: white; border: none; padding: 16px; border-radius: 16px; font-weight: 800; font-size: 14px; letter-spacing: 0.05em; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
.btn-delete-confirm:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4); }
.btn-cancel-v5 { background: #f1f5f9; color: #475569; border: none; padding: 14px; border-radius: 16px; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; }
.btn-cancel-v5:hover { background: #e2e8f0; color: #1e293b; }

/* Status States */
.loading-state, .empty-state, .select-prompt { padding: 100px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
.loading-state p { font-weight: 600; color: #64748b; }
.spinner { width: 44px; height: 44px; border: 4px solid #f1f5f9; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin-v5 1s linear infinite; }
@keyframes spin-v5 { to { transform: rotate(360deg); } }
.spinner-small { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin-v5 0.8s linear infinite; }

/* Error styles */
.is-invalid { border-color: #ef4444 !important; background-color: #fff1f2 !important; }
.error-text { color: #ef4444; font-size: 12px; font-weight: 600; margin-top: -16px; margin-bottom: 20px; animation: shake 0.4s ease-in-out; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.empty-state span, .select-prompt span { font-size: 64px; color: #e2e8f0; }
.empty-state h3, .select-prompt h3 { font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
.empty-state p, .select-prompt p { color: #64748b; font-size: 15px; }

.conflict-alert { margin-top: 20px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 14px; padding: 16px; display: flex; gap: 12px; align-items: flex-start; }
.alert-icon { color: #ef4444; }
.alert-content strong { display: block; color: #991b1b; font-size: 14px; margin-bottom: 2px; }
.alert-content p { font-size: 13px; color: #b91c1c; margin: 0; }

.pricing-preview-box { margin-top: 20px; background: #f0fdf4; border-radius: 14px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border: 1.5px solid #dcfce7; }
.pricing-preview-box .label { font-size: 13px; font-weight: 700; color: #166534; }
.pricing-preview-box .value { font-size: 16px; font-weight: 800; color: #15803d; font-family: 'Barlow Condensed', sans-serif; }

.animate-in { animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* No-pricing warning */
.no-pricing-banner {
  display: flex; align-items: flex-start; gap: 14px;
  background: #fffbeb; border: 1.5px solid #fde68a;
  border-radius: 16px; padding: 16px 20px;
  margin-bottom: 24px; color: #92400e;
}
.no-pricing-banner strong { display: block; margin-bottom: 6px; font-size: 14px; }
.no-pricing-banner .material-icons { color: #f59e0b; font-size: 24px; flex-shrink: 0; margin-top: 2px; }
.npt-chip {
  display: inline-flex; align-items: center; gap: 4px;
  background: #fef3c7; border: 1px solid #fde68a;
  border-radius: 8px; padding: 3px 10px;
  font-size: 12px; font-weight: 700; color: #92400e;
  margin-left: 6px; cursor: pointer; transition: 0.2s;
}
.npt-chip:hover { background: #fde68a; }
.no-pricing-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: #fff7ed; border: 1px solid #fed7aa;
  color: #c2410c; border-radius: 8px; padding: 4px 10px;
  font-size: 12px; font-weight: 700; margin-top: 4px;
}
.btn-copy-all {
  display: inline-flex; align-items: center; gap: 8px;
  background: #f0fdf4; color: #15803d;
  border: 1.5px solid #bbf7d0; border-radius: 12px;
  padding: 9px 18px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: 0.2s;
}
.btn-copy-all:hover:not(:disabled) { background: #dcfce7; border-color: #86efac; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(21,128,61,0.15); }
.btn-copy-all:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-copy-all .material-icons { font-size: 18px; }

@media (max-width: 1024px) { .pricing-grid { grid-template-columns: 1fr; } .view-header { flex-direction: column; align-items: stretch; } .split { grid-template-columns: 1fr; } }
</style>
