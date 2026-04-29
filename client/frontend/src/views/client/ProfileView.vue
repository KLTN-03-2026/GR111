<template>
  <div class="profile-page">
    <div v-if="!user && loadingInitial" class="initial-loader">
      <div class="spinner-grow text-emerald" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <div v-else class="container py-xl-5 py-4">
      <div class="row g-4">
        <!-- ── SIDEBAR / NAVIGATION ── -->
        <div class="col-lg-4 col-xl-3">
          <aside class="profile-sidebar sticky-sidebar">
            <div class="profile-card text-center overflow-hidden">
              <div class="profile-card__banner"></div>
              <div class="profile-card__content">
                <div class="avatar-wrapper mx-auto" @click="triggerAvatar">
                  <img :src="user?.avatarUrl || defaultAvatar" class="profile-avatar" :alt="user?.fullName" />
                  <div class="avatar-overlay">
                    <span class="material-icons">photo_camera</span>
                  </div>
                  <input type="file" ref="avatarInput" class="d-none" @change="handleAvatarChange" accept="image/*" />
                </div>
                
                <div class="mt-3 px-3">
                  <h3 class="profile-name">{{ user?.fullName }}</h3>
                  <div class="profile-email">
                     <span class="material-icons size-14">email</span>
                     {{ user?.email }}
                  </div>
                </div>

                <div class="profile-stats mt-4">
                  <div class="stat-item">
                    <span class="stat-value">{{ userPosts.length }}</span>
                    <span class="stat-label">Bài đăng</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-item">
                    <span class="stat-value">{{ favoriteVenues.length }}</span>
                    <span class="stat-label">Đã lưu</span>
                  </div>
                </div>
                
                <nav class="profile-nav mt-4">
                  <button 
                    v-for="item in navItems" 
                    :key="item.id" 
                    :class="['nav-item-btn', { active: activeTab === item.id }]"
                    @click="activeTab = item.id"
                  >
                    <div class="nav-item-icon" :class="item.id">
                      <span class="material-icons">{{ item.icon }}</span>
                    </div>
                    <span class="nav-item-label">{{ item.label }}</span>
                    <div v-if="item.id === 'notifications' && unreadCount > 0" class="nav-badge">{{ unreadCount }}</div>
                  </button>
                </nav>

                <div class="mt-4 pt-2 mb-2 px-3">
                  <button class="btn-logout" @click="handleLogout">
                    <span class="material-icons">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <!-- ── MAIN CONTENT AREA ── -->
        <main class="col-lg-8 col-xl-9">
          <div class="content-card">
            
            <!-- ── TAB: PERSONAL INFORMATION ── -->
            <transition name="fade-slide" mode="out-in">
              <div v-if="activeTab === 'personal'" key="personal" class="tab-pane">
                <header class="tab-header">
                  <div class="tab-header__icon personal">
                    <span class="material-icons">person</span>
                  </div>
                  <div class="tab-header__text">
                    <h1 class="tab-title">Thông tin cá nhân</h1>
                    <p class="tab-subtitle">Cập nhật thông tin của bạn để có trải nghiệm tốt hơn</p>
                  </div>
                </header>

                <form @submit.prevent="updateProfile" class="mt-4">
                  <div class="row g-4">
                    <div class="col-md-6">
                      <div class="form-group-p">
                        <label class="form-label-p">Họ và tên</label>
                        <input v-model="form.fullName" type="text" class="form-control-p" placeholder="Nguyễn Văn A" required />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-group-p">
                        <label class="form-label-p">Số điện thoại</label>
                        <input v-model="form.phone" type="tel" class="form-control-p" placeholder="0123 456 789" />
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="form-group-p">
                        <label class="form-label-p">Địa chỉ hiện tại</label>
                        <textarea v-model="form.address" class="form-control-p" rows="2" placeholder="Số nhà, tên đường, Phường/Xã..."></textarea>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-group-p">
                        <label class="form-label-p">Ngày sinh nhật</label>
                        <div class="input-with-icon">
                          <input v-model="form.dateOfBirth" type="date" class="form-control-p" />
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-group-p">
                        <label class="form-label-p">Giới tính</label>
                        <div class="select-wrapper-p">
                          <select v-model="form.gender" class="form-control-p">
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="form-group-p">
                        <label class="form-label-p">Tiểu sử & Giới thiệu</label>
                        <textarea v-model="form.bio" class="form-control-p" rows="4" placeholder="Chia sẻ về sở thích, trình độ chơi thể thao của bạn..."></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mt-5 pt-3 d-flex justify-content-end border-top-dashed">
                    <button type="submit" class="btn-premium btn-premium--emerald" :disabled="saving">
                      <span v-if="!saving" class="d-flex align-items-center gap-2">
                        <span class="material-icons">save</span> Lưu cập nhật
                      </span>
                      <span v-else class="d-flex align-items-center gap-2">
                        <div class="spinner-tiny"></div> Đang xử lý...
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- ── TAB: NOTIFICATIONS ── -->
              <div v-else-if="activeTab === 'notifications'" key="notifications" class="tab-pane">
                <header class="tab-header mb-4">
                  <div class="tab-header__icon notifications">
                    <span class="material-icons">notifications</span>
                  </div>
                  <div class="tab-header__text">
                    <h1 class="tab-title">Thông báo của tôi</h1>
                    <p class="tab-subtitle">Theo dõi các hoạt động đặt sân và cộng đồng</p>
                  </div>
                  <button 
                    v-if="notifications.length > 0" 
                    class="btn-text-emerald ms-auto" 
                    @click="handleMarkAllRead"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                </header>

                <div v-if="loadingNotifications" class="loading-state py-5">
                  <div class="spinner-border text-emerald"></div>
                </div>

                <div v-else-if="notifications.length === 0" class="empty-state py-5">
                  <div class="empty-state__icon">🔕</div>
                  <h3 class="empty-state__title">Hộp thư trống</h3>
                  <p class="empty-state__text">Bạn chưa có thông báo nào vào lúc này.</p>
                </div>

                <div v-else class="notification-feed">
                  <div v-for="noti in notifications" :key="noti.id" :class="['noti-card', { unread: !noti.isRead }]">
                    <div class="noti-card__icon" :class="noti.type.toLowerCase()">
                      <span class="material-icons">{{ getNotiIcon(noti.type) }}</span>
                    </div>
                    <div class="noti-card__body" @click="handleMarkRead(noti)">
                      <div class="noti-card__header">
                        <h4 class="noti-card__title">{{ noti.title }}</h4>
                        <span class="noti-card__time">{{ formatTimeAgo(noti.createdAt) }}</span>
                      </div>
                      <p class="noti-card__text">{{ noti.body }}</p>
                    </div>
                    <button class="noti-card__delete" @click="handleDeleteNoti(noti.id)" title="Xóa thông báo">
                      <span class="material-icons">close</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- ── TAB: FAVORITES ── -->
              <div v-else-if="activeTab === 'favorites'" key="favorites" class="tab-pane">
                <header class="tab-header mb-4">
                  <div class="tab-header__icon favorites">
                    <span class="material-icons">favorite</span>
                  </div>
                  <div class="tab-header__text">
                    <h1 class="tab-title">Sân bóng đã lưu</h1>
                    <p class="tab-subtitle">Danh sách các địa điểm bạn quan tâm và yêu thích</p>
                  </div>
                </header>

                <div v-if="loadingFavorites" class="loading-state py-5">
                  <div class="spinner-border text-emerald"></div>
                </div>

                <div v-else-if="favoriteVenues.length === 0" class="empty-state py-5">
                  <h3 class="empty-state__title">Chưa có sân yêu thích</h3>
                  <p class="empty-state__text">Hãy lưu lại các sân bóng bạn thích để tìm lại nhanh hơn nhé!</p>
                  <router-link to="/booking" class="btn-premium btn-premium--outline-emerald mt-3">
                    Khám phá sân bóng
                  </router-link>
                </div>

                <div v-else class="row g-4">
                  <div v-for="club in mappedFavorites" :key="club.id" class="col-12 col-md-6 col-xl-12">
                    <div class="favorite-venue-wrapper">
                      <VenueCard :venue="club" @favorite="handleFavoriteEvent" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── TAB: COMMUNITY POSTS ── -->
              <div v-else-if="activeTab === 'community'" key="community" class="tab-pane">
                <header class="tab-header mb-4">
                  <div class="tab-header__icon community">
                    <span class="material-icons">campaign</span>
                  </div>
                  <div class="tab-header__text">
                    <h1 class="tab-title">Bài đăng cộng đồng</h1>
                    <p class="tab-subtitle">Quản lý các bài đăng tìm đối, ghép kèo của bạn</p>
                  </div>
                  <button class="btn-premium btn-premium--emerald shadow-emerald ms-auto" @click="showMatchModal = true">
                    <span class="material-icons">add</span> 
                    <span class="d-none d-sm-inline ms-1">Tạo kèo mới</span>
                  </button>
                </header>

                <div v-if="loadingPosts" class="loading-state py-5">
                  <div class="spinner-border text-emerald"></div>
                </div>

                <div v-else-if="userPosts.length === 0" class="empty-state py-5">
                  <h3 class="empty-state__title">Chưa có bài đăng nào</h3>
                  <p class="empty-state__text">Hãy tạo kèo để giao lưu cùng cộng đồng thể thao nhé.</p>
                </div>

                <div v-else class="posts-grid">
                  <article v-for="post in userPosts" :key="post.id" class="premium-post-card">
                    <header class="post-card__header">
                      <div class="post-card__tag">GHÉP KÈO</div>
                      <time class="post-card__date">{{ formatDate(post.createdAt) }}</time>
                    </header>
                    <h3 class="post-card__title">{{ post.title }}</h3>
                    <p class="post-card__content">{{ post.content }}</p>
                    <footer class="post-card__footer">
                      <button class="post-card__btn-delete" @click="handleDeletePost(post.id)">
                        <span class="material-icons size-18">delete</span> 
                        <span>Gỡ bài</span>
                      </button>
                    </footer>
                  </article>
                </div>
              </div>

              <!-- ── TAB: SECURITY ── -->
              <div v-else-if="activeTab === 'security'" key="security" class="tab-pane">
                <header class="tab-header mb-4">
                  <div class="tab-header__icon security">
                    <span class="material-icons">security</span>
                  </div>
                  <div class="tab-header__text">
                    <h1 class="tab-title">Bảo mật tài khoản</h1>
                    <p class="tab-subtitle">Quản lý mật khẩu và các thiết lập an toàn</p>
                  </div>
                </header>

                <div class="security-card p-4 p-md-5">
                  <form @submit.prevent="changePassword">
                    <div class="mb-4">
                      <div class="form-group-p">
                        <label class="form-label-p">Mật khẩu hiện tại</label>
                        <input v-model="pwForm.oldPassword" type="password" class="form-control-p" placeholder="••••••••" required />
                      </div>
                    </div>
                    <div class="row g-4 mb-4">
                      <div class="col-md-6">
                        <div class="form-group-p">
                          <label class="form-label-p">Mật khẩu mới</label>
                          <input v-model="pwForm.newPassword" type="password" class="form-control-p" placeholder="••••••••" required />
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="form-group-p">
                          <label class="form-label-p">Xác nhận mật khẩu mới</label>
                          <input v-model="pwForm.confirmPassword" type="password" class="form-control-p" placeholder="••••••••" required />
                        </div>
                      </div>
                    </div>
                    <div class="d-flex justify-content-end">
                      <button type="submit" class="btn-premium btn-premium--dark" :disabled="saving">
                        <span class="material-icons">lock_reset</span> &nbsp; Cập nhật mật khẩu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </transition>
          </div>
        </main>
      </div>
    </div>

    <!-- ── CREATE MATCH MODAL ── -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showMatchModal" class="modal-overlay-p" @click.self="showMatchModal = false">
          <div class="modal-card-p">
            <header class="modal-card__header-p">
              <div class="d-flex align-items-center gap-3">
                <div class="modal-icon-p"><span class="material-icons text-emerald">campaign</span></div>
                <h2 class="modal-title-p">Đăng tin giao lưu</h2>
              </div>
              <button class="modal-close-btn-p" @click="showMatchModal = false">
                <span class="material-icons">close</span>
              </button>
            </header>
            
            <div class="modal-card__body-p">
              <div class="mb-4">
                <label class="form-label-p">Tiêu đề bài viết</label>
                <input v-model="matchForm.title" type="text" class="form-control-p" placeholder="Tìm đối sân 7 tối mai tại CLB ABC..." />
              </div>
              <div class="mb-4">
                <label class="form-label-p">Nội dung chi tiết</label>
                <textarea v-model="matchForm.content" class="form-control-p" rows="4" placeholder="Mô tả kỹ năng, phí chia sẻ, địa điểm cụ thể..."></textarea>
              </div>
              <div class="row g-4">
                <div class="col-md-6">
                  <label class="form-label-p">Chọn CLB (Tuỳ chọn)</label>
                  <div class="select-wrapper-p">
                    <select v-model="matchForm.clubId" class="form-control-p">
                       <option value="">Đăng cộng đồng chung</option>
                       <option v-for="club in userClubs" :key="club.id" :value="club.id">{{ club.name }}</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label-p">Ngày thi đấu</label>
                  <input v-model="matchForm.linkedDate" type="date" class="form-control-p" />
                </div>
              </div>
            </div>
            
            <footer class="modal-card__footer-p">
              <button class="btn-premium btn-premium--light" @click="showMatchModal = false">Đóng</button>
              <button class="btn-premium btn-premium--emerald shadow-emerald" @click="handleCreateMatch" :disabled="saving">
                <span class="material-icons">send</span> &nbsp; Đăng ngay
              </button>
            </footer>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>


<script>
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { postService, unwrapPostListPayload } from '@/services/post.service';
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
    unreadCount() {
      return this.notifications.filter(n => !n.isRead).length;
    },
    mappedFavorites() {
      return (this.favoriteVenues || []).map(club => {
        // Calculate min price and extract court info
        let minPrice = null;
        let surface = null;
        let format = null;
        let sportType = null;
        let sportTypes = [];
        const courtCount = club.courts?.length || 0;

        if (club.courts && courtCount > 0) {
          const firstCourt = club.courts[0];
          sportTypes = [...new Set(club.courts.map(c => c.sportType))];
          surface = firstCourt.surface;
          format = firstCourt.indoorOutdoor === 'INDOOR' ? 'Trong nhà' : (firstCourt.indoorOutdoor === 'OUTDOOR' ? 'Ngoài trời' : firstCourt.indoorOutdoor);
          sportType = firstCourt.sportType;

          const allPricings = club.courts.flatMap(c => c.pricings || []);
          if (allPricings.length > 0) {
            minPrice = Math.min(...allPricings.map(p => Number(p.pricePerHour)));
          }
        }

        // Extract hours
        let openTime = null;
        let closeTime = null;
        if (club.openingHours && club.openingHours.length > 0) {
          const h = club.openingHours[0];
          const formatTime = (t) => {
            const date = new Date(t);
            return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
          }
          openTime = formatTime(h.openTime);
          closeTime = formatTime(h.closeTime);
        }

        // Map amenities to simple booleans for VenueCard
        const amenityKeys = (club.amenities || []).map(a => a.amenity?.name?.toLowerCase() || '');
        const hasWifi = amenityKeys.some(k => k.includes('wifi'));
        const hasShower = amenityKeys.some(k => k.includes('tắm') || k.includes('shower'));
        const hasParking = amenityKeys.some(k => k.includes('đỗ xe') || k.includes('parking'));

        return {
          ...club,
          image: club.logoUrl || (club.images && club.images[0]?.url) || '/img/default-club.png',
          isFavorited: true,
          minPrice: minPrice,
          openTime: openTime,
          closeTime: closeTime,
          isPartner: true,
          hasOnlineBooking: courtCount > 0,
          sportType: sportType,
          sportTypes: sportTypes,
          surface: surface,
          format: format,
          courtCount: courtCount,
          wifi: hasWifi,
          shower: hasShower,
          freeParking: hasParking,
          rating: club.rating || (4.0 + Math.random()), // Fallback
          reviewCount: club.reviewCount || Math.floor(Math.random() * 20)
        };
      });
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
        const res = await postService.getPublicFeed({ limit: 100, page: 1 });
        const allPosts = unwrapPostListPayload(res.data);
        
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
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');

.profile-page {
  font-family: 'Lexend', sans-serif;
  background-color: #f8fafc;
  min-height: 100vh;
  color: #0f172a;
}

/* ── HELPERS ── */
.text-emerald { color: #10b981 !important; }
.size-14 { font-size: 14px !important; }
.size-18 { font-size: 18px !important; }
.border-top-dashed { border-top: 2px dashed #e2e8f0; }

/* ── SIDEBAR CARD ── */
.profile-sidebar { position: sticky; top: 100px; z-index: 10; }
.profile-card {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.03);
  border: 1px solid #edf2f7;
  transition: transform 0.3s ease;
}
.profile-card__banner {
  height: 80px;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}
.profile-card__content { padding: 0 20px 24px; margin-top: -45px; }

.avatar-wrapper {
  width: 90px; height: 90px;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  cursor: pointer;
  background: #f8fafc;
}
.profile-avatar { width: 100%; height: 100%; object-fit: cover; }
.avatar-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  color: white; opacity: 0; transition: .3s;
}
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }

.profile-name { font-weight: 800; font-size: 1.25rem; margin: 0; color: #0f172a; letter-spacing: -0.02em; }
.profile-email { font-size: 13px; color: #64748b; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 4px; }

.profile-stats {
  display: flex; align-items: center; justify-content: space-around;
  background: #f8fafc; border-radius: 16px; padding: 12px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-weight: 800; font-size: 16px; color: #0f172a; }
.stat-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-divider { width: 1px; height: 24px; background: #e2e8f0; }

/* ── NAVIGATION ── */
.profile-nav { display: flex; flex-direction: column; gap: 6px; }
.nav-item-btn {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 10px 14px; border: none; background: transparent;
  border-radius: 14px; transition: all 0.2s ease;
  color: #64748b; font-weight: 600; font-size: 14.5px;
  position: relative; text-align: left;
}
.nav-item-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; transition: all 0.2s;
}
.nav-item-btn:hover { background: #f8fafc; color: #0f172a; }
.nav-item-btn:hover .nav-item-icon { background: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

.nav-item-btn.active { background: #ecfdf5; color: #059669; }
.nav-item-btn.active .nav-item-icon { background: #059669; color: #ffffff; }
.nav-badge {
  margin-left: auto; background: #ef4444; color: white;
  font-size: 10px; font-weight: 800; padding: 2px 6px;
  border-radius: 8px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.btn-logout {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 12px; border: none; border-radius: 14px;
  background: #fff1f2; color: #e11d48; font-weight: 700; font-size: 14px;
  transition: all 0.2s;
}
.btn-logout:hover { background: #ffe4e6; transform: translateY(-1px); }

/* ── CONTENT AREA ── */
.content-card {
  background: #ffffff; border-radius: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
  border: 1px solid #edf2f7; padding: 32px;
  min-height: 600px;
}

.tab-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
.tab-header__icon {
  width: 56px; height: 56px; border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.tab-header__icon.personal { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.tab-header__icon.notifications { background: linear-gradient(135deg, #10b981, #059669); }
.tab-header__icon.favorites { background: linear-gradient(135deg, #f43f5e, #e11d48); }
.tab-header__icon.community { background: linear-gradient(135deg, #f59e0b, #d97706); }
.tab-header__icon.security { background: linear-gradient(135deg, #64748b, #475569); }

.tab-title { 
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800; font-size: 1.75rem; margin: 0; color: #0f172a; 
  text-transform: uppercase; letter-spacing: -0.01em; 
}
.tab-subtitle { font-size: 14px; color: #64748b; margin: 2px 0 0; font-weight: 500; }

/* ── FORMS ── */
.form-group-p { margin-bottom: 2px; }
.form-label-p { font-weight: 700; font-size: 13px; color: #475569; margin-bottom: 8px; display: block; }

.form-control-p {
  width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 12px 16px; font-size: 14px; font-weight: 500;
  color: #0f172a; background: #f8fafc; transition: all 0.2s ease;
  outline: none;
}
.form-control-p:focus {
  border-color: #10b981; background: #ffffff;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}
.form-control-p::placeholder { color: #94a3b8; }

.select-wrapper-p { position: relative; }
.select-wrapper-p::after {
  content: '\e5cf'; font-family: 'Material Icons';
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none;
}
.select-wrapper-p select { appearance: none; }

/* ── BUTTONS ── */
.btn-premium {
  padding: 12px 28px; border-radius: 14px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: none; font-size: 14.5px;
}
.btn-premium--emerald { background: #059669; color: white; }
.btn-premium--emerald:hover:not(:disabled) { background: #047857; transform: translateY(-2px); }
.btn-premium--emerald:active { transform: translateY(0); }

.btn-premium--dark { background: #1e293b; color: white; }
.btn-premium--dark:hover:not(:disabled) { background: #0f172a; transform: translateY(-2px); }

.btn-premium--outline-emerald {
  background: transparent; border: 2px solid #10b981; color: #059669;
}
.btn-premium--outline-emerald:hover { background: #ecfdf5; }

.btn-premium--light { background: #f1f5f9; color: #475569; }
.btn-premium--light:hover { background: #e2e8f0; }

.shadow-emerald { box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2); }
.btn-text-emerald { background: transparent; border: none; color: #059669; font-weight: 700; font-size: 13px; transition: .2s; }
.btn-text-emerald:hover { text-decoration: underline; color: #047857; }

/* ── NOTIFICATIONS ── */
.notification-feed { display: flex; flex-direction: column; gap: 12px; }
.noti-card {
  display: flex; gap: 16px; padding: 18px; border-radius: 20px;
  background: #ffffff; border: 1px solid #e2e8f0;
  transition: all 0.2s ease; position: relative;
}
.noti-card:hover { border-color: #cbd5e1; transform: translateX(4px); }
.noti-card.unread { background: #f0fdf4; border-color: #bbf7d0; }
.noti-card.unread::before {
  content: ''; position: absolute; left: -2px; top: 50%; transform: translateY(-50%);
  width: 4px; height: 30px; background: #059669; border-radius: 4px;
}

.noti-card__icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 22px;
}
.noti-card__icon.booking { background: #dcfce7; color: #059669; }
.noti-card__icon.payment { background: #fef3c7; color: #d97706; }
.noti-card__icon.match { background: #fee2e2; color: #ef4444; }

.noti-card__body { flex: 1; cursor: pointer; }
.noti-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.noti-card__title { font-weight: 800; font-size: 14.5px; margin: 0; color: #0f172a; }
.noti-card__time { font-size: 11px; color: #94a3b8; font-weight: 700; }
.noti-card__text { font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5; font-weight: 400; }

.noti-card__delete {
  background: transparent; border: none; color: #cbd5e1; transition: .2s;
}
.noti-card__delete:hover { color: #f43f5e; transform: scale(1.1); }

/* ── PREMIUM POST CARD ── */
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.premium-post-card {
  background: #ffffff; border-radius: 24px; border: 1px solid #edf2f7;
  padding: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column; position: relative; overflow: hidden;
}
.premium-post-card::before {
  content: ''; position: absolute; top:0; left:0; width:100%; height:4px;
  background: linear-gradient(to right, #f59e0b, #d97706);
}
.premium-post-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.05); border-color: #fbd38d; }

.post-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.post-card__tag { font-size: 10px; font-weight: 900; background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.05em; }
.post-card__date { font-size: 11.5px; font-weight: 600; color: #94a3b8; }
.post-card__title { font-weight: 800; font-size: 1.15rem; color: #0f172a; margin-bottom: 10px; line-height: 1.3; }
.post-card__content { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 20px; flex-grow: 1; }

.post-card__footer { border-top: 1px solid #f1f5f9; padding-top: 16px; display: flex; justify-content: flex-end; }
.post-card__btn-delete {
  background: transparent; border: none; color: #94a3b8; font-weight: 700;
  font-size: 12.5px; display: flex; align-items: center; gap: 6px; transition: .2s;
}
.post-card__btn-delete:hover { color: #e11d48; }

/* ── SECURITY CARD ── */
.security-card { background: #f8fafc; border-radius: 24px; border: 2px dashed #e2e8f0; }

/* ── MODALS ── */
.modal-overlay-p {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-card-p {
  background: white; border-radius: 32px; width: 100%; max-width: 650px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.15); overflow: hidden;
  animation: modal-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modal-up { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

.modal-card__header-p { padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
.modal-icon-p { width:48px; height:48px; border-radius:14px; background:#ecfdf5; display:flex; align-items:center; justify-content:center; }
.modal-title-p { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 1.5rem; margin: 0; text-transform: uppercase; }
.modal-close-btn-p { border: none; background: #f1f5f9; width: 40px; height: 40px; border-radius: 12px; display: flex; justify-content: center; align-items: center; transition: .2s; }
.modal-close-btn-p:hover { background: #e2e8f0; color: #ef4444; }

.modal-card__body-p { padding: 32px 40px; }
.modal-card__footer-p { padding: 0 40px 32px; display: flex; gap: 16px; justify-content: flex-end; }

/* ── EMPTY STATES ── */
.empty-state { text-align: center; display: flex; flex-direction: column; align-items: center; }
.empty-state__icon { font-size: 64px; margin-bottom: 20px; }
.empty-state__title { font-weight: 800; font-size: 1.25rem; margin-bottom: 8px; }
.empty-state__text { color: #64748b; font-size: 14.5px; max-width: 300px; }

/* ── SPINNERS ── */
.initial-loader { display: flex; align-items: center; justify-content: center; min-height: 80vh; }
.spinner-tiny { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── RESPONSIVE ── */
@media (max-width: 991px) {
  .profile-sidebar { position: relative; top: 0; margin-bottom: 24px; }
  .content-card { padding: 24px 20px; }
  .profile-stats { margin-left: -10px; margin-right: -10px; }
}

/* ── TRANSITIONS ── */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>

