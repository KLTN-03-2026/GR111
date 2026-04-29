<template>
  <div>
    <HeroView />
    <main id="main-content">
      <!-- ── Nearby venues ── -->
      <section
        id="nearby-venues"
        aria-labelledby="nearby-heading"
        class="section-wrapper nearby-section"
        itemscope
        itemtype="https://schema.org/ItemList"
      >
        <meta itemprop="name" content="Sân thể thao gần bạn" />

        <div class="container--wide">
          <header class="section-header">
            <h2 id="nearby-heading" class="section-title">Sân gần bạn</h2>
            <p class="section-subtitle">
              Tìm sân thể thao chất lượng gần vị trí của bạn — đặt sân nhanh chóng, tiện lợi
            </p>
          </header>

          <div class="nearby-layout">
            <!-- ─ Left: Venue List (Scrollable) ─ -->
            <div class="venues-column">
              <!-- Loading skeleton -->
              <div v-if="loading" class="venues-stack">
                <div v-for="n in 3" :key="n" class="skeleton-card">
                  <div class="skeleton-img" />
                  <div class="skeleton-body">
                    <div class="skeleton-line w-70" />
                    <div class="skeleton-line w-50" />
                    <div class="skeleton-line w-40" />
                  </div>
                </div>
              </div>

              <!-- Error state -->
              <div v-else-if="error" role="alert" class="error-state">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>{{ error }}</p>
                <button class="btn-retry" @click="fetchNearbyClubs">Thử lại</button>
              </div>

              <!-- Venue List -->
              <div v-else-if="danhSachSan.length > 0" class="venues-stack">
                <article
                  v-for="(venue, index) in danhSachSan"
                  :key="venue.id"
                  class="venue-item"
                  :style="{ animationDelay: `${index * 0.08}s` }"
                  itemprop="itemListElement"
                  itemscope
                  itemtype="https://schema.org/SportsActivityLocation"
                >
                  <VenueCard :venue="venue" />
                </article>

                <div class="view-all-wrap">
                  <router-link :to="`/booking?lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}&radius=20`" class="btn-view-all">
                    Xem tất cả {{ totalNearbyCount || '' }} sân
                    <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </router-link>
                </div>
              </div>

              <!-- Empty state -->
              <div v-else class="empty-state" role="status">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <p>Không tìm thấy sân nào xung quanh vị trí của bạn.</p>
                <button class="btn-retry" @click="loadDefaultClubs">Xem sân tại Đà Nẵng</button>
              </div>
            </div>

            <!-- ─ Right: Map (Sticky/Fixed) ─ -->
            <aside class="map-column">
              <div class="map-sticky-wrapper">
                <div ref="homeMapEl" id="home-map" class="home-mapbox"></div>
                <!-- Map Style Switcher -->
                <MapStyleControl v-if="homeMap" v-model="homeMapStyle" />
                <div v-if="mapLoading" class="map-loader-overlay">
                  <span class="spinner"></span>
                </div>
                <!-- Map Controls / Legend -->
                <div class="map-floating-info" v-if="!mapLoading">
                  <div class="info-item">
                    <span class="dot dot--user"></span> Bạn đang ở đây
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <!-- ── Mobile App Promotion ── -->
      <MobileAppPromo />

      <!-- ── Community News Feed ── -->
      <PublicNewsFeed />

      <!-- ── Cities ── -->
      <section
        id="cities"
        aria-labelledby="cities-heading"
        class="section-wrapper"
      >
        <CitiesView heading-id="cities-heading" />
      </section>
   
       <!-- ── Services ── -->
      <section
        id="services"
        aria-labelledby="services-heading"
        class="section-wrapper"
      >
        <ServicesView heading-id="services-heading" />
      </section>
      <!-- ── Statistics ── -->
      <section
        id="statistics"
        aria-labelledby="stats-heading"
        class="section-wrapper"
      >
        <StatisticsView heading-id="stats-heading" />
      </section>
     
      <!-- ── Blog ── -->
      <section
        id="blog"
        aria-labelledby="blog-heading"
        class="section-wrapper"
        itemscope
        itemtype="https://schema.org/Blog"
      >
        <BlogView heading-id="blog-heading" />
      </section>
      <section
        id="venue-showcase"
        aria-labelledby="showcase-heading"
        class="section-wrapper"
      >
        <VenueView heading-id="showcase-heading" />
      </section>
    </main>
  </div>
</template>

<script>
import CitiesView     from "@/components/client/home/CitiesView.vue";
import HeroView       from "@/components/client/home/HeroView.vue";
import StatisticsView from "@/components/client/home/StatisticsView.vue";
import ServicesView   from "@/components/client/home/ServicesView.vue";
import BlogView       from "@/components/client/home/BlogView.vue";
import VenueView      from "@/components/client/home/VenueView.vue";
import PublicNewsFeed from "@/components/client/home/PublicNewsFeed.vue";
import MobileAppPromo from "@/components/client/home/MobileAppPromo.vue";
import VenueCard      from "@/components/client/booking/VenueCard.vue";
import { clubService } from "@/services/club.service.js";
import mapboxgl        from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import MapStyleControl from "@/components/common/MapStyleControl.vue";

// ── Default fallback coords: Đà Nẵng ──
const DEFAULT_LAT = 16.047079;
const DEFAULT_LNG = 108.206230;

export default {
  name: "HomeView",

  components: {
    HeroView,
    CitiesView,
    StatisticsView,
    ServicesView,
    BlogView,
    VenueView,
    VenueCard,
    PublicNewsFeed,
    MobileAppPromo,
    MapStyleControl,
  },

  data() {
    return {
      danhSachSan: [],
      loading: true,
      error: null,
      totalNearbyCount: 0,
      userCoords: null,
      DEFAULT_LAT,
      DEFAULT_LNG,

      // Map state
      homeMap: null,
      homeMapStyle: 'mapbox://styles/mapbox/light-v11',
      homeMarkers: [],
      mapLoading: false,
    };
  },

  computed: {
    schemaOrg() {
      return [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PlayFinder",
          "alternateName": "Hệ thống đặt sân PlayFinder",
          "url": "https://playfinder.vn",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://playfinder.vn/san?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PlayFinder",
          "url": "https://playfinder.vn",
          "logo": "https://playfinder.vn/logo.png",
          "sameAs": [
            "https://www.facebook.com/playfinder.vn",
            "https://www.instagram.com/playfinder.vn"
          ]
        }
      ];
    }
  },

  async mounted() {
    document.title = "Đặt sân bóng đá, tennis, cầu lông gần bạn | PlayFinder Việt Nam";

    await this.loadDefaultClubs();
    this.tryGeolocation();
  },

  beforeUnmount() {
    this.destroyMap();
  },

  watch: {
    homeMapStyle(newStyle) {
      if (this.homeMap) {
        this.homeMap.setStyle(newStyle);
        this.homeMap.once('style.load', () => {
          this.renderMarkers();
        });
      }
    }
  },

  methods: {
    async loadDefaultClubs() {
      this.loading = true;
      this.error = null;
      try {
        const res = await clubService.getNearbyClubs(DEFAULT_LAT, DEFAULT_LNG);
        this.danhSachSan = this.mapVenues(res.data.data);
        this.totalNearbyCount = this.danhSachSan.length;
        this.$nextTick(() => this.initMap());
      } catch (e) {
        console.error("Default club load error:", e);
        this.error = "Không thể tải danh sách sân. Vui lòng thử lại.";
      } finally {
        this.loading = false;
      }
    },

    tryGeolocation() {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          this.userCoords = { lat: latitude, lng: longitude };
          try {
            const res = await clubService.getNearbyClubs(latitude, longitude);
            const refined = this.mapVenues(res.data.data);
            if (refined.length > 0) {
              this.danhSachSan = refined;
              this.totalNearbyCount = refined.length;
              this.renderMarkers();
              this.updateMapBounds();
            }
          } catch (e) {
            console.warn("Geolocation refine failed:", e);
          }
        },
        (err) => {
          // User denying location is expected behavior; keep silent to avoid noisy console warnings.
          if (err?.code === 1) return;
          console.warn("Geolocation failed:", err?.message || err);
        },
        { timeout: 8000, maximumAge: 300_000 }
      );
    },

    initMap() {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token || !this.$refs.homeMapEl || this.homeMap) return;

      mapboxgl.accessToken = token;
      this.mapLoading = true;

      const center = this.userCoords 
        ? [this.userCoords.lng, this.userCoords.lat]
        : [DEFAULT_LNG, DEFAULT_LAT];

      this.homeMap = new mapboxgl.Map({
        container: this.$refs.homeMapEl,
        style: this.homeMapStyle,
        center,
        zoom: 13,
        attributionControl: false,
      });

      this.homeMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      this.homeMap.on('load', () => {
        this.mapLoading = false;
        this.renderMarkers();
        this.updateMapBounds();
      });
    },

    renderMarkers() {
      if (!this.homeMap) return;
      this.homeMarkers.forEach(m => m.remove());
      this.homeMarkers = [];

      // 1. User marker
      if (this.userCoords) {
        const el = document.createElement('div');
        el.className = 'user-marker';
        const m = new mapboxgl.Marker(el)
          .setLngLat([this.userCoords.lng, this.userCoords.lat])
          .addTo(this.homeMap);
        this.homeMarkers.push(m);
      }

      // 2. Venue markers
      const SPORT_ICON_CLASS = {
        FOOTBALL: 'bx bx-football',
        BADMINTON: 'bx bx-tennis-ball',
        TENNIS: 'bx bx-tennis-ball',
        PICKLEBALL: 'bx bx-tennis-ball',
        BASKETBALL: 'bx bx-basketball',
        VOLLEYBALL: 'bx bx-basketball',
      };

      this.danhSachSan.forEach(v => {
        if (!v.latitude || !v.longitude) return;
        const el = document.createElement('div');
        el.className = 'home-venue-marker';
        el.innerHTML = `<i class="${SPORT_ICON_CLASS[v.sportType?.toUpperCase()] || 'bx bx-map-pin'} home-venue-marker__icon" aria-hidden="true"></i>`;
        
        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false })
          .setHTML(`<div class="map-p-name">${v.name}</div><div class="map-p-addr">${v.address}</div>`);

        const m = new mapboxgl.Marker(el)
          .setLngLat([v.longitude, v.latitude])
          .setPopup(popup)
          .addTo(this.homeMap);
        
        this.homeMarkers.push(m);
      });
    },

    updateMapBounds() {
      if (!this.homeMap || this.danhSachSan.length === 0) return;
      const bounds = new mapboxgl.LngLatBounds();
      if (this.userCoords) bounds.extend([this.userCoords.lng, this.userCoords.lat]);
      this.danhSachSan.forEach(v => {
        if (v.latitude && v.longitude) bounds.extend([v.longitude, v.latitude]);
      });
      this.homeMap.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    },

    destroyMap() {
      if (this.homeMap) {
        this.homeMarkers.forEach(m => m.remove());
        this.homeMap.remove();
        this.homeMap = null;
      }
    },

    async fetchNearbyClubs() {
      await this.loadDefaultClubs();
    },

    mapVenues(data = []) {
      return data.slice(0, 10).map((item) => ({
        ...item,
        image:           item.coverImageUrl || item.logoUrl || "/img/default-club.png",
        distance:        item.distance ? `${parseFloat(item.distance).toFixed(1)} km` : null,
        isPartner:       true,
        hasOnlineBooking: true,
        rating:          item.rating   ?? 4.8, 
        reviewCount:     item.reviewCount ?? (item.bookings?.length || 0),
        slug:            item.slug || item.id,
      }));
    },
  },
};
</script>

<style scoped>
/* ── Variables ── */
.nearby-section {
  --green: rgb(22, 163, 74);
  --green-dark: rgb(15, 118, 54);
  --text-dark: #1a1a2e;
  --text-muted: #6b7280;
  --bg-section: #f7f8fa;
  --border: #e2e8f0;
  --radius: 16px;
}

.container--wide {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 40px;
}

@media (max-width: 768px) {
  .container--wide { padding: 0 20px; }
}

.nearby-section {
  background: var(--bg-section);
  padding: 80px 0;
}

/* ── Section header ── */
.section-header {
  text-align: center;
  margin-bottom: 56px;
}

.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto;
}

/* ── Dual Pane Layout ── */
.nearby-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.venues-column {
  flex: 1;
  min-width: 0;
}

.map-column {
  flex: 0 0 40%;
  width: 40%;
  position: sticky;
  top: 100px;
}

@media (max-width: 1100px) {
  .map-column { flex: 0 0 45%; width: 45%; }
}

@media (max-width: 992px) {
  .nearby-layout { flex-direction: column-reverse; }
  .map-column { 
    position: relative;
    top: 0;
    width: 100%;
    height: 400px;
    margin-bottom: 40px;
  }
  .map-sticky-wrapper { height: 100%; }
}

/* ── List Stack ── */
.venues-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.venue-item {
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Map Styling ── */
.map-sticky-wrapper {
  height: calc(100vh - 160px);
  min-height: 500px;
  background: #fff;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: 0 12px 40px rgba(0,0,0,0.06);
  position: relative;
}

.home-mapbox {
  width: 100%;
  height: 100%;
}

.map-loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.map-floating-info {
  position: absolute;
  top: 16px;
  left: 16px;
  background: #fff;
  padding: 10px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  z-index: 10;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot--user {
  background: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

/* ── Custom Markers ── */
:deep(.user-marker) {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

:deep(.home-venue-marker) {
  width: 36px;
  height: 36px;
  background: #fff;
  border: 2px solid var(--green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.home-venue-marker__icon) {
  font-size: 19px;
  line-height: 1;
  color: var(--green);
}

:deep(.home-venue-marker:hover) {
  transform: scale(1.15);
  z-index: 10;
  border-color: var(--green-dark);
}

:deep(.home-venue-marker:hover .home-venue-marker__icon) {
  color: var(--green-dark);
}

:deep(.map-p-name) { font-weight: 800; font-size: 14px; margin-bottom: 2px; }
:deep(.map-p-addr) { font-size: 12px; color: #666; }

/* ── Skeleton ── */
.skeleton-card {
  display: flex;
  gap: 20px;
  background: #fff;
  border-radius: var(--radius);
  padding: 20px;
  border: 1px solid var(--border);
}

.skeleton-img {
  width: 280px;
  height: 160px;
  background: #f1f5f9;
  border-radius: 12px;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
}

.skeleton-line {
  height: 14px;
  background: #f1f5f9;
  border-radius: 4px;
}

/* ── Error / Empty states ── */
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 40px;
  background: #fff;
  border-radius: var(--radius);
  border: 2px dashed var(--border);
  color: var(--text-muted);
  text-align: center;
}

.error-state svg,
.empty-state svg {
  width: 56px;
  height: 56px;
  stroke: #cbd5e1;
  stroke-width: 1.5;
  fill: none;
}

.btn-retry {
  background: var(--green);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 32px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover { background: var(--green-dark); transform: translateY(-2px); }

/* ── View All CTA ── */
.view-all-wrap {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.btn-view-all {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  color: var(--text-dark);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 16px 40px;
  font-family: 'Barlow', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.btn-view-all svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2.5;
  fill: none;
  transition: transform 0.3s ease;
}

.btn-view-all:hover {
  background: var(--green);
  border-color: var(--green);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(61, 213, 109, 0.3);
}

.btn-view-all:hover svg {
  transform: translateX(4px);
}
</style>