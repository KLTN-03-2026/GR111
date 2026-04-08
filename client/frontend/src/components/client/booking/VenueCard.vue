<template>
  <article
    class="venue-card"
    :class="{
      'venue-card--partner': venue.isPartner,
      'venue-card--skeleton': !venue.id,
    }"
    itemscope
    itemtype="https://schema.org/SportsActivityLocation"
  >
    <!-- ✅ Schema.org hidden meta -->
    <meta itemprop="name"    :content="venue.name" />
    <meta itemprop="address" :content="venue.address" />
    <link itemprop="url"     :href="`/venue/${venue.slug || venue.id}`" />
    <template v-if="venue.rating">
      <span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating" class="sr-only">
        <meta itemprop="ratingValue"  :content="venue.rating" />
        <meta itemprop="reviewCount"  :content="venue.reviewCount" />
        <meta itemprop="bestRating"   content="5" />
        <meta itemprop="worstRating"  content="1" />
      </span>
    </template>

    <!-- ══ PROMO CARD ══ -->
    <div v-if="venue.isPromo" class="promo-card">
      <img :src="venue.image" :alt="venue.name" class="promo-bg" loading="lazy" width="600" height="200" />
      <div class="promo-overlay">
        <span class="promo-eyebrow">Đối tác mới</span>
        <h2 class="promo-title">{{ venue.name }}</h2>
        <p class="promo-sub">{{ venue.address }}</p>
        <router-link :to="`/venue/${venue.slug || venue.id}`" class="promo-cta">
          Khám phá ngay →
        </router-link>
      </div>
    </div>

    <!-- ══ NORMAL CARD — horizontal layout ══ -->
    <div v-else class="card-inner">

      <!-- ─ IMAGE ─ -->
      <div class="card-image">
        <router-link :to="`/venue/${venue.slug || venue.id}`" class="image-link" tabindex="-1">
          <img
            :src="venue.image"
            :alt="venue.imageAlt || `Sân ${venue.name}`"
            class="venue-img"
            loading="lazy"
            width="220" height="160"
            itemprop="image"
          />
        </router-link>

        <!-- Favorite float moved to image -->
        <button
          class="fav-float"
          :class="{ active: isFavorited }"
          @click.prevent="handleToggleFavorite"
          :aria-label="isFavorited ? `Bỏ yêu thích ${venue.name}` : `Yêu thích ${venue.name}`"
          :aria-pressed="isFavorited.toString()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <!-- Badges -->
        <div class="badge-stack">
          <span v-if="venue.isPartner" class="badge badge--partner">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#16a34a"/><path d="M8 12l3 3 5-5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Đối tác
          </span>
          <span v-if="venue.isNew" class="badge badge--new">MỚI</span>
        </div>

        <!-- Open status pill -->
        <div v-if="venue.openNow !== undefined && venue.openNow !== null" class="open-pill" :class="venue.openNow ? 'open-pill--open' : 'open-pill--closed'">
          <span class="open-dot" aria-hidden="true"></span>
          {{ venue.openNow ? 'Đang mở' : 'Đóng cửa' }}
        </div>
      </div>

      <!-- ─ CONTENT ─ -->
      <div class="card-content">

        <!-- Name -->
        <h2 class="venue-name" itemprop="name">
          <router-link :to="`/venue/${venue.slug || venue.id}`" class="name-link">
            {{ venue.name }}
          </router-link>
        </h2>

        <!-- Address -->
        <address class="venue-address" itemprop="address">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span itemprop="streetAddress" class="address-text">{{ venue.address }}</span>
        </address>

        <!-- Hours -->
        <div v-if="venue.openTime && venue.closeTime" class="venue-hours">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {{ venue.openTime }} - {{ venue.closeTime }}
        </div>

        <!-- Meta Grid -->
        <div class="meta-grid">
          <div v-if="venue.format" class="meta-item">
            <span class="meta-label">Hình thức</span>
            <span class="meta-value">{{ venue.format }}</span>
          </div>
          <div v-if="venue.surface" class="meta-item">
            <span class="meta-label">Mặt sân</span>
            <span class="meta-value">{{ venue.surface }}</span>
          </div>
          <div v-if="venue.courtCount" class="meta-item">
            <span class="meta-label">Số lượng</span>
            <span class="meta-value">{{ venue.courtCount }} sân</span>
          </div>
          <div v-if="venue.sportType" class="meta-item">
            <span class="meta-label">Môn chơi</span>
            <span class="meta-value">{{ translateSportType(venue.sportType) }}</span>
          </div>
        </div>

        <!-- Footer strip: distance + amenities + rating -->
        <div class="card-footer-strip">
          <!-- Distance -->
          <span v-if="venue.distance" class="strip-item" title="Khoảng cách">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ venue.distance }}
          </span>

          <!-- Amenities -->
          <div class="amenities-minified">
            <span v-if="hasFreeParking" class="amenity-icon" title="Đỗ xe miễn phí">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="16" r="1"/></svg>
            </span>
            <span v-if="venue.wifi" class="amenity-icon" title="Wifi miễn phí">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>
            </span>
            <span v-if="venue.shower" class="amenity-icon" title="Phòng tắm">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2c0 3-4 3-4 6"/><path d="M20 11a5 5 0 0 0-5-5"/><path d="M19 14V5"/><path d="M10 14V5"/><path d="M14 14V5"/></svg>
            </span>
          </div>

          <!-- Rating -->
          <span v-if="venue.rating" class="strip-item strip-item--rating">
            <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/></svg>
            {{ Number(venue.rating).toFixed(1) }}
            <small v-if="venue.reviewCount">({{ venue.reviewCount }})</small>
          </span>
        </div>
      </div>

      <!-- ─ RIGHT: Pricing + CTA ─ -->
      <div class="card-actions">
        <!-- Pricing -->
        <div v-if="venue.pricings && venue.pricings.length" class="price-block">
          <span class="price-label">Giá từ</span>
          <span class="price-value">{{ formatPrice(venue.pricings[0].pricePerHour) }}<small>/h</small></span>
        </div>
        <div v-else-if="venue.minPrice" class="price-block">
          <span class="price-label">Giá từ</span>
          <span class="price-value" itemprop="priceRange">{{ formatPrice(venue.minPrice) }}<small>/h</small></span>
        </div>

        <!-- CTA -->
        <router-link
          :to="`/venue/${venue.slug || venue.id}`"
          class="cta-btn"
          :aria-label="venue.hasOnlineBooking ? `Đặt sân ${venue.name} ngay` : `Xem chi tiết ${venue.name}`"
        >
          <svg v-if="venue.hasOnlineBooking" viewBox="0 0 24 24" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          {{ venue.hasOnlineBooking ? 'ĐẶT SÂN NGAY' : 'XEM CHI TIẾT' }}
        </router-link>

        <!-- Location Button -->
        <a 
          :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`" 
          target="_blank" 
          rel="noopener noreferrer"
          class="loc-btn"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          VỊ TRÍ
        </a>
      </div>

    </div>
  </article>
</template>

<script>
const SPORT_LABELS = {
  FOOTBALL:   "Bóng đá",
  BADMINTON:  "Cầu lông",
  TENNIS:     "Tennis",
  PICKLEBALL: "Pickleball",
  BASKETBALL: "Bóng rổ",
  VOLLEYBALL: "Bóng chuyền",
  OTHER:      "Thể thao",
};

export default {
  name: "VenueCard",
  props: {
    venue: { type: Object, required: true },
  },
  emits: ["favorite"],

  data() {
    return {
      isFavorited: false,
      sportLabels: SPORT_LABELS,
    };
  },

  computed: {
    hasFreeParking() {
      if (this.venue.freeParking) return true;
      if (Array.isArray(this.venue.amenities)) {
        return this.venue.amenities.some(a => {
          const k = typeof a === 'string' ? a.toLowerCase().replace(/\s+/g, '_') : (a.key || '');
          return k === 'free_parking';
        });
      }
      return false;
    },
  },

  async mounted() {
    this.checkIfFavorited();
  },

  methods: {
    formatPrice(price) {
      if (!price) return "";
      return new Intl.NumberFormat("vi-VN", {
        style: "currency", currency: "VND", maximumFractionDigits: 0,
      }).format(price);
    },

    translateSportType(type) {
      if (!type) return "";
      const upper = type.toUpperCase();
      return this.sportLabels[upper] || type;
    },

    async checkIfFavorited() {
      const user = localStorage.getItem("user");
      if (!user || !this.venue.id) return;
      if (this.venue.isFavorited !== undefined) {
        this.isFavorited = this.venue.isFavorited;
      }
    },

    async handleToggleFavorite() {
      const token = localStorage.getItem("token");
      if (!token) {
        import('vue3-toastify').then(({ toast }) => toast.warning("Vui lòng đăng nhập để lưu sân!"));
        return;
      }
      const originalState = this.isFavorited;
      this.isFavorited = !this.isFavorited;
      try {
        const { clubService } = await import('@/services/club.service');
        const res = await clubService.toggleFavorite(this.venue.id);
        if (res.data.success) {
          const { toast } = await import('vue3-toastify');
          toast.success(this.isFavorited ? "Đã lưu vào danh sách yêu thích!" : "Đã bỏ lưu sân");
          this.$emit("favorite", { id: this.venue.id, favorited: this.isFavorited });
        } else {
          throw new Error("Failed");
        }
      } catch (e) {
        this.isFavorited = originalState;
        const { toast } = await import('vue3-toastify');
        toast.error("Không thể cập nhật danh sách yêu thích");
      }
    },
  },
};
</script>

<style scoped>
/* ── Variables ── */
.venue-card {
  --green:       rgb(22, 163, 74);
  --green-dark:  rgb(15, 118, 54);
  --green-light: rgba(22, 163, 74, 0.08);
  --text:        #111827;
  --muted:       #6b7280;
  --border:      #e5e7eb;
  --card:        #ffffff;
  --radius:      12px;

  font-family: "Inter", "Barlow", sans-serif;
  font-size: 14px;
  color: var(--text);
}

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ══ CARD INNER — horizontal layout ══ */
.card-inner {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color .25s ease, box-shadow .25s ease;
}

.card-inner:hover {
  border-color: var(--green);
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

/* ─── Image (left column) ─── */
.card-image {
  position: relative;
  flex-shrink: 0;
  width: 220px;
  min-height: 160px;
  background: #f1f5f9;
  overflow: hidden;
}

.image-link {
  display: block;
  width: 100%;
  height: 100%;
}

.venue-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .45s cubic-bezier(.25,.46,.45,.94);
}

.card-inner:hover .venue-img {
  transform: scale(1.04);
}

/* Favorite float - floating on IMAGE */
.fav-float {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 3;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.fav-float svg {
  width: 16px;
  height: 16px;
  stroke: #9ca3af;
  fill: none;
  stroke-width: 2;
  transition: all 0.2s;
}

.fav-float:hover { transform: scale(1.1); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.fav-float:hover svg { stroke: #f43f5e; }
.fav-float.active { background: #fff; }
.fav-float.active svg { fill: #f43f5e; stroke: #f43f5e; }

/* Badges */
.badge-stack {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.badge--partner {
  background: rgba(255,255,255,.95);
  color: #15803d;
  box-shadow: 0 1px 4px rgba(0,0,0,.1);
}
.badge--partner svg { width: 11px; height: 11px; }
.badge--new { background: #1d4ed8; color: #fff; }

/* Open status pill */
.open-pill {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
  backdrop-filter: blur(10px);
  z-index: 2;
}
.open-pill--open  { background: rgba(22,163,74,.88); color: #fff; }
.open-pill--closed { background: rgba(220,38,38,.85); color: #fff; }
.open-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #fff;
  animation: pulse-dot 1.6s infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%      { opacity: .35; }
}

/* ─── Content (middle column) ─── */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  min-width: 0;
  border-right: 1.5px solid var(--border);
}

/* Name */
.venue-name {
  font-family: "Barlow Condensed", "Inter", sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  margin: 0;
  line-height: 1.25;
}

.name-link {
  color: var(--text);
  text-decoration: none;
  transition: color .2s;
}
.name-link:hover { color: var(--green); }

/* Address */
.venue-address {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-style: normal;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.4;
}

.venue-address svg {
  width: 13px;
  height: 13px;
  stroke: var(--muted);
  fill: none;
  stroke-width: 2;
  flex-shrink: 0;
  margin-top: 1px;
}

.address-text {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Hours */
.venue-hours {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  margin-top: -2px;
}

.venue-hours svg {
  width: 12px;
  height: 12px;
  stroke: var(--muted);
  fill: none;
  stroke-width: 2.2;
}

/* Meta Grid */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
  margin-top: 6px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.meta-label {
  font-size: 9px;
  font-weight: 800;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-value {
  font-size: 12px;
  font-weight: 700;
  color: #4b5563;
}

/* Footer strip */
.card-footer-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.strip-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--muted);
  font-weight: 600;
}

.strip-item svg {
  width: 14px;
  height: 14px;
  stroke: #9ca3af;
  fill: none;
  stroke-width: 1.8;
  flex-shrink: 0;
}

/* Amenities mini icons */
.amenities-minified {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
  border-left: 1.5px solid #f3f4f6;
}

.amenity-icon {
  display: flex;
  color: #9ca3af;
}
.amenity-icon svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 1.8; }

.strip-item--rating {
  color: #92400e;
  font-weight: 800;
  margin-left: auto;
}
.strip-item--rating svg {
  fill: #f59e0b;
  stroke: none;
}
.strip-item--rating small {
  font-size: 10px;
  color: #b45309;
  font-weight: 600;
  margin-left: 1px;
}

/* ─── Actions (right column) ─── */
.card-actions {
  flex-shrink: 0;
  width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  position: relative;
  background: #fafafb;
}

/* Price */
.price-block {
  text-align: center;
}

.price-label {
  display: block;
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.price-value {
  font-family: "Barlow Condensed", sans-serif;
  font-size: 1.3rem;
  font-weight: 900;
  color: #dc2626;
  line-height: 1;
}
.price-value small {
  font-size: 0.6em;
  font-weight: 700;
  color: var(--muted);
}

/* CTA Button */
.cta-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 10px;
  padding: 11px 12px;
  font-family: "Barlow Condensed", sans-serif;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  background: var(--green);
  color: #fff;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.cta-btn svg {
  width: 13px;
  height: 13px;
  fill: currentColor;
}

.cta-btn:hover {
  background: var(--green-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.35);
}

/* Location Button */
.loc-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  color: var(--muted);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  font-family: "Barlow Condensed", sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: all 0.2s ease;
}

.loc-btn svg {
  width: 14px;
  height: 14px;
  stroke: var(--muted);
  fill: none;
  stroke-width: 2;
}

.loc-btn:hover {
  background: #f8fafc;
  color: var(--text);
  border-color: #9ca3af;
  transform: translateY(-2px);
}

.loc-btn:hover svg {
  stroke: var(--green);
}

/* ══ PROMO CARD ══ */
.promo-card {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  min-height: 180px;
}
.promo-bg { width: 100%; height: 180px; object-fit: cover; display: block; }
.promo-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,.35) 100%);
  display: flex; flex-direction: column;
  justify-content: center; padding: 24px; gap: 6px;
}
.promo-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); }
.promo-title { font-family: "Barlow Condensed", sans-serif; font-size: 1.4rem; font-weight: 900; color: #fff; margin: 0; }
.promo-sub { font-size: 12px; color: rgba(255,255,255,.75); margin: 0; }
.promo-cta {
  display: inline-block; background: var(--green); color: #fff;
  border-radius: 7px; padding: 8px 18px; font-weight: 700;
  font-size: 12px; text-decoration: none; align-self: flex-start;
  margin-top: 4px; transition: background .2s;
}
.promo-cta:hover { background: var(--green-dark); }

/* ── Responsive ── */
@media (max-width: 640px) {
  .card-inner { flex-direction: column; }
  .card-image { width: 100%; height: 180px; }
  .card-content { border-right: none; border-bottom: 1.5px solid var(--border); }
  .card-actions { width: 100%; flex-direction: row; justify-content: space-between; background: #fff; padding: 12px; }
  .price-block { text-align: left; }
  .cta-btn { width: auto; flex: 1; min-width: 140px; }
  .loc-btn { display: none; } /* Hide loc button on very small screens to save space if needed, or keep it */
}
</style>