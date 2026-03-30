<template>
  <div class="chart-card">
    <div class="chart-title">Phân loại sân</div>
    <div class="donut-wrap">
      <div class="placeholder-chart">
        <div class="donut-center">
          <Activity :size="24" :stroke-width="1.5" class="donut-icon" />
        </div>
        <svg width="100" height="100" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="13" fill="none" stroke="var(--border)" stroke-width="4.5"/>
          <circle cx="18" cy="18" r="13" fill="none" stroke="#4f6ef7" stroke-width="4.5" stroke-dasharray="38 44"/>
          <circle cx="18" cy="18" r="13" fill="none" stroke="#22c55e" stroke-width="4.5" stroke-dasharray="22 60"/>
          <circle cx="18" cy="18" r="13" fill="none" stroke="#f97316" stroke-width="4.5" stroke-dasharray="12 70"/>
        </svg>
      </div>
      <div class="donut-legend">
        <div v-for="item in data" :key="item.label" class="legend-item">
          <div class="legend-dot" :style="{background: item.color}"></div>
          {{ item.label }}
          <span class="legend-val">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Activity } from 'lucide-vue-next';

export default {
  name: 'CourtTypeDistribution',
  components: { Activity },
  props: {
    data: { 
      type: Array, 
      default: () => [
        { label: 'Bóng đá', value: 147, color: '#4f6ef7' },
        { label: 'Cầu lông', value: 84, color: '#22c55e' },
        { label: 'Tennis', value: 52, color: '#f97316' }
      ]
    }
  }
}
</script>

<style scoped>
.chart-card { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
.chart-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: var(--text-primary); }

.donut-wrap { display: flex; align-items: center; gap: 30px; margin-top: 24px; }
.placeholder-chart { position: relative; width: 100px; height: 100px; }
.donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text-muted); }
.donut-legend { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-val { margin-left: auto; font-weight: 600; color: var(--text-primary); }
</style>
