<template>
  <div class="clubs-view">
    <!-- Header Section -->
    <div class="view-header">
      <div class="header-info">
        <h1 class="view-title">Quản lý Câu lạc bộ</h1>
        <p class="view-subtitle">Danh sách các cơ sở thể thao do bạn làm chủ.</p>
      </div>
      <button class="add-btn" data-bs-toggle="modal" data-bs-target="#addClubModal">
        <span class="material-icons">add_circle</span>
        <span>Thêm câu lạc bộ mới</span>
      </button>
    </div>

    <!-- ========== MODAL THÊM MỚI ========== -->
    <div class="modal fade" id="addClubModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Thêm mới câu lạc bộ</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Validation errors -->
            <div v-if="addErrors.length > 0" class="alert alert-danger py-2">
              <ul class="mb-0 ps-3">
                <li v-for="err in addErrors" :key="err" style="font-size:13px;">{{ err }}</li>
              </ul>
            </div>

            <form id="addClubForm" novalidate>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Tên CLB <span class="text-danger">*</span></label>
                  <input v-model="add_Club.name" type="text" class="form-control"
                    :class="{ 'is-invalid': addSubmitted && !add_Club.name }"
                    placeholder="Sân bóng Thành Phát..." />
                  <div class="invalid-feedback">Vui lòng nhập tên câu lạc bộ.</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label">Thành phố <span class="text-danger">*</span></label>
                  <input v-model="add_Club.city" type="text" class="form-control"
                    :class="{ 'is-invalid': addSubmitted && !add_Club.city }"
                    placeholder="Đà Nẵng..." />
                  <div class="invalid-feedback">Vui lòng nhập thành phố.</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label">Quận / Huyện <span class="text-danger">*</span></label>
                  <input v-model="add_Club.district" type="text" class="form-control"
                    :class="{ 'is-invalid': addSubmitted && !add_Club.district }"
                    placeholder="Hải Châu..." />
                  <div class="invalid-feedback">Vui lòng nhập quận/huyện.</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label">Số điện thoại</label>
                  <input v-model="add_Club.phone" type="tel" class="form-control" placeholder="0901 234 567" />
                </div>

                <div class="col-12 mb-3">
                  <label class="form-label">Địa chỉ đầy đủ <span class="text-danger">*</span></label>
                  <input v-model="add_Club.address" type="text" class="form-control"
                    :class="{ 'is-invalid': addSubmitted && !add_Club.address }"
                    placeholder="123 Phạm Hùng..." />
                  <div class="invalid-feedback">Vui lòng nhập địa chỉ.</div>
                </div>

                <div class="col-12 mb-3">
                  <label class="form-label">Link hình ảnh bìa</label>
                  <input v-model="add_Club.coverImageUrl" type="text" class="form-control" placeholder="https://..." />
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Trạng thái</label>
                  <select v-model="add_Club.approvalStatus" class="form-select">
                    <option value="APPROVED">Đang hoạt động</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="REJECTED">Tạm ngưng</option>
                  </select>
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Giờ mở cửa</label>
                  <input v-model="add_Club.openTime" type="time" class="form-control" />
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Giờ đóng cửa</label>
                  <input v-model="add_Club.closeTime" type="time" class="form-control" />
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Số sân</label>
                  <input v-model.number="add_Club.totalCourts" type="number" class="form-control" min="1" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="resetAddForm">Hủy</button>
            <button type="button" class="btn btn-primary" :disabled="addLoading" @click="addClub">
              <span v-if="addLoading" class="spinner-border spinner-border-sm me-1"></span>
              {{ addLoading ? 'Đang lưu...' : 'Lưu câu lạc bộ' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== MODAL CHỈNH SỬA ========== -->
    <div class="modal fade" id="editClubModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Chỉnh sửa: <strong>{{ edit_Club.name }}</strong></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Validation errors -->
            <div v-if="editErrors.length > 0" class="alert alert-danger py-2">
              <ul class="mb-0 ps-3">
                <li v-for="err in editErrors" :key="err" style="font-size:13px;">{{ err }}</li>
              </ul>
            </div>

            <form novalidate>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Tên CLB <span class="text-danger">*</span></label>
                  <input v-model="edit_Club.name" type="text" class="form-control"
                    :class="{ 'is-invalid': editSubmitted && !edit_Club.name }"
                    placeholder="Sân bóng Thành Phát..." />
                  <div class="invalid-feedback">Vui lòng nhập tên câu lạc bộ.</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label">Thành phố <span class="text-danger">*</span></label>
                  <input v-model="edit_Club.city" type="text" class="form-control"
                    :class="{ 'is-invalid': editSubmitted && !edit_Club.city }"
                    placeholder="Đà Nẵng..." />
                  <div class="invalid-feedback">Vui lòng nhập thành phố.</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label">Quận / Huyện <span class="text-danger">*</span></label>
                  <input v-model="edit_Club.district" type="text" class="form-control"
                    :class="{ 'is-invalid': editSubmitted && !edit_Club.district }"
                    placeholder="Hải Châu..." />
                  <div class="invalid-feedback">Vui lòng nhập quận/huyện.</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label">Số điện thoại</label>
                  <input v-model="edit_Club.phone" type="tel" class="form-control" placeholder="0901 234 567" />
                </div>

                <div class="col-12 mb-3">
                  <label class="form-label">Địa chỉ đầy đủ <span class="text-danger">*</span></label>
                  <input v-model="edit_Club.address" type="text" class="form-control"
                    :class="{ 'is-invalid': editSubmitted && !edit_Club.address }"
                    placeholder="123 Phạm Hùng..." />
                  <div class="invalid-feedback">Vui lòng nhập địa chỉ.</div>
                </div>

                <div class="col-12 mb-3">
                  <label class="form-label">Link hình ảnh bìa</label>
                  <input v-model="edit_Club.coverImageUrl" type="text" class="form-control" placeholder="https://..." />
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Trạng thái</label>
                  <select v-model="edit_Club.approvalStatus" class="form-select">
                    <option value="APPROVED">Đang hoạt động</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="REJECTED">Tạm ngưng</option>
                  </select>
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Giờ mở cửa</label>
                  <input v-model="edit_Club.openTime" type="time" class="form-control" />
                </div>

                <div class="col-md-4 mb-3">
                  <label class="form-label">Giờ đóng cửa</label>
                  <input v-model="edit_Club.closeTime" type="time" class="form-control" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-primary" :disabled="editLoading" @click="editClub">
              <span v-if="editLoading" class="spinner-border spinner-border-sm me-1"></span>
              {{ editLoading ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== MODAL XÁC NHẬN XÓA ========== -->
    <div class="modal fade" id="deleteClubModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title text-danger">Xác nhận xóa</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body pt-2">
            <p style="font-size:14px;">
              Bạn có chắc chắn muốn xóa câu lạc bộ
              <strong>{{ deleteTarget.name }}</strong>?
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-danger btn-sm" :disabled="deleteLoading" @click="deleteClub">
              <span v-if="deleteLoading" class="spinner-border spinner-border-sm me-1"></span>
              {{ deleteLoading ? 'Đang xóa...' : 'Xác nhận xóa' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="search-bar">
      <div class="input-wrap">
        <span class="material-icons search-icon">search</span>
        <input type="text" v-model="searchQuery" placeholder="Tìm kiếm theo tên hoặc địa chỉ..." />
      </div>
      <div class="filter-group">
        <select v-model="statusFilter">
          <option value="all">Tất cả trạng thái</option>
          <option value="APPROVED">Đang hoạt động</option>
          <option value="REJECTED">Tạm ngưng</option>
          <option value="PENDING">Chờ duyệt</option>
        </select>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="clubs-grid">
      <div v-for="n in 3" :key="n" class="club-card skeleton-card">
        <div class="skeleton-img"></div>
        <div style="padding:20px;">
          <div class="skeleton-line" style="width:60%;height:18px;margin-bottom:10px;"></div>
          <div class="skeleton-line" style="width:40%;height:13px;margin-bottom:20px;"></div>
          <div class="skeleton-line" style="width:90%;height:13px;margin-bottom:8px;"></div>
          <div class="skeleton-line" style="width:70%;height:13px;"></div>
        </div>
      </div>
    </div>

    <!-- Clubs Grid -->
    <div class="clubs-grid" v-else-if="filteredClubs.length > 0">
      <div v-for="(club, i) in filteredClubs" :key="club.id" class="club-card" :style="`--delay: ${i * 80}ms`">
        <div class="club-image">
          <img :src="club.coverImageUrl || 'https://via.placeholder.com/400x200?text=No+Image'" :alt="club.name" />
          <div class="status-badge" :class="club.approvalStatus">
            {{ getStatusText(club.approvalStatus) }}
          </div>
        </div>

        <div class="club-details">
          <div class="club-main">
            <h3 class="club-name">{{ club.name }}</h3>
            <p class="club-meta">{{ club.district }} · {{ club.city }}</p>
            <p class="club-id">ID: {{ club.clubId }}</p>
          </div>

          <div class="info-row">
            <span class="material-icons info-icon">location_on</span>
            <span class="info-text">{{ club.address }}</span>
          </div>

          <div class="info-row">
            <span class="material-icons info-icon">schedule</span>
            <span v-if="club.openingHours && club.openingHours.length > 0" class="info-text">
              Giờ mở cửa: {{ formatTime(club.openingHours[0].openTime) }} – {{ formatTime(club.openingHours[0].closeTime) }}
            </span>
            <span v-else class="info-text" style="color:#94a3b8;">Chưa cập nhật giờ mở cửa</span>
          </div>

          <div class="club-stats">
            <div class="stat-item">
              <span class="stat-num">{{ club.courts ? club.courts.length : 0 }}</span>
              <span class="stat-label">Sân đấu</span>
            </div>
          </div>

          <div class="club-actions">
            <!-- Nút Edit: gán dữ liệu club vào form rồi mở modal -->
            <span
              class="material-icons btn-action edit"
              title="Chỉnh sửa"
              data-bs-toggle="modal"
              data-bs-target="#editClubModal"
              @click="openEditModal(club)"
            >edit</span>

            <!-- Nút Xóa: mở modal xác nhận -->
            <span
              class="material-icons btn-action delete"
              title="Xóa câu lạc bộ"
              data-bs-toggle="modal"
              data-bs-target="#deleteClubModal"
              @click="openDeleteModal(club)"
            >delete</span>

            <router-link :to="`/owner/courts?clubId=${club.id}`" class="btn-action manage">
              <span class="material-icons">sports_soccer</span>
              <span>Quản lý sân</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <span class="material-icons">business</span>
      </div>
      <h3>Chưa có câu lạc bộ nào</h3>
      <p>Bạn chưa thêm cơ sở kinh doanh nào vào hệ thống.</p>
      <button class="add-btn mt-20" data-bs-toggle="modal" data-bs-target="#addClubModal">
        <span class="material-icons">add_circle</span>
        <span>Thêm câu lạc bộ ngay</span>
      </button>
    </div>
  </div>
</template>

<script>
import { Modal } from "bootstrap";
import { clubService } from "@/services/club.service";

export default {
  name: "OwnerClubsView",
  data() {
    return {
      searchQuery: "",
      statusFilter: "all",
      loading: false,
      addLoading: false,
      editLoading: false,
      deleteLoading: false,

      // Validate flags
      addSubmitted: false,
      editSubmitted: false,
      addErrors: [],
      editErrors: [],

      // Form thêm mới
      add_Club: {
        name: "",
        address: "",
        coverImageUrl: "",
        city: "",
        district: "",
        phone: "",
        description: "",
        approvalStatus: "PENDING",
        openTime: "",
        closeTime: "",
        totalCourts: null,
      },

      // Form chỉnh sửa — id lưu riêng để gửi lên API
      edit_Club: {
        id: null,         // <-- ID của CLB cần update
        name: "",
        address: "",
        coverImageUrl: "",
        city: "",
        district: "",
        phone: "",
        description: "",
        approvalStatus: "",
        openTime: "",
        closeTime: "",
      },

      // Mục tiêu xóa
      deleteTarget: {
        id: null,
        name: "",
      },

      clubs: [],
    };
  },
  computed: {
    filteredClubs() {
      return this.clubs.filter((club) => {
        const q = this.searchQuery.toLowerCase();
        const matchesSearch =
          club.name.toLowerCase().includes(q) ||
          club.address.toLowerCase().includes(q);
        const matchesStatus =
          this.statusFilter === "all" ||
          club.approvalStatus === this.statusFilter;
        return matchesSearch && matchesStatus;
      });
    },
  },
  mounted() {
    this.fetchClubs();
  },
  methods: {
    // ─── Format giờ ───────────────────────────────────────
    formatTime(time) {
      if (!time) return "--:--";
      // Nếu API trả về ISO string
      const d = new Date(time);
      if (!isNaN(d)) {
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      // Nếu API trả về "HH:mm:ss"
      return time.slice(0, 5);
    },

    getStatusText(status) {
      const map = {
        APPROVED: "Đang hoạt động",
        REJECTED: "Tạm ngưng",
        PENDING: "Chờ duyệt",
      };
      return map[status] || status;
    },

    // ─── Validate form thêm mới ───────────────────────────
    validateAdd() {
      this.addErrors = [];
      if (!this.add_Club.name.trim())     this.addErrors.push("Tên câu lạc bộ không được để trống.");
      if (!this.add_Club.city.trim())     this.addErrors.push("Thành phố không được để trống.");
      if (!this.add_Club.district.trim()) this.addErrors.push("Quận/huyện không được để trống.");
      if (!this.add_Club.address.trim())  this.addErrors.push("Địa chỉ không được để trống.");
      return this.addErrors.length === 0;
    },

    // ─── Validate form chỉnh sửa ─────────────────────────
    validateEdit() {
      this.editErrors = [];
      if (!this.edit_Club.name.trim())     this.editErrors.push("Tên câu lạc bộ không được để trống.");
      if (!this.edit_Club.city.trim())     this.editErrors.push("Thành phố không được để trống.");
      if (!this.edit_Club.district.trim()) this.editErrors.push("Quận/huyện không được để trống.");
      if (!this.edit_Club.address.trim())  this.editErrors.push("Địa chỉ không được để trống.");
      return this.editErrors.length === 0;
    },

    // ─── Lấy danh sách CLB ───────────────────────────────
    async fetchClubs() {
      this.loading = true;
      try {
        const response = await clubService.Getallthedetails();
        if (response.data.success) {
          this.clubs = response.data.data || [];
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách câu lạc bộ:", error);
      } finally {
        this.loading = false;
      }
    },

    // ─── Thêm mới CLB ─────────────────────────────────────
    async addClub() {
      this.addSubmitted = true;
      if (!this.validateAdd()) return;

      this.addLoading = true;
      try {
        const response = await clubService.addClub(this.add_Club);
        if (response.data.success) {
          this.clubs.push(response.data.data);
          this.resetAddForm();
          // Đóng modal sau khi lưu thành công
          const modal = Modal.getInstance(document.getElementById("addClubModal"));
          if (modal) modal.hide();
          alert("Thêm câu lạc bộ thành công! Vui lòng chờ Admin phê duyệt.");
        }
      } catch (error) {
        console.error("Lỗi khi thêm câu lạc bộ:", error);
        alert("Có lỗi xảy ra khi thêm mới. Vui lòng thử lại.");
      } finally {
        this.addLoading = false;
      }
    },

    // ─── Mở modal edit & điền sẵn dữ liệu ───────────────
    openEditModal(club) {
      // Lấy giờ từ openingHours nếu có
      const openTime  = club.openingHours?.[0]?.openTime  ?? "";
      const closeTime = club.openingHours?.[0]?.closeTime ?? "";

      this.edit_Club = {
        id:             club.id,          // <-- lưu ID để gửi API
        name:           club.name         ?? "",
        address:        club.address      ?? "",
        coverImageUrl:  club.coverImageUrl ?? "",
        city:           club.city         ?? "",
        district:       club.district     ?? "",
        phone:          club.phone        ?? "",
        description:    club.description  ?? "",
        approvalStatus: club.approvalStatus ?? "",
        openTime:       this.toTimeInput(openTime),
        closeTime:      this.toTimeInput(closeTime),
      };

      // Reset validation khi mở modal mới
      this.editSubmitted = false;
      this.editErrors = [];
    },

    // Chuyển ISO hoặc "HH:mm:ss" về "HH:mm" cho <input type="time">
    toTimeInput(time) {
      if (!time) return "";
      const d = new Date(time);
      if (!isNaN(d)) {
        return d.toTimeString().slice(0, 5);
      }
      return time.slice(0, 5);
    },

    // ─── Lưu chỉnh sửa CLB ───────────────────────────────
    async editClub() {
      this.editSubmitted = true;
      if (!this.validateEdit()) return;

      this.editLoading = true;
      try {
        // Dùng this.edit_Club.id làm ID cần update
        const response = await clubService.editClub(this.edit_Club.id, this.edit_Club);
        if (response.data.success) {
          // Cập nhật lại clubs list local (không cần gọi lại API)
          const idx = this.clubs.findIndex((c) => c.id === this.edit_Club.id);
          if (idx !== -1) {
            this.clubs[idx] = { ...this.clubs[idx], ...response.data.data };
          }
          // Đóng modal sau khi lưu thành công
          const modal = Modal.getInstance(document.getElementById("editClubModal"));
          if (modal) modal.hide();
          alert("Cập nhật thông tin thành công!");
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật câu lạc bộ:", error);
        alert("Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.");
      } finally {
        this.editLoading = false;
      }
    },

    // ─── Mở modal xác nhận xóa ────────────────────────────
    openDeleteModal(club) {
      this.deleteTarget = { id: club.id, name: club.name };
    },

    // ─── Xóa CLB sau khi xác nhận ─────────────────────────
    async deleteClub() {
      this.deleteLoading = true;
      try {
        const response = await clubService.deleteClub(this.deleteTarget.id);
        if (response.data.success) {
          this.clubs = this.clubs.filter((c) => c.id !== this.deleteTarget.id);
          const modal = Modal.getInstance(document.getElementById("deleteClubModal"));
          if (modal) modal.hide();
          alert(`Đã xóa câu lạc bộ "${this.deleteTarget.name}".`);
          this.deleteTarget = { id: null, name: "" };
        }
      } catch (error) {
        console.error("Lỗi khi xóa câu lạc bộ:", error);
        alert("Có lỗi xảy ra khi xóa. Vui lòng thử lại.");
      } finally {
        this.deleteLoading = false;
      }
    },

    // ─── Reset form thêm mới ──────────────────────────────
    resetAddForm() {
      this.add_Club = {
        name: "", address: "", coverImageUrl: "",
        city: "", district: "", phone: "", description: "",
        approvalStatus: "PENDING", openTime: "", closeTime: "", totalCourts: null,
      };
      this.addSubmitted = false;
      this.addErrors = [];
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/icon?family=Material+Icons");
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap");

.clubs-view {
  font-family: "Be Vietnam Pro", sans-serif;
  color: #0f1623;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header ── */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}
.view-title   { font-size: 26px; font-weight: 800; margin: 0 0 4px; }
.view-subtitle{ color: #64748b; font-size: 14px; margin: 0; }

.add-btn {
  display: flex; align-items: center; gap: 8px;
  background: #16a34a; color: white; border: none;
  padding: 11px 22px; border-radius: 12px; font-weight: 700;
  cursor: pointer; transition: all .2s;
  box-shadow: 0 4px 12px rgba(22,163,74,.25);
}
.add-btn:hover { background: #15803d; transform: translateY(-2px); }

/* ── Search bar ── */
.search-bar {
  display: flex; gap: 12px; margin-bottom: 28px;
  background: white; padding: 16px;
  border-radius: 14px; border: 1px solid #eaecf2;
}
.input-wrap { flex: 1; position: relative; }
.search-icon {
  position: absolute; left: 12px; top: 50%;
  transform: translateY(-50%); color: #94a3b8; font-size: 20px;
}
.input-wrap input {
  width: 100%; padding: 10px 12px 10px 42px;
  border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px;
  font-family: inherit; transition: all .2s;
}
.input-wrap input:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.1); }
.filter-group select {
  padding: 10px 14px; border: 1px solid #e2e8f0;
  border-radius: 10px; background: white; font-size: 14px; cursor: pointer; font-family: inherit;
}

/* ── Grid ── */
.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 22px;
}

/* ── Club Card ── */
.club-card {
  background: white; border-radius: 18px; overflow: hidden;
  border: 1px solid #eaecf2; box-shadow: 0 2px 10px rgba(0,0,0,.04);
  transition: all .3s cubic-bezier(.4,0,.2,1);
  animation: fadeSlideUp .5s ease both;
  animation-delay: var(--delay, 0ms);
}
.club-card:hover { transform: translateY(-6px); box-shadow: 0 16px 36px rgba(0,0,0,.09); }

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

.club-image { height: 190px; position: relative; overflow: hidden; }
.club-image img { width:100%; height:100%; object-fit:cover; transition: transform .5s; }
.club-card:hover .club-image img { transform: scale(1.08); }

.status-badge {
  position: absolute; top: 12px; right: 12px;
  padding: 5px 13px; border-radius: 999px;
  font-size: 11px; font-weight: 700; color: white;
}
.status-badge.APPROVED { background: rgba(22,163,74,.92); }
.status-badge.REJECTED { background: rgba(148,163,184,.92); }
.status-badge.PENDING  { background: rgba(245,158,11,.92); }

.club-details { padding: 20px; }
.club-main { margin-bottom: 16px; }
.club-name { font-size: 18px; font-weight: 700; margin: 0 0 3px; }
.club-meta { font-size: 13px; color: #475569; margin: 0 0 2px; }
.club-id   { font-size: 12px; color: #94a3b8; margin: 0; }

.info-row  { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; }
.info-icon { font-size: 17px; color: #94a3b8; flex-shrink: 0; margin-top: 1px; }
.info-text { font-size: 13px; color: #4b5563; line-height: 1.5; }

.club-stats {
  background: #f8fafc; border-radius: 12px; padding: 12px;
  display: flex; justify-content: space-around; margin: 16px 0;
}
.stat-item  { display: flex; flex-direction: column; align-items: center; }
.stat-num   { font-weight: 800; font-size: 18px; color: #1a1a2e; }
.stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }

.club-actions { display: flex; gap: 10px; align-items: center; }
.btn-action {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 12px; border-radius: 10px;
  font-size: 13px; font-weight: 600; text-decoration: none;
  transition: all .2s; cursor: pointer;
}
.btn-action.edit   { background: #f1f5f9; color: #334155; }
.btn-action.edit:hover { background: #e2e8f0; }
.btn-action.delete { background: #fef2f2; color: #dc2626; }
.btn-action.delete:hover { background: #fee2e2; }
.btn-action.manage { flex: 1; background: #f0fdf4; color: #16a34a; }
.btn-action.manage:hover { background: #dcfce7; }

/* ── Skeleton loading ── */
.skeleton-card { pointer-events: none; }
.skeleton-img  { height: 190px; background: #f1f5f9; animation: shimmer 1.4s infinite; }
.skeleton-line { background: #f1f5f9; border-radius: 6px; animation: shimmer 1.4s infinite; }

@keyframes shimmer {
  0%   { opacity: 1; }
  50%  { opacity: .5; }
  100% { opacity: 1; }
}

/* ── Empty state ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 0;
  background: white; border-radius: 18px; border: 2px dashed #e2e8f0;
}
.empty-icon {
  width: 76px; height: 76px; background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; margin-bottom: 20px;
}
.empty-icon span { font-size: 38px; color: #94a3b8; }
.mt-20 { margin-top: 20px; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .clubs-grid   { grid-template-columns: 1fr; }
  .view-header  { flex-direction: column; align-items: flex-start; gap: 14px; }
  .search-bar   { flex-direction: column; }
}
</style>