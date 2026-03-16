<template>
  <div class="search-view">
    <!-- Hero Section with Search -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Tìm Sân Thể Thao Phù Hợp</h1>

          <!-- Search Form -->
          <div class="search-form">
            <div class="search-input-group">
              <div class="input-wrapper">
                <svg
                  class="search-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Tìm theo tên sân, địa điểm..."
                  class="search-input"
                  @keyup.enter="performSearch"
                />
              </div>
              <div class="input-wrapper">
                <svg
                  class="location-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  v-model="locationQuery"
                  placeholder="Địa điểm (VD: Đà Nẵng, Hà Nội...)"
                  class="search-input"
                  @keyup.enter="performSearch"
                />
              </div>
              <button @click="performSearch" class="search-btn">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Tìm Kiếm
              </button>
            </div>

            <!-- Quick Filters -->
            <div class="quick-filters">
              <span class="filter-label">Tìm nhanh:</span>
              <button
                v-for="sport in popularSports"
                :key="sport.value"
                @click="quickSearch(sport.value)"
                class="quick-filter-btn"
                :class="{ active: activeSport === sport.value }"
              >
                {{ sport.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Search Results -->
    <div class="search-results" v-if="hasSearched">
      <div class="container">
        <!-- Results Header -->
        <div class="results-header">
          <div class="results-info">
            <h2 class="results-title">
              Kết quả tìm kiếm
              <span class="results-count"
                >({{ filteredVenues.length }} kết quả)</span
              >
            </h2>
            <p v-if="searchQuery || locationQuery" class="search-query">
              Cho "{{ searchQuery || "tất cả" }}"
              {{ locationQuery ? `tại ${locationQuery}` : "" }}
            </p>
          </div>
          <div class="results-actions">
            <button @click="toggleFilters" class="filter-toggle-btn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Bộ lọc
            </button>
            <button @click="toggleMapView" class="map-toggle-btn">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              Bản đồ
            </button>
          </div>
        </div>

        <div class="results-layout" :class="{ 'filters-open': showFilters }">
          <!-- Filters Sidebar -->
          <div v-show="showFilters" class="filters-sidebar">
            <div class="filters-header">
              <h3>Bộ lọc</h3>
              <button @click="clearFilters" class="clear-filters-btn">
                Xóa tất cả
              </button>
            </div>
            <SearchFilters
              v-model="filters"
              :sport-options="sportOptions"
              :format-options="formatOptions"
              :surface-options="surfaceOptions"
              :facility-options="facilityOptions"
              :price-options="priceOptions"
            />
          </div>

          <!-- Results Grid -->
          <div class="results-grid">
            <div v-if="filteredVenues.length === 0" class="no-results">
              <div class="no-results-icon">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <h3>Không tìm thấy kết quả</h3>
              <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn</p>
              <button @click="clearAll" class="retry-btn">Tìm kiếm lại</button>
            </div>

            <div
              v-for="venue in paginatedVenues"
              :key="venue.id"
              class="venue-card-wrapper"
            >
              <VenueCard :venue="venue" />
            </div>

            <!-- Load More -->
            <div v-if="hasMoreResults" class="load-more">
              <button @click="loadMore" class="load-more-btn">
                Xem thêm
                {{ Math.min(12, filteredVenues.length - displayedCount) }} kết
                quả
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popular Searches -->
    <section v-if="!hasSearched" class="popular-searches">
      <div class="container">
        <h2 class="section-title">Tìm kiếm phổ biến</h2>
        <div class="popular-grid">
          <div
            v-for="item in popularSearches"
            :key="item.id"
            class="popular-item"
            @click="popularSearch(item)"
          >
            <img :src="item.image" :alt="item.title" class="popular-image" />
            <div class="popular-content">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <span class="popular-count">{{ item.count }} địa điểm</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import VenueCard from "../../components/client/booking/VenueCard.vue";
import SearchFilters from "../../components/client/search/SearchingFilters.vue";

export default {
  name: "SearchView",
  components: {
    VenueCard,
    SearchFilters,
  },
  data() {
    return {
      searchQuery: "",
      locationQuery: "",
      activeSport: "",
      showFilters: true,
      showMap: false,
      hasSearched: false,
      displayedCount: 12,
      filters: {
        sport: [],
        format: [],
        surface: [],
        facilities: [],
        priceRange: "",
        rating: "",
        availability: "",
      },
      popularSports: [
        { value: "football", label: "⚽ Bóng đá" },
        { value: "badminton", label: "🏸 Cầu lông" },
        { value: "tennis", label: "🎾 Tennis" },
        { value: "basketball", label: "🏀 Bóng rổ" },
        { value: "volleyball", label: "🏐 Bóng chuyền" },
      ],
      sportOptions: [
        { value: "football", label: "Bóng đá" },
        { value: "badminton", label: "Cầu lông" },
        { value: "tennis", label: "Tennis" },
        { value: "basketball", label: "Bóng rổ" },
        { value: "volleyball", label: "Bóng chuyền" },
        { value: "swimming", label: "Bơi lội" },
        { value: "fitness", label: "Fitness" },
      ],
      formatOptions: [
        { value: "5-player", label: "Sân 5 người" },
        { value: "7-player", label: "Sân 7 người" },
        { value: "11-player", label: "Sân 11 người" },
        { value: "single", label: "Đơn" },
        { value: "double", label: "Đôi" },
        { value: "indoor", label: "Trong nhà" },
        { value: "outdoor", label: "Ngoài trời" },
      ],
      surfaceOptions: [
        { value: "grass", label: "Cỏ tự nhiên" },
        { value: "artificial-grass", label: "Cỏ nhân tạo" },
        { value: "hard-court", label: "Sàn cứng" },
        { value: "wood", label: "Sàn gỗ" },
        { value: "rubber", label: "Sàn cao su" },
      ],
      facilityOptions: [
        { value: "changing-room", label: "Phòng thay đồ" },
        { value: "parking", label: "Đỗ xe miễn phí" },
        { value: "shower", label: "Phòng tắm" },
        { value: "wifi", label: "Wifi" },
        { value: "cafe", label: "Quán cafe" },
        { value: "equipment-rental", label: "Thuê dụng cụ" },
      ],
      priceOptions: [
        { value: "0-100000", label: "Dưới 100k/giờ" },
        { value: "100000-200000", label: "100k - 200k/giờ" },
        { value: "200000-500000", label: "200k - 500k/giờ" },
        { value: "500000+", label: "Trên 500k/giờ" },
      ],
      popularSearches: [
        {
          id: 1,
          title: "Sân bóng đá Đà Nẵng",
          description: "Các sân bóng đá chất lượng tại Đà Nẵng",
          count: 45,
          image:
            "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
        },
        {
          id: 2,
          title: "Cầu lông Hà Nội",
          description: "Sân cầu lông trong nhà tại Hà Nội",
          count: 32,
          image:
            "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=300&fit=crop",
        },
        {
          id: 3,
          title: "Tennis Sài Gòn",
          description: "Sân tennis chuyên nghiệp tại TP.HCM",
          count: 28,
          image:
            "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
        },
      ],
      allVenues: [
        {
          id: "s1",
          name: "Sân Cầu Lông Thanh Xuân",
          address: "Thanh Khê, Đà Nẵng",
          image:
            "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=400&fit=crop",
          isPartner: true,
          hasOnlineBooking: true,
          format: "Sân đơn",
          surface: "Sàn gỗ chuyên dụng",
          type: "Cầu lông",
          sport: "badminton",
          distance: 1.2,
          changingRoom: true,
          freeParking: true,
          wifi: true,
          availableSlots: "Còn 5 khung giờ hôm nay",
          rating: 4.6,
          reviewCount: 89,
          price: 80000,
        },
        {
          id: "s2",
          name: "Sân Bóng Đá Mini Hòa Xuân",
          address: "Cẩm Lệ, Đà Nẵng",
          image:
            "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
          isPartner: false,
          hasOnlineBooking: true,
          format: "Sân 5 người",
          surface: "Cỏ nhân tạo",
          type: "Bóng đá",
          sport: "football",
          distance: 2.1,
          changingRoom: true,
          freeParking: true,
          wifi: false,
          availableSlots: "Còn 3 khung giờ hôm nay",
          rating: 4.5,
          reviewCount: 156,
          price: 250000,
        },
        {
          id: "s3",
          name: "CLB Cầu Lông Tuyên Sơn",
          address: "Hải Châu, Đà Nẵng",
          image:
            "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop",
          isPartner: true,
          hasOnlineBooking: false,
          format: "Sân đôi",
          surface: "Sàn gỗ chuyên dụng",
          type: "Cầu lông",
          sport: "badminton",
          distance: 3.4,
          changingRoom: true,
          freeParking: false,
          wifi: true,
          availableSlots: "",
          rating: 4.7,
          reviewCount: 203,
          price: 120000,
        },
        {
          id: "s4",
          name: "Sân Tennis Quốc Tế",
          address: "Sơn Trà, Đà Nẵng",
          image:
            "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=600&h=400&fit=crop",
          isPartner: true,
          hasOnlineBooking: true,
          format: "Sân đơn",
          surface: "Sàn cứng",
          type: "Tennis",
          sport: "tennis",
          distance: 4.1,
          changingRoom: true,
          freeParking: true,
          wifi: true,
          availableSlots: "Còn 2 khung giờ chiều nay",
          rating: 4.8,
          reviewCount: 67,
          price: 150000,
        },
        {
          id: "s5",
          name: "Trung Tâm Thể Thao Liên Chiểu",
          address: "Liên Chiểu, Đà Nẵng",
          image:
            "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
          isPartner: false,
          hasOnlineBooking: true,
          format: "Sân 7 người",
          surface: "Cỏ nhân tạo",
          type: "Bóng đá",
          sport: "football",
          distance: 5.2,
          changingRoom: true,
          freeParking: true,
          wifi: false,
          availableSlots: "Còn 4 khung giờ tối nay",
          rating: 4.3,
          reviewCount: 98,
          price: 350000,
        },
      ],
    };
  },
  computed: {
    filteredVenues() {
      let venues = [...this.allVenues];

      // Text search
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        venues = venues.filter(
          (venue) =>
            venue.name.toLowerCase().includes(query) ||
            venue.type.toLowerCase().includes(query),
        );
      }

      // Location search
      if (this.locationQuery) {
        const location = this.locationQuery.toLowerCase();
        venues = venues.filter((venue) =>
          venue.address.toLowerCase().includes(location),
        );
      }

      // Sport filter
      if (this.filters.sport.length > 0) {
        venues = venues.filter((venue) =>
          this.filters.sport.includes(venue.sport),
        );
      }

      // Format filter
      if (this.filters.format.length > 0) {
        venues = venues.filter((venue) =>
          this.filters.format.includes(
            venue.format.toLowerCase().replace(/\s+/g, "-"),
          ),
        );
      }

      // Surface filter
      if (this.filters.surface.length > 0) {
        venues = venues.filter((venue) =>
          this.filters.surface.includes(
            venue.surface.toLowerCase().replace(/\s+/g, "-"),
          ),
        );
      }

      // Facilities filter
      if (this.filters.facilities.length > 0) {
        venues = venues.filter((venue) => {
          return this.filters.facilities.every((facility) => {
            switch (facility) {
              case "changing-room":
                return venue.changingRoom;
              case "parking":
                return venue.freeParking;
              case "wifi":
                return venue.wifi;
              default:
                return true;
            }
          });
        });
      }

      // Price filter
      if (this.filters.priceRange) {
        const [min, max] = this.filters.priceRange
          .split("-")
          .map((p) => (p === "+" ? Infinity : parseInt(p)));
        venues = venues.filter((venue) => {
          if (!venue.price) return false;
          return venue.price >= min && (max === Infinity || venue.price <= max);
        });
      }

      return venues;
    },
    paginatedVenues() {
      return this.filteredVenues.slice(0, this.displayedCount);
    },
    hasMoreResults() {
      return this.filteredVenues.length > this.displayedCount;
    },
  },
  methods: {
    performSearch() {
      this.hasSearched = true;
      this.displayedCount = 12;
      // Here you would typically make an API call
      console.log("Searching for:", this.searchQuery, "in", this.locationQuery);
    },
    quickSearch(sport) {
      this.activeSport = sport;
      this.filters.sport = [sport];
      this.hasSearched = true;
      this.displayedCount = 12;
    },
    popularSearch(item) {
      this.searchQuery = item.title.split(" ").slice(1).join(" "); // Extract sport/location
      this.locationQuery = item.title.split(" ").slice(-1)[0]; // Extract location
      this.performSearch();
    },
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },
    toggleMapView() {
      this.showMap = !this.showMap;
      // Implement map view toggle
    },
    clearFilters() {
      this.filters = {
        sport: [],
        format: [],
        surface: [],
        facilities: [],
        priceRange: "",
        rating: "",
        availability: "",
      };
    },
    clearAll() {
      this.searchQuery = "";
      this.locationQuery = "";
      this.clearFilters();
      this.hasSearched = false;
    },
    loadMore() {
      this.displayedCount += 12;
    },
  },
};
</script>

<style scoped>
.search-view {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  color: white;
  padding: 80px 0;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&h=1080&fit=crop")
    center/cover;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Search Form */
.search-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.search-input-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.input-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon,
.location-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.search-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-btn:hover {
  background: #5a67d8;
}

/* Quick Filters */
.quick-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 600;
  color: #374151;
}

.quick-filter-btn {
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.quick-filter-btn:hover,
.quick-filter-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* Search Results */
.search-results {
  padding: 3rem 0;
  background: #f9fafb;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.results-count {
  color: #6b7280;
  font-weight: 400;
}

.search-query {
  color: #6b7280;
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
}

.results-actions {
  display: flex;
  gap: 1rem;
}

.filter-toggle-btn,
.map-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.filter-toggle-btn:hover,
.map-toggle-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

/* Results Layout */
.results-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.filters-open .results-layout {
  grid-template-columns: 300px 1fr;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.venue-card-wrapper {
  width: 100%;
  max-width: 100%;
}

/* No Results */
.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.no-results-icon {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.no-results h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.no-results p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.retry-btn:hover {
  background: #5a67d8;
}

/* Load More */
.load-more {
  grid-column: 1 / -1;
  text-align: center;
  margin-top: 2rem;
}

.load-more-btn {
  background: white;
  border: 2px solid #e5e7eb;
  color: #374151;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.load-more-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

/* Popular Searches */
.popular-searches {
  padding: 4rem 0;
  background: white;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: #111827;
}

.popular-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.popular-item {
  background: #f9fafb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  border: 1px solid #e5e7eb;
}

.popular-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.popular-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.popular-content {
  padding: 1.5rem;
}

.popular-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
}

.popular-content p {
  color: #6b7280;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.popular-count {
  color: #667eea;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Filters Sidebar */
.filters-sidebar {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.filters-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.clear-filters-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 500;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .search-input-group {
    flex-direction: column;
  }

  .input-wrapper {
    min-width: auto;
  }

  .results-layout {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
  }

  .results-header {
    flex-direction: column;
    align-items: stretch;
  }

  .results-actions {
    justify-content: center;
  }

  .results-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .popular-grid {
    grid-template-columns: 1fr;
  }
}
</style>
