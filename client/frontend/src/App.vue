<template>
  <div class="app-shell">
    <component :is="layout">
      <router-view></router-view>
    </component>

    <Transition name="app-loader-fade">
      <div v-if="isPageLoading" class="app-page-loader" role="status" aria-live="polite" aria-label="Đang tải trang">
        <div class="app-page-loader__card">
          <span class="app-page-loader__spinner" aria-hidden="true"></span>
          <span class="app-page-loader__text">Đang tải trang...</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
const default_layout = "default";
const LOADER_EVENT_NAME = "app:navigation-loading";

export default {
  data() {
    return {
      isPageLoading: false,
    };
  },
  created() {
    window.addEventListener(LOADER_EVENT_NAME, this.onNavigationLoading);
  },
  beforeUnmount() {
    window.removeEventListener(LOADER_EVENT_NAME, this.onNavigationLoading);
  },
  computed: {
    layout() {
      return (this.$route.meta.layout || default_layout) + "-layout";
    },
  },
  methods: {
    onNavigationLoading(event) {
      this.isPageLoading = !!event?.detail?.loading;
    },
  },
};
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800;900&display=swap');

:root {
  --primary-font: 'Barlow', sans-serif;
  --heading-font: 'Barlow Condensed', sans-serif;
  --bg: #e0e0e0;
  --card-bg: #e0e0e0;
  --border: transparent;
}

body, html {
  background-color: var(--bg) !important;
  margin: 0;
  padding: 0;
}

#app {
  font-family: var(--primary-font);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg);
}

.app-shell {
  position: relative;
  min-height: 100vh;
}

.app-page-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.app-page-loader__card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.app-page-loader__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #dcfce7;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: app-spin 0.75s linear infinite;
}

.app-page-loader__text {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 700;
}

.app-loader-fade-enter-active,
.app-loader-fade-leave-active {
  transition: opacity 0.18s ease;
}

.app-loader-fade-enter-from,
.app-loader-fade-leave-to {
  opacity: 0;
}

@keyframes app-spin {
  to {
    transform: rotate(360deg);
  }
}

h1, h2, h3, h4, h5, h6, .display-font {
  font-family: var(--heading-font);
}
</style>