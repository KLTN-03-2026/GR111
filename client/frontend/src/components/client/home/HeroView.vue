<template>
  <div class="playfinder-app">
    <!-- HERO SECTION -->
    <section class="hero">
      <!-- Background slider -->
      <div class="hero__bg">
        <transition-group name="fade" tag="div" class="hero__slider">
          <div
            v-for="(banner, index) in banners"
            :key="banner"
            v-show="currentBannerIndex === index"
            class="hero__slide"
          >
            <img :src="banner" alt="Sports banner" class="hero__bg-img" />
          </div>
        </transition-group>

        <!-- Diagonal slash overlay -->
        <div class="hero__slash"></div>
        <div class="hero__overlay"></div>
      </div>

      <!-- Search card -->
      <div class="hero__card">
        <h1 class="hero__title">
          <span class="hero__title--green">TÌM KIẾM TRÒ</span><br />
          <span class="hero__title--green">CHƠI </span
          ><span class="hero__title--navy">CỦA BẠN</span>
        </h1>
        <p class="hero__subtitle">
          Đặt sân thể thao và sân chơi ở Anh và Ireland
        </p>

        <!-- Sport dropdown -->
        <div class="search-field search-field--select">
          <div class="search-field__icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aaa"
              stroke-width="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3a14.5 14.5 0 0 0 0 18M12 3a14.5 14.5 0 0 1 0 18M3 12h18" />
              <path d="M3.6 7h16.8M3.6 17h16.8" />
            </svg>
          </div>
          <select v-model="selectedSport" class="search-field__select">
            <option
              v-for="sport in sports"
              :key="sport.value"
              :value="sport.value"
            >
              {{ sport.label }}
            </option>
          </select>
          <div class="search-field__chevron">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              stroke-width="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        <!-- Location input -->
        <div class="search-field">
          <div class="search-field__icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aaa"
              stroke-width="1.8"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <input
            v-model="location"
            type="text"
            placeholder="Nhập vị trí của bạn"
            class="search-field__input"
          />
          <button class="search-field__locate" title="Dùng vị trí hiện tại">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aaa"
              stroke-width="2"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <!-- CTA Button -->
        <button class="hero__cta" @click="search">
          TÌM <span class="hero__cta--accent">ĐỊA ĐIỂM</span>
        </button>
      </div>

      <!-- Bottom right logo -->
      <!-- <div class="hero__powered">
        <div class="powered-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4ade80" stroke-width="2.5" />
            <path
              d="M8 12l3 3 5-5"
              stroke="#4ade80"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="powered-logo__name">PLAYFINDER</span>
        </div>
        <div class="powered-divider">
          <span>powering</span>
        </div>
        <div class="powered-partner">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#e84040">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
            />
          </svg>
          <span class="powered-partner__name"
            >bookte<span style="color: #e84040">a</span>m</span
          >
        </div>
      </div> -->
    </section>

    <!-- BOTTOM FEATURE BAR -->
    <div class="feature-bar">
      <a href="#" class="feature-item">
        <div class="feature-item__icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div class="feature-item__text">
          <span class="feature-item__label">Tìm các cơ sở thể thao</span>
          <span class="feature-item__sub">Chơi trò chơi của bạn</span>
        </div>
        <svg
          class="feature-item__arrow"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </a>

      <div class="feature-divider"></div>

      <a href="#" class="feature-item">
        <div class="feature-item__icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
          </svg>
        </div>
        <div class="feature-item__text">
          <span class="feature-item__label"
            >Đặt chỗ trực tuyến hoặc liên hệ để biết thêm chi tiết.</span
          >
        </div>
        <svg
          class="feature-item__arrow"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </a>

      <div class="feature-divider"></div>

      <a href="#" class="feature-item feature-item--icon-only">
        <div class="feature-item__icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
      </a>
    </div>
  </div>
</template>

<script>
// Import all banners
import banner1 from "../../../assets/assets/images/banner/banner1.jpg";
import banner2 from "../../../assets/assets/images/banner/banner2.jpg";
import banner3 from "../../../assets/assets/images/banner/banner3.jpg";
import banner4 from "../../../assets/assets/images/banner/banner4.jpg";
import banner5 from "../../../assets/assets/images/banner/banner5.jpg";
import banner6 from "../../../assets/assets/images/banner/banner6.jpg";
import banner7 from "../../../assets/assets/images/banner/banner7.jpg";
import banner8 from "../../../assets/assets/images/banner/banner8.jpg";
import banner9 from "../../../assets/assets/images/banner/banner9.jpg";

export default {
  name: "PlayfinderHero",
  data() {
    return {
      selectedSport: "gaa",
      location: "Liverpool",
      currentBannerIndex: 0,
      banners: [
        banner1,
        banner2,
        banner3,
        banner4,
        banner5,
        banner6,
        banner7,
        banner8,
        banner9,
      ],
      sports: [
        { value: "gaa", label: "GAA" },
        { value: "badminton", label: "Cầu lông" },
        { value: "tennis", label: "Tennis" },
        { value: "football", label: "Bóng đá" },
        { value: "basketball", label: "Bóng rổ" },
        { value: "squash", label: "Squash" },
        { value: "cricket", label: "Cricket" },
        { value: "netball", label: "Netball" },
        { value: "volleyball", label: "Bóng chuyền" },
        { value: "rugby", label: "Rugby" },
      ],
      timer: null,
    };
  },
  mounted() {
    this.startSlider();
  },
  beforeUnmount() {
    this.stopSlider();
  },
  methods: {
    startSlider() {
      this.timer = setInterval(() => {
        this.nextSlide();
      }, 5000); // Switch every 5 seconds
    },
    stopSlider() {
      if (this.timer) {
        clearInterval(this.timer);
      }
    },
    nextSlide() {
      this.currentBannerIndex =
        (this.currentBannerIndex + 1) % this.banners.length;
    },
    search() {
      if (!this.location.trim()) return;
      alert(`Tìm kiếm: ${this.selectedSport} gần ${this.location}`);
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800;900&display=swap");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.playfinder-app {
  font-family: "Barlow", sans-serif;
  font-size: 14px;
  color: #333;
  width: 100%;
  height: calc(100vh - 80px);
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

/* ─── HERO SECTION ─── */
.hero {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* Background Slider */
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero__slider {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero__slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero__bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  filter: blur(2px) brightness(0.7);
  transform: scale(1.05); /* Avoid white edges from blur */
}

/* Transition Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Left fade overlay */
.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(240, 240, 240, 0.55) 0%,
    rgba(240, 240, 240, 0.2) 30%,
    transparent 60%
  );
  z-index: 1;
}

/* Diagonal slashes */
.hero__slash {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    -68deg,
    transparent,
    transparent 220px,
    rgba(255, 255, 255, 0.18) 220px,
    rgba(255, 255, 255, 0.18) 240px,
    transparent 240px,
    transparent 310px,
    rgba(255, 255, 255, 0.12) 310px,
    rgba(255, 255, 255, 0.12) 328px
  );
  z-index: 2;
}

/* Search card */
.hero__card {
  position: relative;
  z-index: 10;
  background: white;
  border-radius: 4px;
  padding: 32px 32px 28px;
  margin-left: 7%;
  width: 390px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
}

.hero__title {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 900;
  font-size: 52px;
  line-height: 1;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

.hero__title--green {
  color: #16a34a;
}

.hero__title--navy {
  color: #1e2a4a;
}

.hero__subtitle {
  font-size: 14px;
  color: #555;
  margin-bottom: 22px;
  font-weight: 400;
}

/* Search fields */
.search-field {
  display: flex;
  align-items: center;
  border: 1.5px solid #d1d5db;
  border-radius: 4px;
  background: white;
  margin-bottom: 12px;
  transition: border-color 0.2s;
  overflow: hidden;
}
.search-field:focus-within {
  border-color: #16a34a;
}

.search-field__icon {
  padding: 0 10px 0 12px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-field--select {
  position: relative;
}

.search-field__select {
  flex: 1;
  border: none;
  outline: none;
  font-family: "Barlow", sans-serif;
  font-size: 14.5px;
  font-weight: 500;
  color: #333;
  background: transparent;
  padding: 13px 0;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.search-field__chevron {
  padding: 0 12px;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.search-field__input {
  flex: 1;
  border: none;
  outline: none;
  font-family: "Barlow", sans-serif;
  font-size: 14.5px;
  font-weight: 500;
  color: #333;
  background: transparent;
  padding: 13px 0;
}
.search-field__input::placeholder {
  color: #aaa;
  font-weight: 400;
}

.search-field__locate {
  padding: 0 12px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.search-field__locate:hover {
  opacity: 1;
}

/* CTA button */
.hero__cta {
  width: 100%;
  background: #1e2a4a;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 15px;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 800;
  font-size: 16px;
  letter-spacing: 2px;
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.2s, transform 0.1s;
}
.hero__cta:hover {
  background: #162039;
}
.hero__cta:active {
  transform: scale(0.99);
}

.hero__cta--accent {
  color: #4ade80;
}

/* ─── BOTTOM RIGHT LOGO ─── */
.hero__powered {
  position: absolute;
  bottom: 20px;
  right: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 6px;
  padding: 10px 16px;
  backdrop-filter: blur(4px);
}

.powered-logo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.powered-logo__name {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 800;
  font-size: 15px;
  color: #1a1a2e;
  letter-spacing: 1px;
}

.powered-divider {
  font-size: 10px;
  color: #999;
  letter-spacing: 2px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
}
.powered-divider::before,
.powered-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #ddd;
}

.powered-partner {
  display: flex;
  align-items: center;
  gap: 5px;
}

.powered-partner__name {
  font-family: "Barlow", sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: -0.3px;
}

/* ─── FEATURE BAR ─── */
.feature-bar {
  background: #1e2a4a;
  display: flex;
  align-items: stretch;
  min-height: 72px;
  flex-shrink: 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 32px;
  color: white;
  text-decoration: none;
  flex: 1;
  transition: background 0.2s;
  cursor: pointer;
}
.feature-item:hover {
  background: rgba(255, 255, 255, 0.07);
}

.feature-item--icon-only {
  flex: 0 0 80px;
  justify-content: center;
}

.feature-item__icon {
  color: #4ade80;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.feature-item__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.feature-item__label {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

.feature-item__sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.feature-item__arrow {
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.feature-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: 12px 0;
}

/* ─── RESPONSIVE ─── */
@media (max-width: 768px) {
  .hero {
    min-height: 520px;
    align-items: flex-start;
    padding-top: 40px;
  }

  .hero__card {
    margin: 0 16px;
    width: calc(100% - 32px);
    padding: 24px 20px;
  }

  .hero__title {
    font-size: 40px;
  }

  .hero__powered {
    display: none;
  }

  .feature-item--icon-only {
    display: none;
  }

  .feature-item {
    padding: 14px 16px;
  }
}
</style>