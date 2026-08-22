<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { WeatherWidgetConfig } from '@/types/config'
import {
  fetchForecast,
  weatherCodeToIcon,
  weatherCodeToLabel,
  formatDay,
  type WeatherForecast
} from '@/services/weather'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as WeatherWidgetConfig)

const loading = ref(false)
const error = ref<string | null>(null)
const forecast = ref<WeatherForecast | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const tempUnit = computed(() => cfg.value.tempUnit || 'celsius')
const windUnit = computed(() => cfg.value.windUnit || 'kmh')
const tempSymbol = computed(() => tempUnit.value === 'fahrenheit' ? '°F' : '°C')
const windSymbol = computed(() => windUnit.value === 'mph' ? 'mph' : 'km/h')

async function loadWeather() {
  if (!cfg.value.latitude && !cfg.value.longitude) return
  loading.value = true
  error.value = null
  try {
    const data = await fetchForecast(
      cfg.value.latitude,
      cfg.value.longitude,
      tempUnit.value,
      windUnit.value
    )
    data.location = cfg.value.location || `${cfg.value.latitude}, ${cfg.value.longitude}`
    forecast.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load weather'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWeather()
  refreshTimer = setInterval(loadWeather, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="weather-widget">
    <div v-if="!cfg.latitude && !cfg.longitude" class="empty-state">
      <AppIcon name="cloud" :size="32" class="empty-icon" />
      <p>Configure a location in widget settings</p>
    </div>

    <div v-else-if="loading && !forecast" class="loading-state">
      <AppIcon name="spinner" :size="22" />
      <p>Loading weather...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <template v-else-if="forecast">
      <div class="current">
        <div class="current-main">
          <span class="current-icon">{{ weatherCodeToIcon(forecast.current.weatherCode) }}</span>
          <span class="current-temp">{{ Math.round(forecast.current.temperature) }}{{ tempSymbol }}</span>
        </div>
        <div class="current-details">
          <span class="current-location">{{ forecast.location }}</span>
          <span class="current-desc">{{ weatherCodeToLabel(forecast.current.weatherCode) }}</span>
          <div class="current-stats">
            <span class="stat">💧 {{ forecast.current.humidity }}%</span>
            <span class="stat">💨 {{ Math.round(forecast.current.windSpeed) }} {{ windSymbol }}</span>
          </div>
        </div>
      </div>

      <div class="forecast">
        <div v-for="day in forecast.daily" :key="day.date" class="forecast-day">
          <span class="forecast-label">{{ formatDay(day.date) }}</span>
          <span class="forecast-icon">{{ weatherCodeToIcon(day.weatherCode) }}</span>
          <span class="forecast-temps">
            <span class="temp-high">{{ Math.round(day.tempMax) }}°</span>
            <span class="temp-low">{{ Math.round(day.tempMin) }}°</span>
          </span>
        </div>
      </div>
    </template>

    <button
      v-if="cfg.latitude"
      class="refresh-btn"
      :disabled="loading"
      @click="loadWeather"
    >
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.weather-widget {
  padding: 1rem;
  position: relative;
}

.empty-state,
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: var(--color-text-muted);
  text-align: center;

  p { margin: 0; font-size: 0.8125rem; }
}

.empty-icon { color: var(--color-text-dim); }

.current {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.current-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.current-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.current-temp {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
}

.current-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.current-location {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.current-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.current-stats {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.stat {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.forecast {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.375rem;
}

.forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.25rem;
  background-color: var(--color-bg-elevated);
  border-radius: 6px;
}

.forecast-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.forecast-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.forecast-temps {
  display: flex;
  gap: 0.375rem;
  font-size: 0.75rem;
}

.temp-high {
  font-weight: 600;
  color: var(--color-text);
}

.temp-low {
  color: var(--color-text-muted);
}

.refresh-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: none;
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 150ms ease;

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
