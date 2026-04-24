<template>
  <div class="reviews-page">
     <header class="reviews-header card-3d">
      <div class="rating-info">
        <h1 class="page-title">Đánh giá từ khách hàng</h1>
        <p class="subtitle text-muted">Phản hồi từ khách đã hoàn thành lượt đặt sân</p>

        <div v-if="loadingClubs && !clubs.length" class="text-muted small mt-3">Đang tải danh sách CLB…</div>
        <div v-else-if="!clubs.length" class="text-muted small mt-3">Bạn chưa có câu lạc bộ nào để xem đánh giá.</div>

        <div v-else class="rating-summary">
          <div class="rating-number">{{ averageRatingDisplay }}</div>
          <div class="rating-stars">
            <div class="stars-outer">
              <span
                v-for="s in 5"
                :key="s"
                class="material-icons"
              >{{ s <= Math.round(averageRating) ? 'star' : 'star_outline' }}</span>
            </div>
            <p class="total-reviews">
              Dựa trên {{ reviews.length }} đánh giá
              <span v-if="selectedClubName">· {{ selectedClubName }}</span>
            </p>
          </div>
        </div>
      </div>

      <div v-if="clubs.length" class="rating-distribution">
        <div v-for="i in 5" :key="i" class="rating-bar-row">
          <span class="star-label">{{ 6 - i }} <span class="material-icons">star</span></span>
          <div class="progress-container">
            <div class="progress-bar" :style="{ width: barPercent(6 - i) + '%' }"></div>
          </div>
          <span class="count-label">{{ ratingCountsByStar[6 - i] || 0 }}</span>
        </div>
      </div>
    </header>

    <div v-if="clubs.length" class="filters-row card-3d">
      <div class="filters-left">
        <select
          v-model="selectedClubId"
          class="sort-select club-select"
          @change="loadReviews"
        >
          <option v-for="c in clubs" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <div class="filter-group">
          <button
            v-for="f in ratingFilters"
            :key="String(f.value)"
            type="button"
            class="filter-pill"
            :class="{ active: currentFilter === f.value }"
            @click="currentFilter = f.value"
          >
            {{ f.label }}
            <span v-if="f.count !== undefined && f.count > 0" class="badge">{{ f.count }}</span>
          </button>
        </div>
      </div>
      <div class="sort-group">
        <select v-model="sortOrder" class="sort-select">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="highest">Xếp hạng cao nhất</option>
          <option value="lowest">Xếp hạng thấp nhất</option>
        </select>
      </div>
    </div>

    <div v-if="loadingReviews" class="text-center py-5 text-muted">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-2 mb-0 small">Đang tải đánh giá…</p>
    </div>

    <div v-else-if="clubs.length && selectedClubId && !filteredAndSortedReviews.length" class="card-3d text-center py-5 text-muted">
      <p class="mb-0 fw-semibold">Chưa có đánh giá nào cho CLB này.</p>
      <p class="small mt-2 mb-0">Khi khách hoàn thành đơn và gửi đánh giá, nội dung sẽ hiển thị tại đây.</p>
    </div>

    <div v-else-if="clubs.length && selectedClubId" class="reviews-list">
      <div v-for="review in filteredAndSortedReviews" :key="review.id" class="review-card card-3d">
        <div class="review-user-info">
          <div class="gradient-avatar">
            {{ userInitial(review.userName) }}
          </div>
          <div class="user-details">
            <h3 class="user-name">{{ review.userName }}</h3>
            <div class="review-meta">
              <span class="review-date">{{ review.date }}</span>
              <span v-if="selectedClubName" class="club-tag">{{ selectedClubName }}</span>
            </div>
          </div>
          <div class="review-rating-stars">
            <span
              v-for="s in 5"
              :key="s"
              class="material-icons"
              :class="{ active: s <= review.rating }"
            >{{ s <= review.rating ? 'star' : 'star_outline' }}</span>
          </div>
        </div>

        <div class="review-content">
          <p>{{ review.comment || '—' }}</p>
        </div>

        <div v-if="review.images.length" class="review-images">
          <div v-for="(img, idx) in review.images" :key="idx" class="img-wrapper">
            <img :src="img" alt="Ảnh đánh giá" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clubService } from '@/services/club.service';
import { reviewService } from '@/services/review.service';
import { toast } from 'vue3-toastify';

export default {
  name: 'OwnerReviewsView',
  data() {
    return {
      clubs: [],
      selectedClubId: '',
      reviews: [],
      loadingClubs: false,
      loadingReviews: false,
      currentFilter: 'all',
      sortOrder: 'newest',
    };
  },
  computed: {
    selectedClubName() {
      const c = this.clubs.find((x) => String(x.id) === String(this.selectedClubId));
      return c?.name || '';
    },
    ratingCountsByStar() {
      const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of this.reviews) {
        if (r.rating >= 1 && r.rating <= 5) c[r.rating]++;
      }
      return c;
    },
    ratingFilters() {
      const c = this.ratingCountsByStar;
      const total = this.reviews.length;
      return [
        { label: 'Tất cả', value: 'all', count: total },
        { label: '5 ★', value: 5, count: c[5] },
        { label: '4 ★', value: 4, count: c[4] },
        { label: '3 ★', value: 3, count: c[3] },
        { label: '2 ★', value: 2, count: c[2] },
        { label: '1 ★', value: 1, count: c[1] },
      ];
    },
    averageRating() {
      if (!this.reviews.length) return 0;
      return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
    },
    averageRatingDisplay() {
      if (!this.reviews.length) return '—';
      return this.averageRating.toFixed(1);
    },
    filteredAndSortedReviews() {
      let list =
        this.currentFilter === 'all'
          ? [...this.reviews]
          : this.reviews.filter((r) => r.rating === this.currentFilter);
      const dir = this.sortOrder;
      if (dir === 'newest') {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (dir === 'oldest') {
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (dir === 'highest') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (dir === 'lowest') {
        list.sort((a, b) => a.rating - b.rating);
      }
      return list;
    },
  },
  async mounted() {
    await this.fetchClubs();
  },
  methods: {
    userInitial(name) {
      const s = (name || '?').trim();
      return s ? s.charAt(0).toUpperCase() : '?';
    },
    barPercent(star) {
      if (!this.reviews.length) return 0;
      return Math.round((this.ratingCountsByStar[star] / this.reviews.length) * 100);
    },
    pickClubIdFromRouteOrDefault() {
      const q = this.$route.query.clubId;
      if (q !== undefined && q !== null && String(q).trim() !== '') {
        const found = this.clubs.find((c) => String(c.id) === String(q));
        if (found) return found.id;
      }
      return this.clubs[0]?.id ?? '';
    },
    async fetchClubs() {
      this.loadingClubs = true;
      try {
        const res = await clubService.getOwnerClubs();
        if (res.data?.success) {
          this.clubs = res.data.data || [];
          this.selectedClubId = this.pickClubIdFromRouteOrDefault();
          if (this.selectedClubId) await this.loadReviews();
          else this.reviews = [];
        } else {
          this.clubs = [];
          toast.error(res.data?.message || 'Không tải được danh sách CLB');
        }
      } catch (e) {
        console.error(e);
        toast.error('Không tải được danh sách CLB');
        this.clubs = [];
      } finally {
        this.loadingClubs = false;
      }
    },
    async loadReviews() {
      if (!this.selectedClubId) {
        this.reviews = [];
        return;
      }
      this.loadingReviews = true;
      this.currentFilter = 'all';
      try {
        const res = await reviewService.getReviewsByClub(this.selectedClubId);
        const raw = res?.data;
        if (Array.isArray(raw)) {
          this.reviews = raw.map((rv) => ({
            id: rv.id,
            userName: rv.user?.fullName || 'Khách hàng',
            date: new Date(rv.createdAt).toLocaleDateString('vi-VN'),
            createdAt: rv.createdAt,
            rating: rv.rating,
            comment: rv.comment || '',
            images: (rv.images || []).map((img) => img.url),
          }));
        } else {
          this.reviews = [];
        }
      } catch (e) {
        console.error(e);
        this.reviews = [];
        const msg = e.response?.data?.message || 'Không tải được đánh giá';
        toast.error(msg);
      } finally {
        this.loadingReviews = false;
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

.reviews-page {
  font-family: 'DM Sans', sans-serif;
  color: #1e293b;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-3d {
  background: #ffffff;
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-3d:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
}

/* ── Header ────────────────────────────────────────────────── */
.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 24px;
}

.rating-number {
  font-size: 56px;
  font-weight: 800;
  color: #16a34a;
  line-height: 1;
}

.stars-outer {
  color: #fbbf24;
  display: flex;
  gap: 2px;
}

.stars-outer .material-icons {
  font-size: 24px;
}

.total-reviews {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
  font-weight: 500;
}

.rating-distribution {
  flex: 1;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.star-label {
  font-size: 13px;
  font-weight: 600;
  width: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-label .material-icons {
  font-size: 14px;
  color: #fbbf24;
}

.progress-container {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 100px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #16a34a;
  border-radius: 100px;
}

.count-label {
  font-size: 13px;
  color: #64748b;
  width: 32px;
  text-align: right;
}

/* ── Filters ────────────────────────────────────────────────── */
.filters-row {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.filters-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.club-select {
  max-width: 320px;
  font-weight: 600;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-pill {
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.filter-pill:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.filter-pill.active {
  background: #16a34a;
  color: #fff;
  border-color: #16a34a;
}

.badge {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.filter-pill.active .badge {
  background: rgba(255, 255, 255, 0.25);
}

.sort-select {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-weight: 500;
  outline: none;
}

.sort-group {
  flex-shrink: 0;
}

/* ── Review Cards ─────────────────────────────────────────── */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.gradient-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.user-details {
  flex: 1;
}
.user-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.review-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
  flex-wrap: wrap;
}

.club-tag {
  background: #f1f5f9;
  padding: 0 8px;
  border-radius: 4px;
  font-weight: 600;
  color: #475569;
}

.review-rating-stars {
  display: flex;
  gap: 2px;
}
.review-rating-stars .material-icons {
  font-size: 18px;
  color: #e2e8f0;
}
.review-rating-stars .material-icons.active {
  color: #fbbf24;
}

.review-content {
  font-size: 15px;
  line-height: 1.6;
  color: #475569;
}

.review-images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.img-wrapper {
  width: 120px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .reviews-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .rating-distribution {
    max-width: 100%;
  }
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  .club-select {
    max-width: 100%;
  }
}
</style>
