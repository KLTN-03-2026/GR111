<template>
  <div class="map-style-control" :class="{ 'is-open': isOpen }">
    <button 
      class="style-toggle-btn" 
      @click="isOpen = !isOpen" 
      :aria-expanded="isOpen"
      title="Thay đổi kiểu bản đồ"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    </button>

    <div class="style-options" v-if="isOpen">
      <button 
        v-for="style in styles" 
        :key="style.id"
        class="style-option"
        :class="{ active: modelValue === style.url }"
        @click="selectStyle(style.url)"
      >
        <div class="style-preview" :style="{ backgroundImage: `url(${style.preview})` }"></div>
        <span class="style-label">{{ style.label }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MapStyleControl',
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      isOpen: false,
      styles: [
        { 
          id: 'streets', 
          label: 'Đường phố', 
          url: 'mapbox://styles/mapbox/streets-v12',
          preview: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/106.6297,10.8231,12,0/120x80?access_token=' + import.meta.env.VITE_MAPBOX_TOKEN
        },
        { 
          id: 'satellite', 
          label: 'Vệ tinh', 
          url: 'mapbox://styles/mapbox/satellite-streets-v12',
          preview: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/106.6297,10.8231,12,0/120x80?access_token=' + import.meta.env.VITE_MAPBOX_TOKEN
        },
        { 
          id: 'light', 
          label: 'Sáng', 
          url: 'mapbox://styles/mapbox/light-v11',
          preview: 'https://api.mapbox.com/styles/v1/mapbox/light-v11/static/106.6297,10.8231,12,0/120x80?access_token=' + import.meta.env.VITE_MAPBOX_TOKEN
        },
        { 
          id: 'dark', 
          label: 'Tối', 
          url: 'mapbox://styles/mapbox/dark-v11',
          preview: 'https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/106.6297,10.8231,12,0/120x80?access_token=' + import.meta.env.VITE_MAPBOX_TOKEN
        },
        { 
          id: 'outdoors', 
          label: 'Ngoài trời', 
          url: 'mapbox://styles/mapbox/outdoors-v12',
          preview: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/106.6297,10.8231,12,0/120x80?access_token=' + import.meta.env.VITE_MAPBOX_TOKEN
        }
      ]
    };
  },
  methods: {
    selectStyle(url) {
      this.$emit('update:modelValue', url);
      this.isOpen = false;
    }
  }
};
</script>

<style scoped>
.map-style-control {
  position: absolute;
  bottom: 24px;
  left: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.style-toggle-btn {
  width: 38px;
  height: 38px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #374151;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.style-toggle-btn:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
}

.map-style-control.is-open .style-toggle-btn {
  background: #22c55e;
  border-color: #22c55e;
  color: #fff;
}

.style-options {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.18);
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 290px;
  position: absolute;
  bottom: 48px;
  left: 0;
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: bottom left;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(10px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.style-option {
  border: 2px solid transparent;
  background: none;
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s;
  text-align: left;
}

.style-option:hover {
  background: #f1f5f9;
}

.style-option.active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.style-preview {
  width: 100%;
  aspect-ratio: 3/2;
  background-size: cover;
  background-position: center;
  border-radius: 6px;
  background-color: #e2e8f0;
}

.style-label {
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  padding-left: 2px;
}

@media (max-width: 640px) {
  .style-options {
    grid-template-columns: 1fr;
    width: 140px;
  }
}
</style>
