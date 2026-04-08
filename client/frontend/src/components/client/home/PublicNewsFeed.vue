<template>
  <section class="public-news-feed" aria-labelledby="nearby-heading">
    <div class="container">
      <header class="section-header">
        <h2 id="nearby-heading" class="section-title">Bảng tin cộng đồng</h2>
        <p class="section-subtitle">Cập nhật những thông báo mới nhất từ các câu lạc bộ và tìm đối thủ cho trận đấu của bạn.</p>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="news-grid">
        <div v-for="n in 3" :key="n" class="skeleton-card">
          <div class="sk-img"></div>
          <div class="sk-body">
            <div class="sk-line w-80"></div>
            <div class="sk-line w-60"></div>
            <div class="sk-line w-40"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!posts.length" class="empty-news">
        <span class="material-icons">feed</span>
        <p>Hiện tại chưa có tin tức mới nào. Hãy quay lại sau nhé!</p>
      </div>

      <!-- Feed Grid -->
      <div v-else class="news-grid">
        <article v-for="post in posts.slice(0, 3)" :key="post.id" class="post-card">

          <!-- Image -->
          <div class="post-image-wrap">
            <router-link :to="`/venue/${post.club.slug}`" tabindex="-1">
              <img
                :src="post.imageUrl || getDefaultImage(post.type)"
                :alt="post.title"
                class="post-image"
                loading="lazy"
              />
            </router-link>
            <span :class="['type-tag', post.type]">{{ getLabel(post.type) }}</span>
          </div>

          <!-- Content -->
          <div class="post-content">
            <h3 class="post-title">
              <router-link :to="`/venue/${post.club.slug}`" class="title-link">
                {{ post.title }}
              </router-link>
            </h3>
            <div class="title-underline"></div>

            <p class="post-excerpt">{{ post.content }}</p>

            <div class="post-meta-row">
              <div class="club-info">
                <img :src="post.club.logoUrl || '/logo.png'" class="club-logo" :alt="post.club.name" />
                <span class="club-name">{{ post.club.name }}</span>
              </div>
              <span class="time-ago">{{ timeAgo(post.createdAt) }}</span>
            </div>

            <router-link :to="`/venue/${post.club.slug}`" class="read-more">
              Đặt sân ngay
            </router-link>
          </div>

        </article>
      </div>

      <div class="actions-bottom">
        <router-link to="/booking" class="btn-view-all">
          Xem tất cả sân
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script>
import { postService } from '@/services/post.service';

export default {
  name: 'PublicNewsFeed',
  data() {
    return {
      posts: [],
      loading: true
    };
  },
  async mounted() {
    await this.fetchFeed();
  },
  methods: {
    async fetchFeed() {
      try {
        const res = await postService.getPublicFeed();
        if (res.success) {
          this.posts = res.data || [];
        }
      } catch (e) {
        console.error("News Feed Error:", e);
      } finally {
        this.loading = false;
      }
    },
    getLabel(type) {
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
    getDefaultImage() {
      return "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80";
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
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }
};
</script>

<style scoped>
/* ── Section ── */
.public-news-feed {
  padding: 80px 0;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ── Header ── */
.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.badge-new {
  display: inline-block;
  background: rgba(22, 163, 74, 0.10);
  color: #16a34a;
  padding: 5px 14px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}

.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  font-weight: 900;
  text-transform: uppercase;
  color: #111827;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.section-subtitle {
  color: #6b7280;
  font-size: 1rem;
  max-width: 560px;
  margin: 0 auto;
  line-height: 1.6;
}

/* ── Grid ── */
.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .news-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .news-grid { grid-template-columns: 1fr; }
}

/* ── Post Card ── */
.post-card {
  background: #ffffff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.post-card:hover {
  border-color: #16a34a;
  box-shadow: 0 4px 20px rgba(22, 163, 74, 0.10);
}

/* ── Image ── */
.post-image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;
}

.post-image-wrap a {
  display: block;
  width: 100%;
  height: 100%;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.post-card:hover .post-image {
  transform: scale(1.04);
}

/* Type tag */
.type-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 0;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
}

.type-tag.DISCOUNT        { background: rgba(219, 39, 119, 0.85); }
.type-tag.AVAILABLE_SLOT  { background: rgba(22, 163, 74, 0.85); }
.type-tag.TEAM_MATCHING   { background: rgba(59, 130, 246, 0.85); }
.type-tag.EVENT           { background: rgba(234, 179, 8, 0.85); color: #1a1a1a; }
.type-tag.PROMOTION       { background: rgba(239, 68, 68, 0.85); }

/* ── Content ── */
.post-content {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0;
}

.post-title {
  font-size: 15px;
  font-weight: 800;
  color: #111827;
  line-height: 1.4;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}
.title-link:hover { color: #16a34a; }

/* Green underline accent like reference */
.title-underline {
  width: 36px;
  height: 3px;
  background: #16a34a;
  border-radius: 0;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.post-excerpt {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

/* Meta row: club + time */
.post-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.club-info {
  display: flex;
  align-items: center;
  gap: 7px;
}

.club-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid #e5e7eb;
  object-fit: cover;
}

.club-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.time-ago {
  font-size: 11.5px;
  color: #9ca3af;
}

/* Read more — green bold like reference */
.read-more {
  font-size: 13.5px;
  font-weight: 800;
  color: #16a34a;
  text-decoration: none;
  letter-spacing: 0.01em;
  transition: color 0.2s;
  align-self: flex-start;
  margin-top: auto;
}

.read-more:hover {
  color: #15803d;
  text-decoration: underline;
}

/* ── Actions bottom ── */
.actions-bottom {
  margin-top: 44px;
  display: flex;
  justify-content: center;
}

.btn-view-all {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 32px;
  background: #16a34a;
  color: #fff;
  border-radius: 100px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}

.btn-view-all svg {
  width: 16px;
  height: 16px;
  stroke: #fff;
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.btn-view-all:hover {
  background: #15803d;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.30);
}

/* ── Empty state ── */
.empty-news {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
}
.empty-news .material-icons { font-size: 48px; margin-bottom: 12px; display: block; }
.empty-news p { font-size: 15px; }

/* ── Skeleton ── */
.skeleton-card {
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.sk-img {
  width: 100%;
  aspect-ratio: 16/9;
  background: #f3f4f6;
}
.sk-body { padding: 18px 20px; }
.sk-line {
  height: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  margin-bottom: 10px;
}
.w-40 { width: 40%; }
.w-60 { width: 60%; }
.w-80 { width: 80%; }
</style>
