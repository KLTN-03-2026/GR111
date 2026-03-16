<template>
  <div class="search-filters">
    <!-- Sport Type -->
    <div class="filter-group">
      <h4 class="filter-title">Môn thể thao</h4>
      <div class="filter-options">
        <label
          v-for="option in sportOptions"
          :key="option.value"
          class="filter-option"
        >
          <input
            type="checkbox"
            :value="option.value"
            :checked="modelValue.sport.includes(option.value)"
            @change="toggleFilter('sport', option.value)"
          />
          <span class="checkmark"></span>
          {{ option.label }}
        </label>
      </div>
    </div>

    <!-- Format -->
    <div class="filter-group">
      <h4 class="filter-title">Định dạng sân</h4>
      <div class="filter-options">
        <label
          v-for="option in formatOptions"
          :key="option.value"
          class="filter-option"
        >
          <input
            type="checkbox"
            :value="option.value"
            :checked="modelValue.format.includes(option.value)"
            @change="toggleFilter('format', option.value)"
          />
          <span class="checkmark"></span>
          {{ option.label }}
        </label>
      </div>
    </div>

    <!-- Surface -->
    <div class="filter-group">
      <h4 class="filter-title">Bề mặt sân</h4>
      <div class="filter-options">
        <label
          v-for="option in surfaceOptions"
          :key="option.value"
          class="filter-option"
        >
          <input
            type="checkbox"
            :value="option.value"
            :checked="modelValue.surface.includes(option.value)"
            @change="toggleFilter('surface', option.value)"
          />
          <span class="checkmark"></span>
          {{ option.label }}
        </label>
      </div>
    </div>

    <!-- Facilities -->
    <div class="filter-group">
      <h4 class="filter-title">Tiện ích</h4>
      <div class="filter-options">
        <label
          v-for="option in facilityOptions"
          :key="option.value"
          class="filter-option"
        >
          <input
            type="checkbox"
            :value="option.value"
            :checked="modelValue.facilities.includes(option.value)"
            @change="toggleFilter('facilities', option.value)"
          />
          <span class="checkmark"></span>
          {{ option.label }}
        </label>
      </div>
    </div>

    <!-- Price Range -->
    <div class="filter-group">
      <h4 class="filter-title">Khoảng giá</h4>
      <div class="filter-options">
        <label
          v-for="option in priceOptions"
          :key="option.value"
          class="filter-option radio-option"
        >
          <input
            type="radio"
            name="priceRange"
            :value="option.value"
            :checked="modelValue.priceRange === option.value"
            @change="updateFilter('priceRange', option.value)"
          />
          <span class="radio-mark"></span>
          {{ option.label }}
        </label>
      </div>
    </div>

    <!-- Rating -->
    <div class="filter-group">
      <h4 class="filter-title">Đánh giá</h4>
      <div class="filter-options">
        <label class="filter-option radio-option">
          <input
            type="radio"
            name="rating"
            value="4"
            :checked="modelValue.rating === '4'"
            @change="updateFilter('rating', '4')"
          />
          <span class="radio-mark"></span>
          4+ sao
        </label>
        <label class="filter-option radio-option">
          <input
            type="radio"
            name="rating"
            value="3"
            :checked="modelValue.rating === '3'"
            @change="updateFilter('rating', '3')"
          />
          <span class="radio-mark"></span>
          3+ sao
        </label>
        <label class="filter-option radio-option">
          <input
            type="radio"
            name="rating"
            value=""
            :checked="modelValue.rating === ''"
            @change="updateFilter('rating', '')"
          />
          <span class="radio-mark"></span>
          Tất cả
        </label>
      </div>
    </div>

    <!-- Availability -->
    <div class="filter-group">
      <h4 class="filter-title">Tình trạng</h4>
      <div class="filter-options">
        <label class="filter-option radio-option">
          <input
            type="radio"
            name="availability"
            value="available"
            :checked="modelValue.availability === 'available'"
            @change="updateFilter('availability', 'available')"
          />
          <span class="radio-mark"></span>
          Còn chỗ
        </label>
        <label class="filter-option radio-option">
          <input
            type="radio"
            name="availability"
            value="online-booking"
            :checked="modelValue.availability === 'online-booking'"
            @change="updateFilter('availability', 'online-booking')"
          />
          <span class="radio-mark"></span>
          Đặt online
        </label>
        <label class="filter-option radio-option">
          <input
            type="radio"
            name="availability"
            value=""
            :checked="modelValue.availability === ''"
            @change="updateFilter('availability', '')"
          />
          <span class="radio-mark"></span>
          Tất cả
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SearchFilters",
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    sportOptions: Array,
    formatOptions: Array,
    surfaceOptions: Array,
    facilityOptions: Array,
    priceOptions: Array,
  },
  emits: ["update:modelValue"],
  methods: {
    updateFilter(key, value) {
      const newFilters = { ...this.modelValue, [key]: value };
      this.$emit("update:modelValue", newFilters);
    },
    toggleFilter(key, value) {
      const currentValues = [...this.modelValue[key]];
      const index = currentValues.indexOf(value);
      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(value);
      }
      this.updateFilter(key, currentValues);
    },
  },
};
</script>

<style scoped>
.search-filters {
  font-family: "Barlow", sans-serif;
}

.filter-group {
  margin-bottom: 2rem;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.filter-title::before {
  content: "";
  width: 4px;
  height: 16px;
  background: #667eea;
  border-radius: 2px;
  margin-right: 0.75rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.95rem;
  color: #374151;
  transition: color 0.2s;
}

.filter-option:hover {
  color: #111827;
}

.filter-option input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark,
.radio-mark {
  position: relative;
  height: 18px;
  width: 18px;
  background-color: #fff;
  border: 2px solid #d1d5db;
  border-radius: 3px;
  margin-right: 0.75rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.radio-mark {
  border-radius: 50%;
}

.filter-option input:checked ~ .checkmark {
  background-color: #667eea;
  border-color: #667eea;
}

.filter-option input:checked ~ .checkmark::after {
  content: "";
  position: absolute;
  display: block;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.filter-option input:checked ~ .radio-mark {
  background-color: #667eea;
  border-color: #667eea;
}

.filter-option input:checked ~ .radio-mark::after {
  content: "";
  position: absolute;
  display: block;
  left: 5px;
  top: 5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
}

.radio-option .checkmark {
  display: none;
}

.radio-option .radio-mark {
  display: block;
}

/* Responsive */
@media (max-width: 768px) {
  .filter-group {
    margin-bottom: 1.5rem;
  }

  .filter-title {
    font-size: 1rem;
  }

  .filter-option {
    font-size: 0.9rem;
  }
}
</style>
