<template>
  <div class="profile-page">
    <div v-if="!user && loadingInitial" class="initial-loader">
      <div class="spinner-grow text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else class="container py-5">
      <div class="row g-4">
        <!-- SIDEBAR -->
        <div class="col-lg-4">
          <div class="glass-card p-4 text-center sticky-sidebar">
            <div class="avatar-wrapper mx-auto mb-4" @click="triggerAvatar">
              <img :src="user?.avatarUrl || defaultAvatar" class="profile-avatar" />
              <div class="avatar-overlay">
                <span class="material-icons">photo_camera</span>
              </div>
              <input type="file" ref="avatarInput" class="d-none" @change="handleAvatarChange" accept="image/*" />
            </div>
            <h3 class="fw-black mb-1">{{ user?.fullName }}</h3>
            <p class="text-muted small mb-4">{{ user?.email }}</p>
            
            <div class="profile-nav">
              <button 
                v-for="item in navItems" 
                :key="item.id" 
                :class="['nav-item-p', { active: activeTab === item.id }]"
                @click="activeTab = item.id"
              >
                <span class="material-icons">{{ item.icon }}</span>
                {{ item.label }}
              </button>
            </div>

            <hr class="my-4 opacity-10">
            <button class="btn-logout" @click="handleLogout">
              <span class="material-icons">logout</span> Đăng xuất
            </button>
          </div>
        </div>

        <!-- MAIN CONTENT -->
        <div class="col-lg-8">
          <div class="glass-card p-4 p-md-5">
            <!-- TAB: THÔNG TIN CÁ NHÂN -->
            <div v-if="activeTab === 'personal'">
              <h4 class="fw-black mb-4">Thông tin cá nhân</h4>
              <form @submit.prevent="updateProfile">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label-p">Họ và tên</label>
                    <input v-model="form.fullName" type="text" class="form-control-p" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-p">Số điện thoại</label>
                    <input v-model="form.phone" type="tel" class="form-control-p" />
                  </div>
                  <div class="col-12">
                    <label class="form-label-p">Địa chỉ</label>
                    <input v-model="form.address" type="text" class="form-control-p" placeholder="Số nhà, đường, phường/xã..." />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-p">Ngày sinh</label>
                    <input v-model="form.dateOfBirth" type="date" class="form-control-p" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label-p">Giới tính</label>
                    <select v-model="form.gender" class="form-control-p">
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label-p">Giới thiệu bản thân (Bio)</label>
                    <textarea v-model="form.bio" class="form-control-p" rows="3" placeholder="Sở thích, trình độ bóng đá..."></textarea>
                  </div>
                </div>
                <div class="mt-4 text-end">
                  <button type="submit" class="btn btn-success rounded-pill px-5 fw-bold" :disabled="saving">
                    {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- TAB: BẢO MẬT -->
            <div v-if="activeTab === 'security'">
              <h4 class="fw-black mb-4">Bảo mật tài khoản</h4>
              <form @submit.prevent="changePassword">
                <div class="mb-3">
                  <label class="form-label-p">Mật khẩu hiện tại</label>
                  <input v-model="pwForm.oldPassword" type="password" class="form-control-p" required />
                </div>
                <div class="mb-3">
                  <label class="form-label-p">Mật khẩu mới</label>
                  <input v-model="pwForm.newPassword" type="password" class="form-control-p" required />
                </div>
                <div class="mb-4">
                  <label class="form-label-p">Xác nhận mật khẩu mới</label>
                  <input v-model="pwForm.confirmPassword" type="password" class="form-control-p" required />
                </div>
                <button type="submit" class="btn btn-dark rounded-pill px-5 fw-bold" :disabled="saving">
                  Cập nhật mật khẩu
                </button>
              </form>
            </div>

            <!-- TAB: CỘNG ĐỒNG (ĐĂNG BÀI) -->
            <div v-if="activeTab === 'community'">
               <div class="d-flex justify-content-between align-items-center mb-4">
                 <h4 class="fw-black m-0">Bài đăng cộng đồng</h4>
                 <button class="btn btn-success rounded-pill px-4 fw-bold shadow-sm" @click="showMatchModal = true">
                   <span class="material-icons small me-1">add</span> Tạo kèo mới
                 </button>
               </div>

               <div v-if="loadingPosts" class="text-center py-5">
                 <div class="spinner-border text-success"></div>
               </div>

               <div v-else-if="userPosts.length === 0" class="empty-posts text-center py-5">
                 <div class="empty-icon">📣</div>
                 <h5>Bạn chưa có bài đăng nào</h5>
                 <p class="text-muted small">Hãy đăng kèo để tìm đồng đội và đối thủ ngay!</p>
               </div>

               <div v-else class="post-list">
                 <div v-for="post in userPosts" :key="post.id" class="user-post-card">
                   <div class="post-header">
                     <span class="post-type-tag">Ghép kèo</span>
                     <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                   </div>
                   <h5 class="post-title">{{ post.title }}</h5>
                   <p class="post-excerpt">{{ post.content }}</p>
                   <div class="post-actions">
                     <button class="btn-post-action text-danger" @click="handleDeletePost(post.id)">
                       <span class="material-icons">delete_outline</span> Xóa
                     </button>
                   </div>
                 </div>
               </div>
            </div>

            <!-- TAB: SÂN YÊU THÍCH -->
            <div v-if="activeTab === 'favorites'">
              <h4 class="fw-black mb-4">Sân bóng đã lưu</h4>
              <div v-if="loadingFavorites" class="text-center py-5">
                 <div class="spinner-border text-success"></div>
              </div>
              <div v-else-if="favoriteVenues.length === 0" class="empty-posts text-center py-5">
                 <div class="empty-icon text-danger">❤️</div>
                 <h5>Danh sách yêu thích trống</h5>
                 <p class="text-muted small">Hãy thả tim các sân bóng bạn yêu thích để xem lại tại đây!</p>
                 <router-link to="/booking" class="btn btn-outline-success rounded-pill px-4 btn-sm fw-bold mt-2">Khám phá sân ngay</router-link>
              </div>
              <div v-else class="row g-4">
                  <div v-for="club in mappedFavorites" :key="club.id" class="col-12">
                    <VenueCard :venue="club" @favorite="handleFavoriteEvent" />
                  </div>
              </div>
            </div>

            <!-- TAB: THÔNG BÁO -->
            <div v-if="activeTab === 'notifications'">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-black m-0">Thông báo của bạn</h4>
                <button v-if="notifications.length > 0" class="btn btn-link text-success fw-bold text-decoration-none btn-sm" @click="handleMarkAllRead">
                  Đánh dấu tất cả đã đọc
                </button>
              </div>

              <div v-if="loadingNotifications" class="text-center py-5">
                 <div class="spinner-border text-success"></div>
              </div>

              <div v-else-if="notifications.length === 0" class="empty-posts text-center py-5">
                 <div class="empty-icon text-muted">🔕</div>
                 <h5>Không có thông báo nào</h5>
                 <p class="text-muted small">Chúng tôi sẽ thông báo cho bạn khi có cập nhật mới về đặt sân hoặc cộng đồng.</p>
              </div>

              <div v-else class="notification-list">
                 <div v-for="noti in notifications" :key="noti.id" :class="['noti-item', { unread: !noti.isRead }]">
                    <div class="noti-icon" :class="noti.type.toLowerCase()">
                       <span class="material-icons">{{ getNotiIcon(noti.type) }}</span>
                    </div>
                    <div class="noti-content" @click="handleMarkRead(noti)">
                       <div class="noti-header">
                          <h6 class="noti-title">{{ noti.title }}</h6>
                          <span class="noti-time">{{ formatTimeAgo(noti.createdAt) }}</span>
                       </div>
                       <p class="noti-body">{{ noti.body }}</p>
                    </div>
                    <button class="btn-delete-noti" @click="handleDeleteNoti(noti.id)">
                       <span class="material-icons">close</span>
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
      <div v-if="showMatchModal" class="modal-overlay" @click.self="showMatchModal = false">
        <div class="modal-content-premium">
          <div class="modal-header-p">
            <h2 class="fw-black m-0">Tạo kèo giao lưu</h2>
            <button class="btn-close-p" @click="showMatchModal = false"><span class="material-icons">close</span></button>
          </div>
          <div class="modal-body-p">
            <div class="mb-3">
              <label class="form-label-p">Tiêu đề kèo</label>
              <input v-model="matchForm.title" type="text" class="form-control-p" placeholder="VD: Tìm đối thủ sân 7 tối nay..." />
            </div>
            <div class="mb-3">
              <label class="form-label-p">Chi tiết (Địa điểm, rank, ghi chú...)</label>
              <textarea v-model="matchForm.content" class="form-control-p" rows="4" placeholder="Nhập chi tiết kèo đá của bạn..."></textarea>
            </div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label-p">Chọn CLB (Nếu có)</label>
                <select v-model="matchForm.clubId" class="form-control-p">
                   <option value="">Cộng đồng chung</option>
                   <option v-for="club in userClubs" :key="club.id" :value="club.id">{{ club.name }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label-p">Ngày đá</label>
                <input v-model="matchForm.linkedDate" type="date" class="form-control-p" />
              </div>
            </div>
          </div>
          <div class="modal-footer-p">
            <button class="btn btn-light rounded-pill px-4" @click="showMatchModal = false">Hủy</button>
            <button class="btn btn-success rounded-pill px-5 shadow-sm fw-bold" @click="handleCreateMatch" :disabled="saving">
              Đăng kèo <span class="material-icons">send</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { postService } from '@/services/post.service';
import { clubService } from '@/services/club.service';
import { notificationService } from '@/services/notification.service';
import { toast } from 'vue3-toastify';
import VenueCard from '@/components/client/booking/VenueCard.vue';

export default {
  name: 'ProfileView',
  components: {
    VenueCard
  },
  data() {
    return {
      user: null,
      loadingInitial: true,
      activeTab: 'personal',
      saving: false,
      loadingPosts: false,
      loadingFavorites: false,
      loadingNotifications: false,
      showMatchModal: false,
      userPosts: [],
      favoriteVenues: [],
      notifications: [],
      userClubs: [],
      defaultAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
      navItems: [
        { id: 'personal', label: 'Thông tin cá nhân', icon: 'person_outline' },
        { id: 'notifications', label: 'Thông báo của tôi', icon: 'notifications_none' },
        { id: 'favorites', label: 'Sân bóng đã lưu', icon: 'favorite_border' },
        { id: 'community', label: 'Bài đăng của tôi', icon: 'campaign' },
        { id: 'security', label: 'Bảo mật', icon: 'shield' },
      ],
      form: {
        fullName: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: 'MALE',
        bio: ''
      },
      pwForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      matchForm: {
        title: '',
        content: '',
        clubId: '',
        type: 'TEAM_MATCHING',
        linkedDate: ''
      }
    };
  },
  computed: {
    mappedFavorites() {
      return (this.favoriteVenues || []).map(club => ({
        ...club,
        image: club.logoUrl || (club.images && club.images[0]?.url) || '/img/default-club.png',
        isFavorited: true // Because they are in the favorites list
      }));
    }
  },
  async mounted() {
    const token = localStorage.getItem("token");
    if (!token) {
      this.$router.push("/auth/login");
      return;
    }
    this.loadingInitial = true;
    try {
      await this.fetchProfile();
      await this.fetchUserClubs();
    } finally {
      this.loadingInitial = false;
    }
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'community') this.fetchUserPosts();
      if (newTab === 'favorites') this.fetchFavorites();
      if (newTab === 'notifications') this.fetchNotifications();
    }
  },
  methods: {
    async fetchProfile() {
      try {
        const res = await userService.getProfile();
        this.user = res.data.data;
        
        // Sync form with profile data
        this.form = {
          fullName: this.user.fullName || '',
          phone: this.user.phone || '',
          address: this.user.profile?.address || '',
          dateOfBirth: this.user.profile?.dateOfBirth ? this.user.profile.dateOfBirth.split('T')[0] : '',
          gender: this.user.profile?.gender || 'MALE',
          bio: this.user.profile?.bio || ''
        };
      } catch (e) {
        toast.error("Không thể tải thông tin cá nhân");
        console.error(e);
      }
    },
    async fetchUserClubs() {
       try {
         // Use searchVenues instead of non-existent getAllClubs
         const res = await clubService.searchVenues({});
         this.userClubs = res.data?.data || [];
       } catch (e) { 
         console.error("Lỗi khi tải danh sách CLB:", e); 
       }
    },
    async updateProfile() {
      this.saving = true;
      try {
        const payload = { ...this.form };
        // Backend yêu cầu ISO 8601 datetime cho dateOfBirth
        if (payload.dateOfBirth) {
          payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
        } else {
          payload.dateOfBirth = "";
        }
        
        await userService.updateProfile(payload);
        toast.success("Cập nhật thông tin thành công!");
        await this.fetchProfile();
      } catch (e) {
        toast.error(e.response?.data?.message || "Lỗi khi cập nhật thông tin");
      } finally {
        this.saving = false;
      }
    },
    async changePassword() {
      if (this.pwForm.newPassword !== this.pwForm.confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }
      this.saving = true;
      try {
        await userService.changePassword({
          currentPassword: this.pwForm.oldPassword,
          newPassword: this.pwForm.newPassword
        });
        toast.success("Đã đổi mật khẩu thành công!");
        this.pwForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
      } catch (e) {
        toast.error(e.response?.data?.message || "Lỗi khi đổi mật khẩu");
      } finally {
        this.saving = false;
      }
    },
    triggerAvatar() {
      this.$refs.avatarInput.click();
    },
    async handleAvatarChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'user-avatar');
      try {
        await userService.updateAvatar(formData);
        toast.success("Đã cập nhật ảnh đại diện!");
        await this.fetchProfile();
      } catch (e) {
        toast.error("Lỗi khi tải ảnh lên");
      }
    },
    async fetchUserPosts() {
      if (!this.user?.id) return;
      this.loadingPosts = true;
      try {
        // Fetch public feed and filter by current user
        const res = await postService.getPublicFeed();
        const allPosts = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        // Filter articles created by the current user
        this.userPosts = allPosts.filter(post => 
          post.authorId === this.user.id || 
          (post.author && post.author.id === this.user.id)
        );
      } catch (e) {
        console.error("Lỗi tải bài đăng:", e);
        toast.error("Không thể tải danh sách bài đăng");
      } finally {
        this.loadingPosts = false;
      }
    },
    async fetchFavorites() {
       this.loadingFavorites = true;
       try {
         const res = await clubService.getFavorites();
         // Backend returns { clubs: [], courts: [] }
         this.favoriteVenues = res.data?.data?.clubs || [];
       } catch (e) {
         toast.error("Lỗi khi tải danh sách yêu thích");
       } finally {
         this.loadingFavorites = false;
       }
    },
    handleFavoriteEvent({ favorited }) {
        if (!favorited) {
           this.fetchFavorites(); // Refresh list if something was unfavorited
        }
    },

    // NOTIFICATIONS
    async fetchNotifications() {
      this.loadingNotifications = true;
      try {
        const res = await notificationService.getMyNotifications();
        this.notifications = res.data || [];
      } catch (e) {
        toast.error("Lỗi khi tải thông báo");
      } finally {
        this.loadingNotifications = false;
      }
    },
    async handleMarkRead(noti) {
      if (noti.isRead) return;
      try {
        await notificationService.markAsRead(noti.id);
        noti.isRead = true;
        // Update local counter or state if needed
      } catch (e) { 
        console.error("Error marking as read:", e);
      }
    },
    async handleMarkAllRead() {
      try {
        await notificationService.markAsRead();
        this.notifications.forEach(n => n.isRead = true);
        toast.success("Đã đánh dấu tất cả là đã đọc");
      } catch (e) { toast.error("Lỗi thực hiện"); }
    },
    async handleDeleteNoti(id) {
      try {
        await notificationService.deleteNotification(id);
        this.notifications = this.notifications.filter(n => n.id !== id);
      } catch (e) { toast.error("Lỗi khi xóa thông báo"); }
    },
    getNotiIcon(type) {
      switch (type) {
        case 'BOOKING': return 'event_available';
        case 'PAYMENT': return 'payments';
        case 'MATCH': return 'sports_soccer';
        default: return 'notifications';
      }
    },
    formatTimeAgo(date) {
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
    async handleCreateMatch() {
       if (!this.matchForm.title || !this.matchForm.content) {
         toast.warning("Vui lòng nhập đủ thông tin kèo");
         return;
       }
       this.saving = true;
       try {
         // Create post via owner endpoint if they are allowed, or common user endpoint
         const res = await postService.createPost({
           ...this.matchForm,
           clubId: this.matchForm.clubId || this.userClubs[0]?.id // Default to one club for visibility
         });
         if (res.success) {
           toast.success("Kèo của bạn đã được đăng!");
           this.showMatchModal = false;
           await this.fetchUserPosts();
         }
       } catch (e) {
         toast.error("Lỗi khi đăng bài. Bạn cần quyền đặc biệt để đăng lên bảng tin.");
       } finally {
         this.saving = false;
       }
    },
    async handleDeletePost(id) {
       if (!confirm("Bạn có chắc muốn xóa bài đăng này?")) return;
       try {
         await postService.deletePost(id);
         toast.success("Đã xóa bài đăng");
         await this.fetchUserPosts();
       } catch (e) {
         toast.error("Không thể xóa bài");
       }
    },
    handleLogout() {
      localStorage.clear();
      window.location.href = '/auth/login';
    },
    formatDate(d) {
       return new Date(d).toLocaleDateString('vi-VN');
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&display=swap');

.profile-page {
  font-family: 'Lexend', sans-serif;
  background: #f8fafc;
  min-height: 100vh;
  color: #0f172a;
}

.glass-card {
  background: white;
  border-radius: 30px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.03);
  border: 1px solid #edf2f7;
}

.sticky-sidebar { position: sticky; top: 100px; }

/* AVATAR */
.avatar-wrapper {
  width: 150px; height: 150px;
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  border: 5px solid white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.profile-avatar { width: 100%; height: 100%; object-fit: cover; }
.avatar-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  color: white; opacity: 0; transition: .3s;
}
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }

/* NAV */
.profile-nav { display: flex; flex-direction: column; gap: 8px; text-align: left; margin-top: 20px; }
.nav-item-p {
  background: transparent; border: none; padding: 14px 20px;
  border-radius: 15px; font-weight: 700; color: #64748b;
  display: flex; align-items: center; gap: 12px; transition: .2s;
}
.nav-item-p .material-icons { font-size: 20px; }
.nav-item-p:hover { background: #f1f5f9; color: #1e293b; }
.nav-item-p.active { background: #dcfce7; color: #059669; }

.btn-logout {
  background: #fff1f2; color: #ef4444; border: none; width: 100%;
  padding: 12px; border-radius: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

/* FORM */
.form-label-p { font-weight: 800; font-size: 13px; color: #64748b; margin-bottom: 8px; display: block; }
.form-control-p {
  background: #f8fafc; border: 1.5px solid #edf2f7; padding: 12px 18px;
  border-radius: 15px; font-weight: 600; width: 100%; transition: .2s;
}
.form-control-p:focus { border-color: #059669; outline: none; background: white; box-shadow: 0 0 0 4px rgba(5,150,105,0.1); }

/* POSTS */
.user-post-card {
  background: #f8fafc; border-radius: 20px; border: 1px solid #edf2f7;
  padding: 24px; margin-bottom: 16px; transition: .2s;
}
.user-post-card:hover { transform: scale(1.01); border-color: #059669; }

/* FAVORITES */
.size-14 { font-size: 14px !important; }

/* NOTIFICATIONS */
.noti-item {
  display: flex; gap: 15px; padding: 20px; border-radius: 20px;
  background: #f8fafc; border: 1.5px solid #edf2f7;
  margin-bottom: 12px; transition: .2s; position: relative;
}
.noti-item.unread { background: white; border-color: #dcfce7; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
.noti-item.unread::before {
  content: ''; position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  width: 6px; height: 6px; background: #059669; border-radius: 50%;
}
.noti-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; color: #64748b; flex-shrink: 0;
}
.noti-icon.booking { background: #dcfce7; color: #059669; }
.noti-icon.payment { background: #fef3c7; color: #d97706; }
.noti-icon.match { background: #fee2e2; color: #ef4444; }

.noti-content { flex: 1; cursor: pointer; }
.noti-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.noti-title { font-weight: 800; font-size: 14px; margin: 0; }
.noti-time { font-size: 11px; color: #94a3b8; font-weight: 600; }
.noti-body { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }
.btn-delete-noti {
  background: none; border: none; color: #94a3b8; padding: 0;
  display: flex; align-items: center; justify-content: center; transition: .2s;
}
.btn-delete-noti:hover { color: #ef4444; }

.post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.post-type-tag { font-size: 10px; font-weight: 900; background: #dcfce7; color: #059669; padding: 4px 10px; border-radius: 20px; }
.post-date { font-size: 11px; font-weight: 600; color: #94a3b8; }
.post-title { font-weight: 900; font-size: 1.1rem; margin-bottom: 8px; }
.post-excerpt { font-size: 13px; color: #64748b; line-height: 1.6; }
.post-actions { margin-top: 15px; display: flex; justify-content: flex-end; }
.btn-post-action { background: none; border: none; font-weight: 700; font-size: 12px; display: flex; align-items: center; gap: 4px; }

/* MODAL */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-content-premium {
  background: white; border-radius: 40px; width: 100%; max-width: 600px; box-shadow: 0 30px 60px rgba(0,0,0,0.1);
  overflow: hidden;
}
.modal-header-p { padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; }
.btn-close-p { border: none; background: #f1f5f9; width: 40px; height: 40px; border-radius: 12px; display: flex; justify-content: center; align-items: center; }
.modal-body-p { padding: 0 40px 30px; }
.modal-footer-p { padding: 20px 40px 40px; display: flex; gap: 15px; justify-content: flex-end; }

.empty-icon { font-size: 48px; margin-bottom: 15px; }

.initial-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

@media (max-width: 991px) {
  .sticky-sidebar { position: relative; top: 0; margin-bottom: 20px; }
}
</style>
