<template>
  <section class="vdp-hero" :style="{ backgroundImage:`url(${venue.image})` }">
    <div class="vdp-hero__overlay"></div>
    <div class="container position-relative z-2 pb-5">
      <!-- B. Back & Breadcrumb -->
      <div class="mb-5">
        <button @click="$router.push('/')" class="btn btn-sm btn-light rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2 shadow-lg fw-bold border-0" style="background: rgba(255,255,255,0.85); backdrop-filter: blur(4px); letter-spacing: 0.5px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2c3e50" stroke-width="3"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Quay lại danh sách
        </button>
      </div>
      <div v-if="sportTypes.length" class="mb-3 d-flex gap-2 flex-wrap">
        <span v-for="type in sportTypes" :key="type" 
          class="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-3 border border-white border-opacity-25 text-white fw-bold shadow-sm"
          style="background: rgba(255, 255, 255, 0.13); backdrop-filter: blur(8px); font-size: 13px;">
          <span class="material-icons" style="font-size: 13px; opacity: 0.9;">{{ getSportIcon(type) }}</span>
          {{ getSportLabel(type) }}
        </span>
      </div>
      <h1 class="fw-black text-white fs-2 mb-2">{{ venue.name }}</h1>
      <p class="text-white opacity-75 d-flex align-items-center gap-2 mb-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {{ venue.address }}
      </p>
      <div class="d-inline-flex gap-4 px-4 py-2 rounded-3 border border-white border-opacity-25" style="background:rgba(255,255,255,.13);backdrop-filter:blur(8px)">
        <div v-for="(s,i) in statItems" :key="i" class="d-flex align-items-center gap-3">
          <div v-if="i" class="vdp-sep"></div>
          <div class="text-center text-white">
            <div class="fw-bold fs-5">{{ s.v }}</div>
            <div class="small opacity-75">{{ s.l }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
const SPORT_TYPES = [
  { value: 'FOOTBALL',   label: 'Bóng đá',     icon: 'sports_soccer' },
  { value: 'BADMINTON',  label: 'Cầu lông',    icon: 'sports_tennis' },
  { value: 'TENNIS',     label: 'Tennis',       icon: 'sports_tennis' },
  { value: 'PICKLEBALL', label: 'Pickleball',   icon: 'sports_tennis' },
  { value: 'BASKETBALL', label: 'Bóng rổ',     icon: 'sports_basketball' },
  { value: 'VOLLEYBALL', label: 'Bóng chuyền',  icon: 'sports_volleyball' },
  { value: 'OTHER',      label: 'Khác',         icon: 'sports' },
];

export default {
  name: 'VenueHero',
  props: {
    venue: {
      type: Object,
      required: true
    }
  },
  computed: {
    sportTypes() {
      if (!this.venue.courts) return [];
      const types = this.venue.courts.map(c => c.sportType).filter(Boolean);
      return [...new Set(types)];
    },
    statItems() {
      let openTime = '05:00';
      let closeTime = '23:00';

      if (this.venue.openingHours && this.venue.openingHours.length) {
        const firstActiveDay = this.venue.openingHours.find(h => !h.isClosed);
        if (firstActiveDay) {
          openTime = firstActiveDay.open;
          closeTime = firstActiveDay.close;
        }
      }

      const rating = this.venue.rating ? `${this.venue.rating.toFixed(1)} ★` : 'Chưa có';

      return [
        { v: this.venue.courts?.length || 0, l: 'Sân' },
        { v: rating, l: 'Đánh giá' },
        { v: openTime, l: 'Mở cửa' },
        { v: closeTime, l: 'Đóng cửa' }
      ]
    }
  },
  methods: {
    getSportLabel(type) { return SPORT_TYPES.find(s => s.value === type)?.label || type; },
    getSportIcon(type) { return SPORT_TYPES.find(s => s.value === type)?.icon || 'sports'; }
  }
}
</script>
