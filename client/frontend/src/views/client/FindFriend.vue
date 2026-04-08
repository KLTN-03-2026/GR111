<template>
  <div class="community-page">
    <!-- HERO SECTION -->
    <div class="community-hero">
      <div class="container text-center py-5">
        <h1 class="hero-title">Cộng đồng Ghép kèo</h1>
        <p class="hero-subtitle">Tìm đối thủ xứng tầm, kết nối đam mê thể thao tại khu vực của bạn.</p>
        
        <div class="search-box-premium mx-auto mt-4">
          <div class="search-input-group">
            <span class="material-icons search-icon">location_on</span>
            <input 
              v-model="filters.keyword" 
              type="text" 
              placeholder="Tìm theo khu vực hoặc tên sân..." 
            />
          </div>
          <button class="btn-create-match d-none d-md-flex" @click="showCreateModal = true">
            <span class="material-icons">add_circle</span>
            Đăng kèo mới
          </button>
        </div>
      </div>
    </div>

    <div class="container mt-n5 position-relative">
      <div class="row g-4">
        <!-- SIDEBAR FILTERS -->
        <div class="col-lg-3">
          <div class="glass-card p-4 sticky-sidebar">
            <h5 class="fw-black mb-4 d-flex align-items-center">
              <span class="material-icons me-2 text-success">tune</span>
              Bộ lọc nâng cao
            </h5>
            
            <div class="filter-group mb-4">
              <label class="filter-label">Trình độ kỹ năng</label>
              <div class="skill-tags">
                <button 
                  v-for="lv in levels" 
                  :key="lv.val" 
                  :class="['skill-tag', { active: filters.level === lv.val }]"
                  @click="filters.level = (filters.level === lv.val ? '' : lv.val)"
                >
                  {{ lv.label }}
                </button>
              </div>
            </div>

            <div class="filter-group mb-4">
              <label class="filter-label">Thời gian</label>
              <input type="date" v-model="filters.date" class="form-control-premium" />
            </div>

            <button class="btn-reset-filters w-100" @click="resetFilters">
              Đặt lại bộ lọc
            </button>

            <div class="community-stats mt-5">
              <div class="stat-item text-center">
                <span class="stat-val d-block">{{ stats.activeMatch }}</span>
                <span class="stat-lab">Kèo đang mở</span>
              </div>
              <hr class="my-3 opacity-10">
              <div class="stat-item text-center">
                <span class="stat-val d-block">{{ stats.totalPlayers }}</span>
                <span class="stat-lab">Thành viên mới</span>
              </div>
            </div>
          </div>
        </div>

        <!-- MATCH LIST -->
        <div class="col-lg-9">
          <!-- LOADING STATE -->
          <div v-if="loading" class="row g-4">
            <div v-for="i in 4" :key="i" class="col-md-6">
              <div class="match-card-skeleton"></div>
            </div>
          </div>

          <!-- EMPTY STATE -->
          <div v-else-if="filteredMatches.length === 0" class="empty-matches text-center py-5">
            <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-search-not-found-illustration-download-in-svg-png-gif-file-formats--no-results-result-digital-marketing-pack-business-illustrations-4421453.png" class="empty-img mb-4" />
            <h3 class="fw-black">Không tìm thấy kèo phù hợp</h3>
            <p class="text-muted">Bạn có muốn là người đầu tiên tạo kèo tại khu vực này?</p>
            <button class="btn btn-success rounded-pill px-4 fw-bold mt-2" @click="showCreateModal = true">Đăng kèo ngay</button>
          </div>

          <!-- ACTUAL LIST -->
          <div v-else class="row g-4 mb-5">
            <div v-for="match in filteredMatches" :key="match.id" class="col-md-6">
              <div class="match-item-card">
                <div class="match-type-badge" :style="{ backgroundColor: getSkillColor(match.content) }">
                  Ghép kèo
                </div>
                
                <div class="card-p-header">
                  <div class="club-info">
                    <img :src="match.club?.logoUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=' + match.club?.name" class="club-logo-mini" />
                    <div class="club-text">
                      <h4 class="club-name">{{ match.club?.name }}</h4>
                      <div class="match-location"><span class="material-icons">location_on</span> {{ match.club?.city }}</div>
                    </div>
                  </div>
                  <div :class="['skill-badge', getSkillClass(match.content)]">
                    {{ getSkillLabel(match.content) }}
                  </div>
                </div>

                <div class="card-p-body">
                  <p class="match-desc">{{ match.content }}</p>
                  <div class="match-details-grid">
                    <div class="detail-item">
                      <span class="material-icons">calendar_month</span>
                      {{ formatDate(match.linkedDate) }}
                    </div>
                    <div class="detail-item">
                      <span class="material-icons">groups</span>
                      {{ match.viewCount }} lượt quan tâm
                    </div>
                  </div>
                </div>

                <div class="card-p-footer">
                  <div class="p-time">
                    <span class="material-icons">schedule</span>
                    {{ formatTime(match.linkedDate) }}
                  </div>
                  <button class="btn-join-match" @click="joinMatch(match)">
                    Tham gia <span class="material-icons">bolt</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  name: 'MatchFindingView',
  data() {
    return {
      allMatches: [],
      userClubs: [],
      loading: true,
      saving: false,
      showCreateModal: false,
      joiningActive: null,
      filters: {
        keyword: '',
        level: '',
        date: ''
      },
      createForm: {
        title: '',
        content: '',
        clubId: '',
        linkedDate: new Date().toISOString().split('T')[0],
        skillSelection: 'BEGINNER'
      },
      levels: [
        { val: 'BEGINNER', label: 'Mơi chơi / Giao lưu' },
        { val: 'INTERMEDIATE', label: 'Trung bình' },
        { val: 'PRO', label: 'Bắt kèo căng' }
      ],
      stats: {
        activeMatch: 0,
        totalPlayers: 1240
      }
    };
  },
  computed: {
    filteredMatches() {
      let list = [...this.allMatches];
      if (this.filters.keyword) {
        const k = this.filters.keyword.toLowerCase();
        list = list.filter(m => 
          (m.club?.name || '').toLowerCase().includes(k) || 
          (m.club?.city || '').toLowerCase().includes(k) || 
          (m.content || '').toLowerCase().includes(k)
        );
      }
      if (this.filters.level) {
        list = list.filter(m => (m.content || '').toUpperCase().includes(this.filters.level));
      }
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
        const res = await postService.getPublicFeed({ type: 'TEAM_MATCHING' });
        this.allMatches = res.data || [];
        this.stats.activeMatch = this.allMatches.length;
      } catch (e) {
        toast.error("Không thể tải danh sách kèo");
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
        // Tag skill level into content for styling logic
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
        // Reset form
        this.createForm = { title: '', content: '', clubId: '', linkedDate: new Date().toISOString().split('T')[0], skillSelection: 'BEGINNER' };
        await this.fetchMatches();
      } catch (e) {
        toast.error(e.response?.data?.message || "Lỗi khi đăng bài");
      } finally {
        this.saving = false;
      }
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

    getSkillColor(content) {
      if (!content) return '#22c55e';
      const c = content.toUpperCase();
      if (c.includes('PRO') || c.includes('CĂNG')) return '#ef4444';
      if (c.includes('INTERMEDIATE') || c.includes('TRUNG BÌNH')) return '#f59e0b';
      return '#22c55e';
    },

    formatDate(d) {
      if (!d) return 'Hôm nay';
      return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
    },
    
    formatTime(d) {
      if(!d) return 'Hàng ngày';
      return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    },

    resetFilters() {
      this.filters = { keyword: '', level: '', date: '' };
    },

    joinMatch(match) {
      this.joiningActive = match;
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&display=swap');

.community-page {
  font-family: 'Lexend', sans-serif;
  background: #f8fafc;
  min-height: 100vh;
  color: #0f172a;
}

.community-hero {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding-bottom: 80px;
  color: white;
}
.hero-title { font-weight: 900; font-size: 3rem; margin-bottom: 1rem; }
.hero-subtitle { opacity: 0.9; font-weight: 500; font-size: 1.1rem; max-width: 600px; margin: 0 auto; }

.search-box-premium {
  background: white;
  padding: 8px;
  border-radius: 60px;
  display: flex;
  max-width: 700px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  transition: .3s;
}
.search-input-group { flex: 1; display: flex; align-items: center; padding-left: 20px; }
.search-icon { color: #64748b; margin-right: 12px; }
.search-input-group input { border: none; outline: none; width: 100%; height: 100%; font-weight: 600; color: #1e293b; }

.btn-create-match {
  background: #10b981; color: white; border: none; padding: 12px 24px;
  border-radius: 40px; font-weight: 800; display: flex; align-items: center; gap: 8px;
}

.mt-n5 { margin-top: -50px; }
.glass-card {
  background: white;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}
.sticky-sidebar { position: sticky; top: 100px; }

.filter-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; display: block; }
.skill-tags { display: flex; flex-direction: column; gap: 8px; }
.skill-tag {
  background: #f1f5f9; border: 1.5px solid transparent; padding: 10px 16px;
  border-radius: 12px; font-size: 13px; font-weight: 700; color: #64748b;
  text-align: left; transition: .2s;
}
.skill-tag.active { background: #dcfce7; color: #10b981; border-color: #10b981; }

.form-control-premium {
  background: #f1f5f9; border: none; padding: 12px 16px; border-radius: 12px;
  font-weight: 700; color: #1e293b; width: 100%;
}
.btn-reset-filters {
  background: #fff1f2; color: #ef4444; border: none; padding: 12px;
  border-radius: 15px; font-weight: 800; font-size: 13px;
}

.stat-val { font-weight: 900; font-size: 24px; color: #059669; }
.stat-lab { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

.match-item-card {
  background: white; border-radius: 30px; border: 1px solid #edf2f7;
  overflow: hidden; transition: .3s; position: relative; height: 100%; display: flex; flex-direction: column;
}
.match-item-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: #10b981; }

.match-type-badge {
  position: absolute; top: 0; right: 0; padding: 6px 20px;
  border-bottom-left-radius: 20px; color: white; font-weight: 900; font-size: 11px;
}

.card-p-header { padding: 30px 24px 15px; display: flex; justify-content: space-between; align-items: flex-start; }
.club-info { display: flex; align-items: center; gap: 15px; }
.club-logo-mini { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; border: 2px solid white; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.club-name { font-weight: 900; font-size: 1.1rem; margin: 0; }
.match-location { font-size: 11px; font-weight: 700; color: #94a3b8; display: flex; align-items: center; gap: 4px; }

.skill-badge { font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
.skill-pro { background: #fee2e2; color: #ef4444; }
.skill-mod { background: #fef3c7; color: #d97706; }
.skill-easy { background: #dcfce7; color: #10b981; }

.card-p-body { padding: 0 24px 20px; flex: 1; }
.match-desc { color: #64748b; font-size: 13px; line-height: 1.6; font-weight: 500; margin-bottom: 20px; }
.match-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.detail-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #475569; }

.card-p-footer {
  padding: 15px 24px 24px; border-top: 1px dashed #edf2f7;
  display: flex; justify-content: space-between; align-items: center;
}
.p-time { display: flex; align-items: center; gap: 6px; font-weight: 900; color: #0f172a; font-size: 14px; }

.btn-join-match {
  background: #1e293b; color: white; border: none; padding: 8px 20px;
  border-radius: 50px; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px;
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-content-premium {
  background: white; border-radius: 40px; width: 100%; max-width: 550px; box-shadow: 0 30px 60px rgba(0,0,0,0.1);
  overflow: hidden;
}
.modal-header-p { padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; }
.btn-close-p { border: none; background: #f1f5f9; width: 40px; height: 40px; border-radius: 12px; display: flex; justify-content: center; align-items: center; }
.modal-body-p { padding: 0 40px 30px; }
.form-label-p { font-weight: 900; font-size: 13px; color: #64748b; margin-bottom: 8px; display: block; }
.form-control-p { background: #f1f5f9; border: 2px solid transparent; padding: 12px 18px; border-radius: 15px; font-weight: 700; width: 100%; }
.modal-footer-p { padding: 24px 40px 40px; display: flex; gap: 15px; justify-content: flex-end; }

.match-card-skeleton {
  height: 250px; background: #f1f5f9; border-radius: 30px; animation: pulse 1.5s infinite;
}
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

.join-success-animation { font-size: 64px; }
.empty-img { max-width: 200px; }

.club-select-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px;
  max-height: 150px; overflow-y: auto; padding: 5px;
}
.club-option {
  background: #f8fafc; border: 2.5px solid transparent; border-radius: 12px; padding: 10px;
  display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: .2s;
}
.club-option img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
.club-option span { font-size: 11px; font-weight: 700; text-align: center; }
.club-option.active { border-color: #10b981; background: #dcfce7; }

@media (max-width: 768px) {
  .hero-title { font-size: 2rem; }
  .search-box-premium { border-radius: 20px; }
}
</style>