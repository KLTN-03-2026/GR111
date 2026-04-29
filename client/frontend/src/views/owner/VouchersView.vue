<template>
  <div class="vouchers-page">
    <!-- Header -->
    <header class="vouchers-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <span class="material-icons header-icon">local_offer</span>
        </div>
        <div>
          <h1 class="page-title">Chương trình khuyến mãi</h1>
          <p class="subtitle">Tạo mã giảm giá — có thể giới hạn theo từng sân hoặc áp dụng toàn bộ sân của CLB.</p>
        </div>
      </div>
      <div v-if="clubs.length > 1" class="club-inline-select">
        <span class="material-icons">business</span>
        <select v-model="clubId" class="club-select" @change="fetchVouchers">
          <option v-for="cl in clubs" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
        </select>
      </div>
      <button class="create-btn" @click="openCreateModal">
        <span class="material-icons">add</span>
        Tạo mã mới
      </button>
    </header>

    <!-- Stats bar -->
    <div class="stats-bar" v-if="!loading">
      <div class="stat-chip">
        <span class="material-icons">confirmation_number</span>
        <span>Tổng: <strong>{{ vouchers.length }}</strong></span>
      </div>
      <div class="stat-chip active">
        <span class="material-icons">check_circle</span>
        <span>Đang hoạt động: <strong>{{ activeCount }}</strong></span>
      </div>
      <div class="stat-chip expired">
        <span class="material-icons">schedule</span>
        <span>Hết hạn: <strong>{{ expiredCount }}</strong></span>
      </div>
      <div class="stat-chip inactive">
        <span class="material-icons">pause_circle</span>
        <span>Tạm dừng: <strong>{{ inactiveCount }}</strong></span>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons spin">sync</span>
      <p>Đang tải danh sách voucher...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredVouchers.length === 0" class="empty-state">
      <span class="material-icons empty-icon">local_offer</span>
      <h3>Chưa có mã giảm giá nào</h3>
      <p>{{ activeTab === 'all' ? 'Hãy tạo mã giảm giá đầu tiên để thu hút khách hàng!' : 'Không có voucher nào trong mục này.' }}</p>
      <button v-if="activeTab === 'all'" class="create-btn" @click="openCreateModal">
        <span class="material-icons">add</span> Tạo ngay
      </button>
    </div>

    <!-- Voucher Grid -->
    <div v-else class="vouchers-grid">
      <div
        v-for="v in filteredVouchers"
        :key="v.id"
        class="voucher-card"
        :class="{ 'is-inactive': !v.isActive, 'is-expired': isExpired(v) }"
      >
        <!-- Status badge -->
        <div class="voucher-status-badge" :class="statusClass(v)">
          <span class="material-icons" style="font-size:13px">{{ statusIcon(v) }}</span>
          {{ statusLabel(v) }}
        </div>

        <!-- Top accent bar -->
        <div class="accent-bar" :style="{ background: typeColor(v.type) }"></div>

        <div class="voucher-body">
          <!-- Type chip + code -->
          <div class="voucher-meta">
            <span class="type-chip" :style="{ background: typeColorSoft(v.type), color: typeColor(v.type) }">
              {{ v.type === 'PERCENTAGE' ? '% Phần trăm' : '₫ Cố định' }}
            </span>
          </div>

          <div class="voucher-main">
            <div>
              <h3 class="voucher-code">{{ v.code }}</h3>
              <p class="voucher-title">{{ v.title }}</p>
              <p class="voucher-desc" v-if="v.description">{{ v.description }}</p>
            </div>
            <div class="voucher-value" :style="{ color: typeColor(v.type) }">
              {{ v.type === 'PERCENTAGE' ? `-${v.value}%` : `-${Number(v.value).toLocaleString('vi-VN')}đ` }}
            </div>
          </div>

          <!-- Details grid -->
          <div class="details-grid">
            <div class="detail-item detail-scope">
              <span class="material-icons">sports_soccer</span>
              <span>{{ voucherCourtScope(v) }}</span>
            </div>
            <div class="detail-item">
              <span class="material-icons">trending_up</span>
              <span>Đã dùng: <strong>{{ v.usedCount }}</strong>{{ v.usageLimit ? ` / ${v.usageLimit}` : '' }}</span>
            </div>
            <div class="detail-item" v-if="v.minOrderAmount">
              <span class="material-icons">shopping_cart</span>
              <span>Tối thiểu: <strong>{{ Number(v.minOrderAmount).toLocaleString('vi-VN') }}đ</strong></span>
            </div>
            <div class="detail-item" v-if="v.maxDiscount">
              <span class="material-icons">discount</span>
              <span>Giảm tối đa: <strong>{{ Number(v.maxDiscount).toLocaleString('vi-VN') }}đ</strong></span>
            </div>
            <div class="detail-item">
              <span class="material-icons">person</span>
              <span>Mỗi người: <strong>{{ v.usagePerUser }} lần</strong></span>
            </div>
          </div>

          <!-- Date range -->
          <div class="date-range">
            <span class="material-icons">date_range</span>
            <span>{{ formatDate(v.startDate) }} → {{ formatDate(v.endDate) }}</span>
          </div>

          <!-- Usage bar -->
          <div class="usage-bar-wrap" v-if="v.usageLimit">
            <div class="usage-bar">
              <div class="usage-fill" :style="{ width: usagePct(v) + '%', background: typeColor(v.type) }"></div>
            </div>
            <span class="usage-pct">{{ usagePct(v) }}%</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="voucher-actions">
          <button class="action-btn edit" @click="openEditModal(v)" title="Chỉnh sửa">
            <span class="material-icons">edit</span>
          </button>
          <button
            class="action-btn toggle"
            :class="{ 'on': v.isActive }"
            @click="toggleVoucher(v)"
            :title="v.isActive ? 'Tạm dừng' : 'Kích hoạt'"
          >
            <span class="material-icons">{{ v.isActive ? 'pause_circle' : 'play_circle' }}</span>
          </button>
          <button class="action-btn delete" @click="confirmDelete(v)" title="Xóa">
            <span class="material-icons">delete_outline</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── CREATE / EDIT MODAL ───────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <h2>{{ editingVoucher ? 'Chỉnh sửa voucher' : 'Tạo mã giảm giá mới' }}</h2>
              <button class="modal-close" @click="closeModal">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form @submit.prevent="submitForm" class="modal-body" autocomplete="off">
              <div v-if="formError" class="form-error-banner">
                <span class="material-icons">error_outline</span> {{ formError }}
              </div>

              <!-- Row 1: Code + Type -->
              <div class="form-row">
                <div class="form-group">
                  <label>Mã voucher <span class="required">*</span></label>
                  <input
                    v-model="form.code"
                    placeholder="VD: SUMMER2026"
                    class="form-input"
                    :disabled="!!editingVoucher"
                    style="text-transform: uppercase"
                    required
                  />
                  <span class="form-hint">Mã tự động được viết hoa</span>
                </div>
                <div class="form-group">
                  <label>Loại giảm giá <span class="required">*</span></label>
                  <select v-model="form.type" class="form-input" required>
                    <option value="PERCENTAGE">% Phần trăm</option>
                    <option value="FIXED_AMOUNT">₫ Số tiền cố định</option>
                  </select>
                </div>
              </div>

              <!-- Title -->
              <div class="form-group">
                <label>Tiêu đề <span class="required">*</span></label>
                <input v-model="form.title" placeholder="VD: Khuyến mãi mùa hè..." class="form-input" required />
              </div>

              <!-- Description -->
              <div class="form-group">
                <label>Mô tả</label>
                <textarea v-model="form.description" rows="2" placeholder="Mô tả ngắn về chương trình..." class="form-input form-textarea"></textarea>
              </div>

              <!-- Row 2: Value + MinOrder -->
              <div class="form-row">
                <div class="form-group">
                  <label>Giá trị giảm <span class="required">*</span></label>
                  <div class="input-icon-wrap">
                    <input v-model="form.value" type="number" min="0" :max="form.type === 'PERCENTAGE' ? 100 : undefined" placeholder="0" class="form-input" required />
                    <span class="input-suffix">{{ form.type === 'PERCENTAGE' ? '%' : 'đ' }}</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Đơn hàng tối thiểu</label>
                  <div class="input-icon-wrap">
                    <input v-model="form.minOrderAmount" type="number" min="0" placeholder="Không giới hạn" class="form-input" />
                    <span class="input-suffix">đ</span>
                  </div>
                </div>
              </div>

              <!-- Row 3: MaxDiscount + UsageLimit -->
              <div class="form-row">
                <div class="form-group" v-if="form.type === 'PERCENTAGE'">
                  <label>Giảm tối đa</label>
                  <div class="input-icon-wrap">
                    <input v-model="form.maxDiscount" type="number" min="0" placeholder="Không giới hạn" class="form-input" />
                    <span class="input-suffix">đ</span>
                  </div>
                </div>
                <div class="form-group">
                  <label>Giới hạn lượt dùng</label>
                  <input v-model="form.usageLimit" type="number" min="1" placeholder="Không giới hạn" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Mỗi người dùng</label>
                  <input v-model="form.usagePerUser" type="number" min="1" placeholder="1" class="form-input" />
                </div>
              </div>

              <!-- Row 4: Dates -->
              <div class="form-row">
                <div class="form-group">
                  <label>Ngày bắt đầu <span class="required">*</span></label>
                  <input v-model="form.startDate" type="date" class="form-input" required />
                </div>
                <div class="form-group">
                  <label>Ngày kết thúc <span class="required">*</span></label>
                  <input v-model="form.endDate" type="date" class="form-input" required />
                </div>
              </div>

              <div class="form-group full-width">
                <label>Giới hạn theo sân</label>
                <p class="form-hint hint-block">Không chọn sân nào = áp dụng <strong>tất cả sân</strong> của CLB. Chọn một hoặc nhiều sân để mã chỉ dùng được khi đặt đúng các sân đó.</p>
                <div v-if="clubCourts.length" class="court-check-grid">
                  <label v-for="court in clubCourts" :key="court.id" class="court-check">
                    <input type="checkbox" :value="court.id" v-model="form.courtIds" />
                    <span>{{ court.name }}</span>
                  </label>
                </div>
                <p v-else class="form-hint muted">CLB chưa có sân nào — thêm sân trong phần quản lý sân để giới hạn theo sân.</p>
              </div>

              <!-- Preview -->
              <div class="voucher-preview" v-if="form.code && form.value">
                <div class="preview-label">Xem trước</div>
                <div class="preview-card">
                  <span class="preview-code">{{ form.code.toUpperCase() }}</span>
                  <span class="preview-value" :style="{ color: form.type === 'PERCENTAGE' ? '#16a34a' : '#2563eb' }">
                    {{ form.type === 'PERCENTAGE' ? `-${form.value}%` : `-${Number(form.value||0).toLocaleString('vi-VN')}đ` }}
                  </span>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-cancel" @click="closeModal">Hủy</button>
                <button type="submit" class="btn-submit" :disabled="submitting">
                  <span v-if="submitting" class="material-icons spin" style="font-size:16px">sync</span>
                  {{ submitting ? 'Đang lưu...' : (editingVoucher ? 'Lưu thay đổi' : 'Tạo voucher') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── DELETE CONFIRM MODAL ──────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
          <div class="modal-box confirm-box">
            <div class="confirm-icon">
              <span class="material-icons">delete_forever</span>
            </div>
            <h3>Xóa voucher này?</h3>
            <p>Mã <strong>{{ deletingVoucher?.code }}</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
            <div class="modal-footer" style="justify-content: center;">
              <button class="btn-cancel" @click="showDeleteConfirm = false">Hủy</button>
              <button class="btn-delete" @click="executeDelete" :disabled="submitting">
                <span v-if="submitting" class="material-icons spin" style="font-size:16px">sync</span>
                {{ submitting ? 'Đang xóa...' : 'Xác nhận xóa' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { voucherService } from '@/services/voucher.service';
import { clubService }   from '@/services/club.service';
import { toast }         from 'vue3-toastify';

const EMPTY_FORM = () => ({
  code:           '',
  title:          '',
  description:    '',
  type:           'PERCENTAGE',
  value:          '',
  minOrderAmount: '',
  maxDiscount:    '',
  usageLimit:     '',
  usagePerUser:   1,
  startDate:      '',
  endDate:        '',
  courtIds:       [],
});

export default {
  name: 'OwnerVouchersView',

  data() {
    return {
      clubId:     null,
      clubs:      [],
      vouchers:   [],
      loading:    true,
      activeTab:  'all',

      // Modal
      showModal:      false,
      editingVoucher: null,
      form:           EMPTY_FORM(),
      formError:      '',
      submitting:     false,

      // Delete
      showDeleteConfirm: false,
      deletingVoucher:   null,
    };
  },

  async mounted() {
    await this.init();
  },

  computed: {
    now() { return new Date(); },

    activeCount()   { return this.vouchers.filter(v => v.isActive && !this.isExpired(v)).length; },
    expiredCount()  { return this.vouchers.filter(v => this.isExpired(v)).length; },
    inactiveCount() { return this.vouchers.filter(v => !v.isActive && !this.isExpired(v)).length; },

    tabs() {
      return [
        { key: 'all',      label: 'Tất cả',         count: this.vouchers.length },
        { key: 'active',   label: 'Đang hoạt động', count: this.activeCount },
        { key: 'inactive', label: 'Tạm dừng',       count: this.inactiveCount },
        { key: 'expired',  label: 'Hết hạn',         count: this.expiredCount },
      ];
    },

    filteredVouchers() {
      switch (this.activeTab) {
        case 'active':   return this.vouchers.filter(v => v.isActive && !this.isExpired(v));
        case 'inactive': return this.vouchers.filter(v => !v.isActive && !this.isExpired(v));
        case 'expired':  return this.vouchers.filter(v => this.isExpired(v));
        default:         return this.vouchers;
      }
    },

    clubCourts() {
      const c = this.clubs.find((x) => x.id === this.clubId);
      return c?.courts || [];
    },
  },

  methods: {
    async init() {
      try {
        const clubRes = await clubService.getOwnerClubs();
        if (clubRes.data?.success && clubRes.data.data?.length > 0) {
          this.clubs = clubRes.data.data;
          this.clubId = this.clubs[0].id;
          await this.fetchVouchers();
        }
      } catch (e) {
        console.error(e);
        toast.error('Không thể tải dữ liệu câu lạc bộ');
      } finally {
        this.loading = false;
      }
    },

    async fetchVouchers() {
      if (!this.clubId) return;
      try {
        const res = await voucherService.getClubVouchers(this.clubId);
        const payload = res?.data;
        this.vouchers = Array.isArray(payload) ? payload : [];
      } catch (e) {
        console.error(e);
        toast.error('Không thể tải danh sách voucher');
      }
    },

    // ── Helpers ──────────────────────────────────────────────
    isExpired(v) { return new Date(v.endDate) < this.now; },

    statusClass(v) {
      if (this.isExpired(v)) return 'badge-expired';
      if (v.isActive) return 'badge-active';
      return 'badge-inactive';
    },
    statusLabel(v) {
      if (this.isExpired(v)) return 'Hết hạn';
      if (v.isActive) return 'Hoạt động';
      return 'Tạm dừng';
    },
    statusIcon(v) {
      if (this.isExpired(v)) return 'schedule';
      if (v.isActive) return 'check_circle';
      return 'pause_circle';
    },
    typeColor(type)     { return type === 'PERCENTAGE' ? '#16a34a' : '#2563eb'; },
    typeColorSoft(type) { return type === 'PERCENTAGE' ? '#dcfce7' : '#dbeafe'; },

    usagePct(v) {
      if (!v.usageLimit) return 0;
      return Math.round((v.usedCount / v.usageLimit) * 100);
    },

    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    voucherCourtScope(v) {
      const rows = v.applicableCourts || [];
      if (!rows.length) return 'Áp dụng mọi sân của CLB';
      const names = rows.map((r) => r.court?.name || r.courtId).filter(Boolean);
      return names.length ? `Chỉ áp dụng: ${names.join(', ')}` : 'Giới hạn sân';
    },

    // ── Modal ────────────────────────────────────────────────
    openCreateModal() {
      this.editingVoucher = null;
      this.form           = EMPTY_FORM();
      this.formError      = '';
      this.showModal      = true;
    },

    openEditModal(v) {
      this.editingVoucher = v;
      this.form = {
        code:           v.code,
        title:          v.title,
        description:    v.description || '',
        type:           v.type,
        value:          Number(v.value),
        minOrderAmount: v.minOrderAmount ? Number(v.minOrderAmount) : '',
        maxDiscount:    v.maxDiscount   ? Number(v.maxDiscount)    : '',
        usageLimit:     v.usageLimit    ? Number(v.usageLimit)     : '',
        usagePerUser:   v.usagePerUser,
        startDate:      v.startDate ? v.startDate.split('T')[0] : '',
        endDate:        v.endDate   ? v.endDate.split('T')[0]   : '',
        courtIds:       (v.applicableCourts || []).map((ac) => ac.courtId),
      };
      this.formError = '';
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.editingVoucher = null;
    },

    async submitForm() {
      this.formError = '';
      if (this.form.type === 'PERCENTAGE' && (Number(this.form.value) < 1 || Number(this.form.value) > 100)) {
        this.formError = 'Giá trị phần trăm phải từ 1% đến 100%'; return;
      }
      if (new Date(this.form.endDate) <= new Date(this.form.startDate)) {
        this.formError = 'Ngày kết thúc phải sau ngày bắt đầu'; return;
      }

      this.submitting = true;
      try {
        const payload = {
          code:           this.form.code.toUpperCase(),
          title:          this.form.title,
          description:    this.form.description || null,
          type:           this.form.type,
          value:          Number(this.form.value),
          minOrderAmount: this.form.minOrderAmount ? Number(this.form.minOrderAmount) : null,
          maxDiscount:    this.form.maxDiscount    ? Number(this.form.maxDiscount)    : null,
          usageLimit:     this.form.usageLimit     ? Number(this.form.usageLimit)     : null,
          usagePerUser:   Number(this.form.usagePerUser) || 1,
          startDate:      this.form.startDate,
          endDate:        this.form.endDate,
          courtIds:       Array.isArray(this.form.courtIds) ? this.form.courtIds : [],
        };

        if (this.editingVoucher) {
          await voucherService.updateVoucher(this.clubId, this.editingVoucher.id, payload);
          toast.success('✅ Cập nhật voucher thành công!');
        } else {
          await voucherService.createVoucher(this.clubId, payload);
          toast.success('🎉 Tạo mã giảm giá thành công!');
        }

        this.closeModal();
        await this.fetchVouchers();
      } catch (e) {
        const msg = e?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        this.formError = msg;
      } finally {
        this.submitting = false;
      }
    },

    // ── Toggle Active ─────────────────────────────────────────
    async toggleVoucher(v) {
      try {
        await voucherService.toggleVoucher(this.clubId, v.id, !v.isActive);
        v.isActive = !v.isActive;
        toast.success(v.isActive ? '✅ Đã kích hoạt voucher!' : '⏸ Đã tạm dừng voucher!');
      } catch (e) {
        toast.error('Không thể cập nhật trạng thái voucher');
      }
    },

    // ── Delete ────────────────────────────────────────────────
    confirmDelete(v) {
      this.deletingVoucher   = v;
      this.showDeleteConfirm = true;
    },

    async executeDelete() {
      if (!this.deletingVoucher) return;
      this.submitting = true;
      try {
        await voucherService.deleteVoucher(this.clubId, this.deletingVoucher.id);
        toast.success('🗑️ Đã xóa voucher!');
        this.showDeleteConfirm = false;
        this.deletingVoucher   = null;
        await this.fetchVouchers();
      } catch (e) {
        toast.error('Không thể xóa voucher');
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.vouchers-page {
  font-family: 'DM Sans', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Header ─────────────────────────────────────────── */
.vouchers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 20px;
  padding: 24px 28px;
  border: 1px solid #e9eef6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon-wrap {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, #16a34a, #059669);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(22,163,74,0.3);
}
.header-icon { color: #fff; font-size: 26px; }
.page-title  { font-size: 24px; font-weight: 800; margin: 0; color: #0f1623; }
.subtitle    { font-size: 14px; color: #64748b; margin: 4px 0 0; }

.club-inline-select {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.club-inline-select .material-icons { font-size: 20px; color: #64748b; }
.club-select {
  border: none; background: transparent; font-weight: 600; font-size: 14px; color: #0f1623;
  cursor: pointer; max-width: 220px;
}

.details-grid .detail-scope span:last-child { font-size: 12px; color: #475569; line-height: 1.35; }

.court-check-grid {
  display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;
}
.court-check {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}
.court-check input { accent-color: #16a34a; }

.form-group.full-width { grid-column: 1 / -1; }
.hint-block { margin-top: 4px; margin-bottom: 8px; line-height: 1.45; }
.form-hint.muted { color: #94a3b8; font-style: italic; }

.create-btn {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #16a34a, #059669);
  color: #fff; border: none;
  padding: 12px 22px; border-radius: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(22,163,74,0.35);
  transition: all 0.25s;
}
.create-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(22,163,74,0.4); }

/* ── Stats Bar ────────────────────────────────────── */
.stats-bar {
  display: flex; gap: 12px; flex-wrap: wrap;
}
.stat-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 12px;
  background: #f8fafc; border: 1px solid #e9eef6;
  font-size: 13px; color: #4b5672;
}
.stat-chip .material-icons { font-size: 17px; color: #9aa3bc; }
.stat-chip.active  { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
.stat-chip.active .material-icons { color: #16a34a; }
.stat-chip.expired { background: #fef9f0; border-color: #fde68a; color: #b45309; }
.stat-chip.expired .material-icons { color: #b45309; }
.stat-chip.inactive { background: #f8fafc; border-color: #e2e8f0; color: #94a3b8; }

/* ── Filter Tabs ──────────────────────────────────── */
.filter-tabs { display: flex; gap: 8px; }
.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: 1px solid #e2e8f0; background: #fff;
  color: #64748b; transition: all 0.2s;
}
.tab-btn:hover  { border-color: #16a34a; color: #16a34a; }
.tab-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; box-shadow: 0 3px 10px rgba(22,163,74,0.3); }
.tab-count {
  background: rgba(255,255,255,0.25); color: inherit;
  font-size: 11px; font-weight: 700;
  padding: 1px 7px; border-radius: 100px;
  min-width: 20px; text-align: center;
}
.tab-btn:not(.active) .tab-count { background: #f1f5f9; color: #64748b; }

/* ── Loading / Empty ──────────────────────────────── */
.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 80px 20px; color: #9aa3bc;
  background: #fff; border-radius: 20px; border: 1px solid #e9eef6;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 56px; color: #cbd5e1; }
.empty-state h3 { font-size: 18px; font-weight: 700; color: #334155; margin: 0; }
.empty-state p  { font-size: 14px; color: #64748b; margin: 0; text-align: center; }

/* ── Voucher Grid ─────────────────────────────────── */
.vouchers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.voucher-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e9eef6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow: hidden;
  transition: all 0.28s;
  position: relative;
  display: flex;
  flex-direction: column;
}
.voucher-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.voucher-card.is-inactive { opacity: 0.7; }
.voucher-card.is-expired  { opacity: 0.6; }

.accent-bar { height: 4px; width: 100%; }

/* Status badge */
.voucher-status-badge {
  position: absolute; top: 16px; right: 16px;
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 100px;
  font-size: 11px; font-weight: 700;
}
.badge-active   { background: #f0fdf4; color: #16a34a; }
.badge-expired  { background: #fef9f0; color: #b45309; }
.badge-inactive { background: #f1f5f9; color: #94a3b8; }

.voucher-body { padding: 18px 20px; flex: 1; display: flex; flex-direction: column; gap: 12px; }

.voucher-meta { display: flex; align-items: center; }
.type-chip {
  font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 100px;
}

.voucher-main {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
}
.voucher-code  { font-size: 20px; font-weight: 800; color: #0f1623; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 1px; }
.voucher-title { font-size: 13px; font-weight: 600; color: #334155; margin: 3px 0 0; }
.voucher-desc  { font-size: 12px; color: #64748b; margin: 3px 0 0; }
.voucher-value { font-size: 26px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }

.details-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.detail-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #64748b;
}
.detail-item .material-icons { font-size: 15px; color: #94a3b8; }

.date-range {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #64748b;
  background: #f8fafc; padding: 8px 12px; border-radius: 10px;
}
.date-range .material-icons { font-size: 15px; color: #94a3b8; }

.usage-bar-wrap { display: flex; align-items: center; gap: 10px; }
.usage-bar {
  flex: 1; height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden;
}
.usage-fill {
  height: 100%; border-radius: 100px;
  transition: width 0.5s ease;
}
.usage-pct { font-size: 12px; font-weight: 700; color: #64748b; width: 36px; text-align: right; }

/* Actions */
.voucher-actions {
  display: flex; border-top: 1px solid #f1f5f9;
}
.action-btn {
  flex: 1; padding: 12px; border: none; background: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; gap: 6px;
  transition: all 0.18s; color: #64748b;
}
.action-btn .material-icons { font-size: 18px; }
.action-btn:not(:last-child) { border-right: 1px solid #f1f5f9; }
.action-btn.edit:hover   { background: #f0fdf4; color: #16a34a; }
.action-btn.toggle:hover { background: #eff6ff; color: #2563eb; }
.action-btn.toggle.on    { color: #2563eb; }
.action-btn.delete:hover { background: #fff1f2; color: #ef4444; }

/* ── Modal ───────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 22, 35, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-box {
  background: #fff; border-radius: 24px;
  width: 100%; max-width: 620px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2);
}
.confirm-box {
  max-width: 400px; padding: 36px;
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.confirm-icon .material-icons { font-size: 52px; color: #ef4444; }
.confirm-box h3 { font-size: 20px; font-weight: 800; color: #0f1623; margin: 0; }
.confirm-box p  { font-size: 14px; color: #64748b; margin: 0; line-height: 1.6; }

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 28px 0;
}
.modal-header h2 { font-size: 20px; font-weight: 800; color: #0f1623; margin: 0; }
.modal-close {
  background: #f1f5f9; border: none; border-radius: 10px;
  width: 36px; height: 36px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; transition: 0.2s;
}
.modal-close:hover { background: #fee2e2; color: #ef4444; }

.modal-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }

.form-error-banner {
  display: flex; align-items: center; gap: 8px;
  background: #fff1f2; border: 1px solid #fecdd3;
  color: #be123c; padding: 12px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 600;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #334155; }
.required { color: #ef4444; }
.form-hint { font-size: 11px; color: #94a3b8; }
.form-input {
  padding: 10px 14px; border-radius: 10px;
  border: 1px solid #e2e8f0; font-size: 14px; color: #0f1623;
  outline: none; transition: border-color 0.2s; background: #fff;
  width: 100%; box-sizing: border-box;
}
.form-input:focus  { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
.form-textarea     { resize: vertical; min-height: 72px; font-family: inherit; }
.input-icon-wrap   { position: relative; }
.input-icon-wrap .form-input { padding-right: 36px; }
.input-suffix {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 13px; font-weight: 700; color: #94a3b8; pointer-events: none;
}

/* Preview */
.voucher-preview { margin-top: 4px; }
.preview-label   { font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.preview-card    {
  display: flex; justify-content: space-between; align-items: center;
  background: #f8fafc; border: 1.5px dashed #cbd5e1;
  border-radius: 12px; padding: 14px 18px;
}
.preview-code  { font-size: 18px; font-weight: 800; color: #0f1623; font-family: 'Courier New', monospace; letter-spacing: 1px; }
.preview-value { font-size: 22px; font-weight: 800; }

.modal-footer {
  display: flex; gap: 12px; justify-content: flex-end;
  padding: 0 28px 24px;
}
.btn-cancel {
  padding: 11px 22px; border-radius: 12px;
  border: 1px solid #e2e8f0; background: #fff;
  font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer;
  transition: 0.2s;
}
.btn-cancel:hover { background: #f1f5f9; }
.btn-submit {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 24px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #16a34a, #059669);
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(22,163,74,0.3); transition: 0.2s;
}
.btn-submit:hover:not(:disabled) { box-shadow: 0 6px 18px rgba(22,163,74,0.4); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-delete {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 24px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(239,68,68,0.3); transition: 0.2s;
}
.btn-delete:disabled { opacity: 0.7; cursor: not-allowed; }

/* ── Transitions ─────────────────────────────────── */
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.96) translateY(8px); }

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 768px) {
  .vouchers-header { flex-direction: column; gap: 16px; align-items: flex-start; }
  .vouchers-grid   { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .stats-bar { gap: 8px; }
}
</style>
