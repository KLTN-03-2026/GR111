<template>
  <div class="newsfeed-page">
    <!-- Header -->
    <header class="view-header">
      <div class="header-info">
        <h1 class="view-title">Bảng tin câu lạc bộ</h1>
        <p class="view-subtitle">Đăng thông báo, tìm kèo ghép hoặc cập nhật khung giờ trống để thu hút người chơi.</p>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <span class="material-icons">add_circle</span>
        <span>Đăng tin mới</span>
      </button>
    </header>

    <!-- Stats Summary -->
    <div v-if="selectedClubId" class="stats-row">
      <div class="stat-card blue">
        <div class="sc-icon"><span class="material-icons">rss_feed</span></div>
        <div class="sc-info">
          <span class="sc-label">Tổng bài đăng</span>
          <span class="sc-val">{{ posts.length }}</span>
        </div>
      </div>
      <div class="stat-card green">
        <div class="sc-icon"><span class="material-icons">visibility</span></div>
        <div class="sc-info">
          <span class="sc-label">Lượt tiếp cận</span>
          <span class="sc-val">1.2k+</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="search-bar-wrap">
      <div class="search-bar">
        <div class="f-item club-sel">
          <span class="material-icons f-icon">business</span>
          <select v-model="selectedClubId" @change="fetchPosts">
            <option value="" disabled>Chọn câu lạc bộ...</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">{{ club.name }}</option>
          </select>
        </div>
        <div class="f-item type-sel">
          <select v-model="typeFilter">
            <option value="all">Tất cả bài đăng</option>
            <option value="PROMOTION">🎁 Khuyến mãi (Voucher)</option>
            <option value="AVAILABLE_SLOT">🕒 Khung giờ trống</option>
            <option value="EVENT">🏆 Sự kiện</option>
            <option value="TEAM_MATCHING">🤝 Ghép kèo</option>
            <option value="DISCOUNT">🏷️ Giảm giá</option>
            <option value="ANNOUNCEMENT">📢 Thông báo</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!posts.length && !loading" class="empty-state card">
      <span class="material-icons">post_add</span>
      <h3>Chưa có bài đăng nào</h3>
      <p>Bắt đầu đăng tin để kết nối với người chơi trong khu vực của bạn.</p>
      <button class="btn-primary mt-16" @click="showAddModal = true">Đăng tin ngay</button>
    </div>

    <!-- Posts Grid -->
    <div v-else class="posts-grid">
      <div v-for="(post, i) in filteredPosts" :key="post.id" class="post-card card" :style="`--d:${i*80}ms`">
        <div class="post-header">
          <div :class="['post-type-badge', post.type]">
            <span class="material-icons">{{ getPostTypeIcon(post.type) }}</span>
            {{ getPostTypeLabel(post.type) }}
          </div>
          <button class="btn-more" @click="confirmDelete(post)">
            <span class="material-icons">delete_outline</span>
          </button>
        </div>

        <div class="post-body">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-content">{{ post.content.replace(/\[.*?\]/, '').trim() }}</p>
          
          <div v-if="post.imageUrl" class="post-image-container">
            <img :src="post.imageUrl" class="post-image" />
          </div>

          <div class="post-meta-tags">
            <div v-if="post.linkedCourtId" class="meta-tag blue">
              <span class="material-icons">layers</span>
              {{ post.courtName || 'Sân đã gắn' }}
            </div>
            <div v-if="post.linkedDate" class="meta-tag green">
              <span class="material-icons">event</span>
              {{ formatDate(post.linkedDate) }}
            </div>
          </div>
        </div>

        <div class="post-footer">
          <div class="post-info-row">
            <div class="info-item">
              <span class="material-icons">schedule</span>
              {{ timeAgo(post.createdAt) }}
            </div>
            <div class="info-item" v-if="post.viewCount > 0">
              <span class="material-icons">visibility</span>
              {{ post.viewCount }}
            </div>
          </div>
          <div v-if="post.expiresAt" class="post-expiry" :class="{ expiring: isExpiringSoon(post.expiresAt) }">
            {{ isExpiringSoon(post.expiresAt) ? 'Sắp hết hạn' : 'Hết hạn: ' + formatDate(post.expiresAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Add Post Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
        <div class="modal-content card slide-up">
          <div class="modal-header">
            <h3>Đăng bài thông báo mới</h3>
            <button class="btn-close" @click="showAddModal = false"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="field full">
                <label>Tiêu đề bài đăng <span class="req">*</span></label>
                <input v-model="form.title" placeholder="VD: Khung giờ vàng tối nay đang trống!" />
              </div>

              <div class="field">
                <label>Loại bài đăng</label>
                <select v-model="form.type">
                  <option value="AVAILABLE_SLOT">🕒 Khung giờ trống</option>
                  <option value="DISCOUNT">🏷️ Giảm giá</option>
                  <option value="EVENT">🏆 Sự kiện</option>
                  <option value="TEAM_MATCHING">🤝 Ghép kèo</option>
                  <option value="ANNOUNCEMENT">📢 Thông báo</option>
                </select>
              </div>

              <div class="field">
                <label>Hết hạn vào</label>
                <input type="datetime-local" v-model="form.expiresAt" />
              </div>

              <div class="field full">
                <label>Nội dung chi tiết <span class="req">*</span></label>
                <textarea v-model="form.content" rows="4" placeholder="Nhập nội dung bài đăng..."></textarea>
              </div>

              <div class="field full">
                <label>URL Hình ảnh (tùy chọn)</label>
                <input v-model="form.imageUrl" placeholder="Dán link ảnh tại đây..." />
              </div>

              <div class="field">
                <label>Gắn với sân (tùy chọn)</label>
                <select v-model="form.linkedCourtId">
                  <option :value="undefined">Không gắn sân</option>
                  <option v-for="court in currentClubCourts" :key="court.id" :value="court.id">{{ court.name }}</option>
                </select>
              </div>

              <div class="field" v-if="form.linkedCourtId">
                <label>Ngày áp dụng</label>
                <input type="date" v-model="form.linkedDate" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showAddModal = false">Hủy bỏ</button>
            <button class="btn-primary" @click="submitPost" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              {{ submitting ? 'Đang đăng...' : 'Đăng bài ngay' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { postService } from '@/services/post.service';
import { dashboardService } from '@/services/dashboard.service';

export default {
  name: 'OwnerNewsFeedView',
  data() {
    return {
      clubs: [],
      courts: [],
      posts: [],
      selectedClubId: '',
      typeFilter: 'all',
      loading: false,
      submitting: false,
      showAddModal: false,
      form: {
        type: 'AVAILABLE_SLOT',
        title: '',
        content: '',
        imageUrl: '',
        linkedCourtId: undefined,
        linkedDate: '',
        expiresAt: ''
      }
    };
  },
  computed: {
    filteredPosts() {
      if (this.typeFilter === 'all') return this.posts;
      return this.posts.filter(p => p.type === this.typeFilter);
    },
    currentClubCourts() {
      const club = this.clubs.find(c => c.id === this.selectedClubId);
      return club ? club.courts : [];
    }
  },
  async mounted() {
    await this.fetchClubs();
  },
  methods: {
    async fetchClubs() {
      try {
        const res = await dashboardService.getClubs();
        if (res.success && res.data.length > 0) {
          this.clubs = res.data;
          this.selectedClubId = res.data[0].id;
          await this.fetchPosts();
        }
      } catch (e) { console.error(e); }
    },
    async fetchPosts() {
      if (!this.selectedClubId) return;
      this.loading = true;
      try {
        const res = await postService.getOwnerPosts(this.selectedClubId);
        if (res.success) this.posts = res.data || [];
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async submitPost() {
      if (!this.form.title || !this.form.content) {
        alert("Vui lòng nhập tiêu đề và nội dung");
        return;
      }
      this.submitting = true;
      try {
        const payload = { ...this.form, clubId: this.selectedClubId };
        const res = await postService.createPost(payload);
        if (res.success) {
          this.showAddModal = false;
          this.resetForm();
          await this.fetchPosts();
        }
      } catch (e) {
        alert("Lỗi khi đăng bài");
      } finally {
        this.submitting = false;
      }
    },
    async confirmDelete(post) {
      if (confirm("Xóa bài đăng này?")) {
        try {
          await postService.deletePost(post.id);
          this.posts = this.posts.filter(p => p.id !== post.id);
        } catch (e) {
          alert("Lỗi khi xóa bài");
        }
      }
    },
    resetForm() {
      this.form = { type: 'AVAILABLE_SLOT', title: '', content: '', imageUrl: '', linkedCourtId: undefined, linkedDate: '', expiresAt: '' };
    },
    getPostTypeLabel(type) {
      const labels = { 
        DISCOUNT: 'Giảm giá', 
        AVAILABLE_SLOT: 'Khung giờ trống', 
        EVENT: 'Sự kiện', 
        TEAM_MATCHING: 'Ghép kèo',
        ANNOUNCEMENT: 'Thông báo',
        PROMOTION: 'Khuyến mãi'
      };
      return labels[type] || type;
    },
    getPostTypeIcon(type) {
      const icons = { 
        DISCOUNT: 'local_offer', 
        AVAILABLE_SLOT: 'schedule', 
        EVENT: 'emoji_events', 
        TEAM_MATCHING: 'groups',
        ANNOUNCEMENT: 'campaign',
        PROMOTION: 'redeem'
      };
      return icons[type] || 'article';
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    timeAgo(date) {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " năm trước";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " tháng trước";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " ngày trước";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " giờ trước";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " phút trước";
      return "Vừa xong";
    },
    isExpiringSoon(expiresAt) {
      const diff = new Date(expiresAt) - new Date();
      return diff > 0 && diff < 86400000; // Less than 24 hours
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&display=swap');

.newsfeed-page {
  font-family: 'Lexend', sans-serif;
  color: #1e293b;
  padding-bottom: 50px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.view-title { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
.view-subtitle { font-size: 15px; color: #64748b; margin: 0; }

.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
.stat-card { background: #fff; border-radius: 24px; padding: 20px; display: flex; align-items: center; gap: 16px; border: 1px solid #f1f5f9; box-shadow: 0 10px 40px rgba(0,0,0,0.04); }

.sc-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.blue .sc-icon { background: #eff6ff; color: #3b82f6; }
.green .sc-icon { background: #ecfdf5; color: #10b981; }

.sc-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; }
.sc-val { font-size: 24px; font-weight: 800; color: #0f172a; }

.search-bar-wrap { background: #fff; border-radius: 24px; padding: 8px; margin-bottom: 32px; border: 1px solid #f1f5f9; box-shadow: 0 10px 40px rgba(0,0,0,0.04); }
.search-bar { display: flex; gap: 8px; }
.f-item { height: 48px; background: #f8fafc; border-radius: 16px; display: flex; align-items: center; padding: 0 16px; gap: 10px; }
.club-sel { flex: 2; }
.type-sel { flex: 1; }
select { flex: 1; border: none; background: transparent; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; height: 100%; }

.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 24px; }
.post-card { 
  background: #fff; border-radius: 32px; border: 1px solid #f1f5f9; padding: 28px; 
  display: flex; flex-direction: column; transition: all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  animation: fadeInUp .6s ease both; animation-delay: var(--d);
  box-shadow: 0 10px 40px rgba(0,0,0,0.04);
}
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.post-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(0,0,0,0.08); border-color: #10b981; }

.post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.post-type-badge { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.post-type-badge.DISCOUNT { background: #fdf2f8; color: #db2777; }
.post-type-badge.AVAILABLE_SLOT { background: #ecfdf5; color: #059669; }
.post-type-badge.EVENT { background: #fffbeb; color: #b45309; }
.post-type-badge.TEAM_MATCHING { background: #f5f3ff; color: #6d28d9; }
.post-type-badge.ANNOUNCEMENT { background: #eff6ff; color: #1d4ed8; }
.post-type-badge .material-icons { font-size: 16px; }

.btn-more { width: 36px; height: 36px; border-radius: 12px; border: none; background: #f8fafc; color: #94a3b8; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
.btn-more:hover { background: #fef2f2; color: #ef4444; }

.post-title { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 12px; line-height: 1.4; }
.post-content { font-size: 14px; color: #64748b; line-height: 1.6; font-weight: 500; margin-bottom: 20px; }

.post-image-container { width: 100%; height: 200px; border-radius: 20px; overflow: hidden; margin-bottom: 20px; border: 1px solid #f1f5f9; }
.post-image { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.post-card:hover .post-image { transform: scale(1.05); }

.post-meta-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
.meta-tag { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; }
.meta-tag.blue { background: #eff6ff; color: #3b82f6; }
.meta-tag.green { background: #f0fdf4; color: #10b981; }
.meta-tag .material-icons { font-size: 16px; }

.post-footer { margin-top: auto; padding-top: 20px; border-top: 1px dashed #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.post-info-row { display: flex; gap: 15px; }
.info-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #94a3b8; font-weight: 700; }
.info-item .material-icons { font-size: 15px; }
.post-expiry { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; background: #f8fafc; padding: 4px 10px; border-radius: 6px; }
.post-expiry.expiring { color: #f59e0b; background: #fffbeb; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(15px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-content { width: 100%; max-width: 650px; background: #fff; border-radius: 32px; overflow: hidden; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 40px 100px rgba(0,0,0,0.2); }
.modal-header { padding: 32px 32px 20px; border: none; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
.btn-close { border: none; background: #f8fafc; width: 44px; height: 44px; border-radius: 14px; display: flex; justify-content: center; align-items: center; color: #64748b; cursor: pointer; }
.modal-body { padding: 10px 32px 32px; max-height: 70vh; overflow-y: auto; }
.modal-footer { padding: 24px 32px 32px; border: none; display: flex; justify-content: flex-end; gap: 15px; background: #fff; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.field { display: flex; flex-direction: column; gap: 10px; }
.field.full { grid-column: 1 / -1; }
.field label { font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
.field input, .field select, .field textarea { padding: 14px 18px; border: 2px solid #f1f5f9; border-radius: 16px; font-family: inherit; font-size: 14px; transition: 0.2s; background: #f8fafc; font-weight: 600; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: #10b981; outline: none; background: #fff; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }

.btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 0 28px; height: 52px; border-radius: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(16,185,129,0.2); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(16,185,129,0.3); }
.btn-secondary { background: #f8fafc; border: none; color: #64748b; padding: 0 24px; height: 52px; border-radius: 18px; font-weight: 800; cursor: pointer; transition: .2s; }
.btn-secondary:hover { background: #f1f5f9; color: #1e293b; }

.spinner-small { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.req { color: #f43f5e; }
.empty-state { text-align: center; padding: 80px 40px; }
.empty-state .material-icons { font-size: 64px; color: #e2e8f0; margin-bottom: 16px; }
.empty-state h3 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.empty-state p { font-size: 15px; color: #94a3b8; }
</style>
