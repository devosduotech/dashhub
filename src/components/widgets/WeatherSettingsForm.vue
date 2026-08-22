<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import type { WeatherWidgetConfig } from '@/types/config'
import { searchLocation, type GeocodingResult } from '@/services/weather'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'update', config: Record<string, unknown>): void }>()

const cfg = computed(() => props.config as WeatherWidgetConfig)

const locationQuery = ref(cfg.value.location || '')
const tempUnit = ref(cfg.value.tempUnit || 'celsius')
const windUnit = ref(cfg.value.windUnit || 'kmh')
const suggestions = ref<GeocodingResult[]>([])
const searching = ref(false)
const showSuggestions = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null

function update(updates: Partial<WeatherWidgetConfig>) {
  emit('update', { ...cfg.value, ...updates })
}

function onLocationInput() {
  showSuggestions.value = true
  if (searchTimer) clearTimeout(searchTimer)
  if (locationQuery.value.length < 2) {
    suggestions.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      suggestions.value = await searchLocation(locationQuery.value)
    } catch {
      suggestions.value = []
    } finally {
      searching.value = false
    }
  }, 300)
}

function selectLocation(result: GeocodingResult) {
  const label = result.admin1
    ? `${result.name}, ${result.admin1}, ${result.country}`
    : `${result.name}, ${result.country}`
  locationQuery.value = label
  showSuggestions.value = false
  suggestions.value = []
  update({
    location: label,
    latitude: result.latitude,
    longitude: result.longitude
  })
}

function onTempUnitChange(val: string) {
  tempUnit.value = val as 'celsius' | 'fahrenheit'
  update({ tempUnit: tempUnit.value })
}

function onWindUnitChange(val: string) {
  windUnit.value = val as 'kmh' | 'mph'
  update({ windUnit: windUnit.value })
}

function clearLocation() {
  locationQuery.value = ''
  update({ location: '', latitude: 0, longitude: 0 })
}

function onBlur() {
  setTimeout(() => { showSuggestions.value = false }, 200)
}

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div class="weather-settings">
    <div class="form-group">
      <label class="form-label">Location</label>
      <div class="location-input-wrap">
        <input
          class="form-input"
          type="text"
          :value="locationQuery"
          placeholder="Search city name..."
          @input="locationQuery = ($event.target as HTMLInputElement).value; onLocationInput()"
          @focus="showSuggestions = true"
          @blur="onBlur"
        />
        <button
          v-if="locationQuery"
          class="location-clear"
          @click="clearLocation"
        >
          <AppIcon name="close" :size="14" />
        </button>
      </div>
      <div v-if="showSuggestions && suggestions.length > 0" class="suggestions">
        <button
          v-for="(s, i) in suggestions"
          :key="i"
          class="suggestion-item"
          @mousedown.prevent="selectLocation(s)"
        >
          <AppIcon name="pin" :size="14" class="suggestion-icon" />
          <span class="suggestion-text">
            {{ s.name }}<span v-if="s.admin1">, {{ s.admin1 }}</span>, {{ s.country }}
          </span>
        </button>
      </div>
      <p v-if="cfg.latitude" class="form-hint">
        📍 {{ cfg.latitude.toFixed(2) }}, {{ cfg.longitude.toFixed(2) }}
      </p>
    </div>

    <div class="form-row">
      <div class="form-group form-group-half">
        <label class="form-label">Temperature Unit</label>
        <select
          class="form-select"
          :value="tempUnit"
          @change="onTempUnitChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="celsius">°C (Celsius)</option>
          <option value="fahrenheit">°F (Fahrenheit)</option>
        </select>
      </div>

      <div class="form-group form-group-half">
        <label class="form-label">Wind Speed Unit</label>
        <select
          class="form-select"
          :value="windUnit"
          @change="onWindUnitChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="kmh">km/h</option>
          <option value="mph">mph</option>
        </select>
      </div>
    </div>

    <p class="form-hint">
      Auto-refreshes every 30 minutes. Data provided by Open-Meteo.
    </p>
  </div>
</template>

<style scoped lang="scss">
.weather-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  position: relative;
}

.form-group-half { flex: 1; }

.form-row {
  display: flex;
  gap: 1rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.form-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.location-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.location-clear {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover { color: var(--color-text); }
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-top: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 100ms ease;

  &:hover { background-color: var(--color-bg-hover); }
}

.suggestion-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 0.8125rem;
  color: var(--color-text);
}
</style>
