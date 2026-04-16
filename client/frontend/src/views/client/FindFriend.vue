<template>
  <div class="community-page">
     <LoadingView v-if="loading" />
        <!-- ══ ANNOUNCEMENT BAR ══ -->
    <div v-if="showAnnouncement" class="announcement-bar" role="banner" aria-label="Thông báo mới">
      <p>
        🎉 Tính năng mới: Đặt lịch lặp lại & quản lý booking thông minh!
        <router-link to="/features" class="ann-link">Tìm hiểu thêm →</router-link>
      </p>
      <button class="ann-close" @click="showAnnouncement = false" aria-label="Đóng thông báo">×</button>
    </div>

    <!-- ══ HEADER ══ -->
    <header class="page-shell pt-24">
      <div class="page-header">
        <nav class="breadcrumb" aria-label="Điều hướng">
          <ol>
            <li><router-link to="/">Trang chủ</router-link></li>
            <li class="sep">›</li>
            <li>Cộng đồng</li>
          </ol>
        </nav>

        <div class="header-row">
          <div>
            <h1 class="page-title">
              <span class="title-main">CỘNG ĐỒNG</span>
              <span class="title-sub">Giao lưu & Kết nối đam mê</span>
            </h1>
            <p class="results-meta">
              {{ stats.activeMatch }} kèo đang mở • {{ stats.totalPlayers }} thành viên
            </p>
          </div>

          <div class="header-actions">
            <button class="btn-create" @click="showCreateModal = true">
              <span class="material-icons">add_circle</span>
              ĐĂNG BÀI MỚI
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="page-shell">
      <!-- ══ TABS ══ -->
      <div class="community-tabs">
        <button 
          v-for="tab in tabOptions" 
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="content-layout mt-6">
        <!-- ─ SIDEBAR (LEFT) ─ -->
        <aside class="sidebar-wrap">
          <div class="glass-sidebar">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input v-model="filters.keyword" type="text" placeholder="Tìm tên sân, khu vực..." />
            </div>

            <div class="filter-group">
              <h3 class="filter-title">Trình độ</h3>
              <div class="chip-grid">
                <button 
                  v-for="lv in levels" 
                  :key="lv.val" 
                  class="filter-chip"
                  :class="{ active: filters.level === lv.val }"
                  @click="filters.level = (filters.level === lv.val ? '' : lv.val)"
                >
                  {{ lv.label }}
                </button>
              </div>
            </div>

            <div class="filter-group">
              <h3 class="filter-title">Thời gian</h3>
              <input type="date" v-model="filters.date" class="date-input" />
            </div>

            <button class="btn-reset" @click="resetFilters">Làm mới bộ lọc</button>
          </div>
        </aside>

        <!-- ─ FEED (RIGHT) ─ -->
        <main class="feed-main">
          <!-- Loading -->
          <div v-if="loading" class="feed-grid">
            <div v-for="i in 4" :key="i" class="skeleton-card"></div>
          </div>

          <!-- Empty -->
          <div v-else-if="filteredFeed.length === 0" class="empty-feed">
            <div class="empty-icon">📂</div>
            <h3>Không có bài đăng nào</h3>
            <p>Thử thay đổi bộ lọc hoặc là người đầu tiên đăng bài nhé!</p>
            <button class="btn-primary-small mt-4" @click="showCreateModal = true">Đăng ngay</button>
          </div>

          <!-- Feed Grid -->
          <div v-else class="feed-grid">
            <div v-for="post in filteredFeed" :key="post.id">
              <!-- MATCH CARD -->
              <div v-if="post.type === 'TEAM_MATCHING'" class="match-card">
                <div class="card-header">
                  <div class="club-meta">
                    <img :src="post.club?.logoUrl || '/logo.png'" class="club-logo" />
                    <div>
                      <h4 class="club-name">{{ post.club?.name || 'Tự do' }}</h4>
                      <span class="location"><span class="material-icons">place</span> {{ post.club?.district || 'Toàn quốc' }}</span>
                    </div>
                  </div>
                  <span :class="['skill-tag', getSkillClass(post.content)]">
                    {{ getSkillLabel(post.content) }}
                  </span>
                </div>

                <div class="card-body">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <p class="post-excerpt">{{ post.content.replace(/\[.*?\]/g, '') }}</p>
                  
                  <div class="match-meta">
                    <div class="meta-item">
                      <span class="material-icons">event</span>
                      {{ formatDate(post.linkedDate) }}
                    </div>
                    <div class="meta-item">
                      <span class="material-icons">schedule</span>
                      {{ formatTime(post.linkedDate) }}
                    </div>
                  </div>
                </div>

                <div class="card-footer">
                  <span class="interest">🔥 {{ post.viewCount || 0 }} quan tâm</span>
                  <button class="btn-join" @click="joinMatch(post)">Tham gia ngay</button>
                </div>
              </div>

              <!-- REGULAR POST CARD -->
              <div v-else class="blog-card">
                <div class="blog-image">
                  <img :src="post.imageUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'" />
                  <span :class="['type-badge', post.type]">{{ getLabel(post.type) }}</span>
                </div>
                <div class="blog-content">
                  <h3 class="blog-title">{{ post.title }}</h3>
                  <p class="blog-excerpt">{{ post.content }}</p>
                  <div class="blog-footer">
                    <span class="club-mini">{{ post.club?.name }}</span>
                    <span class="date">{{ timeAgo(post.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- CREATE MATCH MODAL -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-content-premium">
          <div class="modal-header-p">
            <h2 class="fw-black m-0">Đăng kèo tìm đối thủ</h2>
            <button class="btn-close-p" @click="showCreateModal = false"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body-p">
             <div class="row g-3">
               <div class="col-12">
                 <label class="form-label-p">Tiêu đề kèo <span class="text-danger">*</span></label>
                 <input v-model="createForm.title" type="text" class="form-control-p" placeholder="VD: Tìm đối thủ sân 7 tối nay..." />
               </div>
               <div class="col-12">
                 <label class="form-label-p">Nội dung chi tiết <span class="text-danger">*</span></label>
                 <textarea v-model="createForm.content" class="form-control-p" rows="4" placeholder="Nhập chi tiết kèo, trình độ, ghi chú..."></textarea>
               </div>
               <div class="col-12">
                 <label class="form-label-p">Tại sân bóng (Tùy chọn)</label>
                 <div class="club-select-grid">
                   <div 
                     v-for="club in userClubs" 
                     :key="club.id" 
                     :class="['club-option', { active: createForm.clubId === club.id }]"
                     @click="createForm.clubId = (createForm.clubId === club.id ? '' : club.id)"
                   >
                     <img :src="club.image || 'https://api.dicebear.com/7.x/initials/svg?seed=' + club.name" />
                     <span>{{ club.name }}</span>
                   </div>
                   <div v-if="userClubs.length === 0" class="small text-muted p-3 border rounded-3 bg-light">
                     Bạn chưa có câu lạc bộ nào để gắn thẻ. Kèo sẽ được đăng công khai.
                   </div>
                 </div>
               </div>
               <div class="col-md-6">
                 <label class="form-label-p">Ngày đá <span class="text-danger">*</span></label>
                 <input v-model="createForm.linkedDate" type="date" class="form-control-p" />
               </div>
               <div class="col-md-6">
                 <label class="form-label-p">Trình độ kỹ năng</label>
                 <select v-model="createForm.skillSelection" class="form-control-p">
                   <option value="BEGINNER">Giao lưu (Beginner)</option>
                   <option value="INTERMEDIATE">Trung bình (Intermediate)</option>
                   <option value="PRO">Bắt kèo căng (Pro)</option>
                 </select>
               </div>
             </div>
          </div>
          <div class="modal-footer-p">
            <button class="btn btn-light rounded-pill px-4 fw-bold" @click="showCreateModal = false">Đóng</button>
            <button 
              class="btn btn-success rounded-pill px-4 fw-bold shadow-sm" 
              @click="handleCreatePost"
              :disabled="saving"
            >
              {{ saving ? 'Đang đăng...' : 'Phát hành ngay' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- JOIN CONFIRMATION -->
    <Teleport to="body">
       <div v-if="joiningActive" class="modal-overlay" @click.self="joiningActive = null">
         <div class="modal-content-premium text-center py-5">
           <div class="join-success-animation">✔️</div>
           <h2 class="fw-black mt-3">Đã gửi yêu cầu tham gia!</h2>
           <p class="text-muted px-5">Chúng tôi đã thông báo tới đội trưởng. Vui lòng giữ liên lạc nhé!</p>
           <button class="btn btn-success rounded-pill px-5 fw-bold mt-3 shadow-sm" @click="joiningActive = null">Tuyệt vời!</button>
         </div>
       </div>
    </Teleport>
  </div>
</template>

<script>
import { postService } from '@/services/post.service';
import { clubService } from '@/services/club.service';
import { toast } from 'vue3-toastify';

export default {
  name: 'FindFriend',
  data() {
    return {
      allFeed: [],
      userClubs: [],
      loading: true,
      saving: false,
      showCreateModal: false,
      showAnnouncement: true,
      joiningActive: null,
      activeTab: 'all',
      filters: {
        keyword: '',
        level: '',
        date: ''
      },
      tabOptions: [
        { value: 'all', label: 'Tất cả' },
        { value: 'TEAM_MATCHING', label: 'Ghép kèo' },
        { value: 'DISCOUNT', label: 'Khuyến mãi' },
        { value: 'EVENT', label: 'Sự kiện' }
      ],
      createForm: {
        title: '',
        content: '',
        clubId: '',
        linkedDate: new Date().toISOString().split('T')[0],
        skillSelection: 'BEGINNER'
      },
      levels: [
        { val: 'BEGINNER', label: 'Giao lưu' },
        { val: 'INTERMEDIATE', label: 'Trung bình' },
        { val: 'PRO', label: 'Chuyên nghiệp (Pro)' }
      ],
      stats: {
        activeMatch: 0,
        totalPlayers: 1580
      }
    };
  },
  computed: {
    filteredFeed() {
      let list = [...this.allFeed];
      
      // Tab filter
      if (this.activeTab !== 'all') {
        list = list.filter(item => item.type === this.activeTab);
      }

      // Keyword filter
      if (this.filters.keyword) {
        const k = this.filters.keyword.toLowerCase();
        list = list.filter(m => 
          (m.title || '').toLowerCase().includes(k) || 
          (m.club?.name || '').toLowerCase().includes(k) || 
          (m.club?.city || '').toLowerCase().includes(k) || 
          (m.content || '').toLowerCase().includes(k)
        );
      }

      // Skill level filter
      if (this.filters.level) {
        list = list.filter(m => (m.content || '').toUpperCase().includes(this.filters.level));
      }

      // Date filter
      if (this.filters.date) {
        list = list.filter(m => m.linkedDate?.startsWith(this.filters.date));
      }

      return list;
    }
  },
  async mounted() {
    await this.fetchMatches();
    await this.fetchUserClubs();
  },
  methods: {
    async fetchMatches() {
      this.loading = true;
      try {
        const res = await postService.getPublicFeed();
        this.allFeed = res.data || [];
        this.stats.activeMatch = this.allFeed.filter(p => p.type === 'TEAM_MATCHING').length;
      } catch (e) {
        toast.error("Không thể tải bảng tin");
      } finally {
        this.loading = false;
      }
    },
    async fetchUserClubs() {
      try {
        const res = await clubService.Getallthedetails();
        this.userClubs = res.data?.data || [];
      } catch (e) { console.error(e); }
    },

    async handleCreatePost() {
      if (!this.createForm.title || !this.createForm.content) {
        toast.warning("Vui lòng điền đủ tiêu đề và nội dung");
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Vui lòng đăng nhập để đăng bài");
        return;
      }

      this.saving = true;
      try {
        const contentWithSkill = `[${this.createForm.skillSelection}] ${this.createForm.content}`;
        await postService.createPost({
          title: this.createForm.title,
          content: contentWithSkill,
          clubId: this.createForm.clubId || undefined,
          type: 'TEAM_MATCHING',
          linkedDate: this.createForm.linkedDate ? new Date(this.createForm.linkedDate).toISOString() : undefined
        });

        toast.success("Kèo đã được đăng thành công!");
        this.showCreateModal = false;
        this.createForm = { title: '', content: '', clubId: '', linkedDate: new Date().toISOString().split('T')[0], skillSelection: 'BEGINNER' };
        await this.fetchMatches();
      } catch (e) {
        toast.error(e.response?.data?.message || "Lỗi khi đăng bài");
      } finally {
        this.saving = false;
      }
    },
    
    getLabel(type) {
      const labels = {
        DISCOUNT: 'Khuyến mãi',
        EVENT: 'Sự kiện',
        TEAM_MATCHING: 'Ghép kèo',
        PROMOTION: 'Ưu đãi'
      };
      return labels[type] || type;
    },

    timeAgo(date) {
      if (!date) return "";
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      let interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " ngày trước";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " giờ trước";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " phút trước";
      return "Vừa xong";
    },

    getSkillClass(content) {
      if (!content) return 'skill-easy';
      const c = content.toUpperCase();
      if (c.includes('PRO') || c.includes('CĂNG')) return 'skill-pro';
      if (c.includes('INTERMEDIATE') || c.includes('TRUNG BÌNH')) return 'skill-mod';
      return 'skill-easy';
    },
    
    getSkillLabel(content) {
      if (!content) return 'Giao lưu';
      const c = content.toUpperCase();
      if (c.includes('PRO') || c.includes('CĂNG')) return 'Bắt kèo căng';
      if (c.includes('INTERMEDIATE') || c.includes('TRUNG BÌNH')) return 'Trung bình';
      return 'Giao lưu / Nhẹ nhàng';
    },

    formatDate(d) {
      if (!d) return 'Hôm nay';
      return new Date(d).toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    },

    formatTime(d) {
      if (!d) return '';
      return new Date(d).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    joinMatch(post) {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.info("Vui lòng đăng nhập để tham gia");
        return;
      }
      this.joiningActive = post;
    },

    resetFilters() {
      this.filters = { keyword: '', level: '', date: '' };
    }
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800;900&display=swap");

.community-page {
  --green:       rgb(22, 163, 74);
  --green-dark:  rgb(15, 118, 54);
  --green-light: rgba(22, 163, 74, 0.12);
  --text:        #111827;
  --muted:       #6b7280;
  --border:      #e5e7eb;
  --bg:          #f4f5f7;
  --card:        #ffffff;
  --radius:      12px;

  font-family: "Barlow", sans-serif;
  background: var(--bg);
  min-height: 100vh;
  color: var(--text);
}

/* ══ Announcement bar ══ */
.announcement-bar {
  background: #0c4a6e;
  color: #fff;
  text-align: center;
  padding: 9px 48px;
  font-size: 13px;
  font-weight: 500;
  position: relative;
  line-height: 1.5;
  z-index: 100;
}
.ann-link { color: #7dd3fc; font-weight: 700; text-decoration: none; margin-left: 6px; }
.ann-link:hover { text-decoration: underline; }
.ann-close {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: rgba(255,255,255,.7);
  font-size: 18px; cursor: pointer; line-height: 1; padding: 2px 6px;
  display: flex; align-items: center; justify-content: center;
}
.ann-close:hover { color: #fff; }

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}
.pt-24 { padding-top: 24px; }
.mt-6 { margin-top: 24px; }

.breadcrumb ol {
  display: flex; align-items: center; gap: 6px;
  list-style: none; margin: 0 0 14px; padding: 0;
  font-size: 12px; color: var(--muted);
}
.breadcrumb a { color: var(--muted); text-decoration: none; }
.breadcrumb a:hover { color: var(--green-dark); }
.sep { color: var(--border); }

.header-row {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 16px;
  flex-wrap: wrap; margin-bottom: 30px;
}

.page-title {
  font-family: "Barlow Condensed", sans-serif;
  line-height: 1.1;
  margin: 0;
}
.title-main { display: block; font-size: 2.8rem; font-weight: 900; color: var(--text); }
.title-sub { display: block; font-size: 1rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }
.results-meta { font-size: 14px; color: var(--muted); margin-top: 8px; }

.btn-create {
  display: flex; align-items: center; gap: 8px;
  background: var(--green); color: #fff;
  border: none; border-radius: 10px; padding: 12px 24px;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 800; font-size: 14px; letter-spacing: 0.05em;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}
.btn-create:hover { background: var(--green-dark); transform: translateY(-2px); }

.community-tabs {
  display: flex; gap: 12px;
  border-bottom: 1.5px solid var(--border);
  margin-bottom: 24px;
}
.tab-btn {
  background: none; border: none; padding: 12px 20px;
  font-weight: 700; font-size: 14px; color: var(--muted);
  cursor: pointer; position: relative;
  transition: color 0.2s;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--green); }
.tab-btn.active::after {
  content: ""; position: absolute; bottom: -1.5px; left: 0; right: 0;
  height: 3px; background: var(--green);
}

.content-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
}

.sidebar-wrap {
  position: sticky;
  top: 100px;
}

.glass-sidebar {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius); padding: 24px;
}

.search-box {
  display: flex; align-items: center; gap: 10px;
  background: #f3f4f6; border-radius: 10px; padding: 10px 14px;
  margin-bottom: 24px;
}
.search-box input { background: none; border: none; outline: none; flex: 1; font-size: 14px; }
.search-box .material-icons { color: var(--muted); font-size: 20px; }

.filter-title {
  font-size: 12px; font-weight: 800; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.chip-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.filter-chip {
  background: #fff; border: 1.5px solid var(--border);
  padding: 6px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 600; color: var(--muted);
  cursor: pointer; transition: all 0.2s;
}
.filter-chip:hover { border-color: var(--green); color: var(--green); }
.filter-chip.active { background: var(--green); border-color: var(--green); color: #fff; }

.date-input {
  width: 100%; padding: 10px; border: 1.5px solid var(--border);
  border-radius: 10px; font-family: inherit; font-size: 14px;
  margin-bottom: 24px; outline: none;
}
.date-input:focus { border-color: var(--green); }

.btn-reset {
  width: 100%; background: none; border: 1.5px solid var(--border);
  padding: 10px; border-radius: 10px; font-weight: 700; font-size: 13px;
  color: var(--muted); cursor: pointer; transition: all 0.2s;
}
.btn-reset:hover { border-color: var(--green); color: var(--green); background: #f0fdf4; }

.feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.empty-feed {
  text-align: center; padding: 60px 20px;
  background: #fff; border: 1.5px dashed var(--border);
  border-radius: var(--radius);
}
.empty-icon { font-size: 48px; margin-bottom: 16px; }

.match-card {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
  display: flex; flex-direction: column; height: 100%;
  transition: all 0.3s ease;
}
.match-card:hover { border-color: var(--green); transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }

.card-header { padding: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
.club-meta { display: flex; align-items: center; gap: 12px; }
.club-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
.club-name { font-size: 15px; font-weight: 800; margin: 0; }
.location { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 4px; }

.skill-tag { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
.skill-pro { background: #fee2e2; color: #ef4444; }
.skill-mod { background: #fef3c7; color: #d97706; }
.skill-easy { background: #dcfce7; color: #16a34a; }

.card-body { padding: 0 20px 20px; flex: 1; }
.post-title { font-size: 18px; font-weight: 800; margin-bottom: 8px; line-height: 1.3; }
.post-excerpt { font-size: 14px; color: var(--muted); line-height: 1.5; margin-bottom: 16px; min-height: 42px; }

.match-meta { display: flex; gap: 16px; }
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #4b5563; }
.meta-item .material-icons { font-size: 16px; color: var(--green); }

.card-footer {
  padding: 16px 20px; border-top: 1px dashed var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.interest { font-size: 13px; font-weight: 700; color: var(--muted); }
.btn-join {
  background: var(--text); color: #fff; border: none;
  padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; transition: background 0.2s;
}
.btn-join:hover { background: var(--green); }

.blog-card {
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: var(--radius); overflow: hidden;
  display: flex; flex-direction: column; height: 100%;
}
.blog-image { position: relative; aspect-ratio: 16/9; overflow: hidden; }
.blog-image img { width: 100%; height: 100%; object-fit: cover; }
.type-badge {
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px; font-size: 10px; font-weight: 800;
  color: #fff; background: rgba(15,23,42,0.8);
  backdrop-filter: blur(4px); text-transform: uppercase;
}
.blog-content { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.blog-title { font-size: 16px; font-weight: 800; margin-bottom: 8px; }
.blog-excerpt { font-size: 13px; color: var(--muted); flex: 1; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.blog-footer { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #9ca3af; }

/* Modals */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px); z-index: 9999;
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.modal-content-premium {
  background: #fff; border-radius: 20px; width: 100%; max-width: 550px;
  overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.2);
}
.modal-header-p { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.modal-header-p h2 { font-family: "Barlow Condensed", sans-serif; font-size: 1.5rem; font-weight: 800; margin: 0; }
.btn-close-p { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted); display: flex; }

.modal-body-p { padding: 24px; max-height: 70vh; overflow-y: auto; }
.form-label-p { display: block; font-size: 12px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 8px; }
.form-control-p {
  width: 100%; padding: 12px; border: 1.5px solid var(--border);
  border-radius: 10px; font-family: inherit; font-size: 14px; outline: none; margin-bottom: 16px;
}
.form-control-p:focus { border-color: var(--green); }

.club-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }
.club-option {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 12px; border: 1.5px solid var(--border); border-radius: 12px;
  cursor: pointer; transition: all 0.2s;
}
.club-option:hover { border-color: var(--green); background: var(--green-light); }
.club-option.active { border-color: var(--green); background: var(--green-light); box-shadow: 0 0 0 2px var(--green); }
.club-option img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.club-option span { font-size: 11px; font-weight: 700; text-align: center; }

.modal-footer-p { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; background: #f9fafb; border-top: 1px solid var(--border); }

.join-success-animation { font-size: 48px; color: var(--green); margin-bottom: 16px; }

@media (max-width: 1024px) {
  .content-layout { grid-template-columns: 1fr; }
  .sidebar-wrap { position: static; }
}

@media (max-width: 640px) {
  .feed-grid { grid-template-columns: 1fr; }
  .page-title .title-main { font-size: 2rem; }
  .header-actions { width: 100%; }
  .btn-create { width: 100%; justify-content: center; }
}
</style>