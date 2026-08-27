<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ServiceStatusWidgetConfig } from '@/types/config'
import { fetchServiceStatus, getStatusColor, formatSince, type ServiceStatus } from '@/services/serviceStatus'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as ServiceStatusWidgetConfig)
const loading = ref(false)
const error = ref<string | null>(null)
const services = ref<ServiceStatus[]>([])
let refreshTimer: ReturnType<typeof setInterval> | null = null

const refreshInterval = computed(() => (cfg.value.refreshInterval || 30) * 1000)
const serviceNames = computed(() => (cfg.value.services || []).map(s => typeof s === 'string' ? s : s.name))
const serviceLabels = computed(() => {
  const map: Record<string, string> = {}
  for (const s of cfg.value.services || []) {
    if (typeof s === 'string') {
      map[s] = s
    } else {
      map[s.name] = s.label || s.name
    }
  }
  return map
})

async function loadData() {
  if (!cfg.value.connectionId || serviceNames.value.length === 0) return
  loading.value = !services.value.length
  error.value = null
  try {
    services.value = await fetchServiceStatus(cfg.value.connectionId, serviceNames.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
  } finally {
    loading.value = false
  }
}

const activeCount = computed(() => services.value.filter(s => s.active).length)

onMounted(() => {
  loadData()
  if (refreshInterval.value > 0) {
    refreshTimer = setInterval(loadData, refreshInterval.value)
  }
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="service-status-widget">
    <div v-if="!cfg.connectionId || serviceNames.length === 0" class="empty-state">
      <AppIcon name="power" :size="32" class="empty-icon" />
      <p>Add services in widget settings</p>
    </div>

    <div v-else-if="error && services.length === 0" class="error-state">
      <AppIcon name="alert-circle" :size="22" />
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadData"><AppIcon name="refresh" :size="14" /> Retry</button>
    </div>

    <div v-else-if="loading && services.length === 0" class="loading-state">
      <AppIcon name="spinner" :size="22" />
      <p>Loading service status...</p>
    </div>

    <template v-else>
      <div class="status-summary">
        <span class="summary-count">{{ activeCount }}/{{ services.length }}</span>
        <span class="summary-label">active</span>
      </div>

      <div class="service-list">
        <div v-for="svc in services" :key="svc.name" class="service-row">
          <span class="status-dot" :style="{ backgroundColor: getStatusColor(svc.active, svc.state) }"></span>
          <div class="service-info">
            <span class="service-name">{{ serviceLabels[svc.name] || svc.name }}</span>
            <span class="service-state">{{ svc.state }}</span>
          </div>
          <span class="service-since" v-if="svc.since">{{ formatSince(svc.since) }}</span>
        </div>
      </div>
    </template>

    <button v-if="cfg.connectionId && serviceNames.length > 0" class="refresh-btn" :disabled="loading" @click="loadData">
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.service-status-widget {
  padding: 1rem;
  padding-right: 2.75rem;
  position: relative;
}
.empty-state, .loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 1.5rem; color: var(--color-text-muted); text-align: center;
  p { margin: 0; font-size: 0.8125rem; }
}
.empty-icon { color: var(--color-text-dim); }
.retry-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.375rem 0.75rem; border: 1px solid var(--color-border);
  background: none; border-radius: 4px; color: var(--color-text);
  font-size: 0.75rem; cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); }
}
.status-summary {
  display: flex; align-items: baseline; gap: 0.375rem;
  margin-bottom: 0.75rem;
}
.summary-count { font-size: 1.25rem; font-weight: 700; color: var(--color-text); }
.summary-label { font-size: 0.75rem; color: var(--color-text-muted); }
.service-list { display: flex; flex-direction: column; gap: 0.375rem; }
.service-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 6px;
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.service-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.service-name { font-size: 0.8125rem; font-weight: 500; color: var(--color-text); }
.service-state { font-size: 0.6875rem; color: var(--color-text-dim); text-transform: capitalize; }
.service-since { font-size: 0.6875rem; color: var(--color-text-dim); white-space: nowrap; }
.refresh-btn {
  position: absolute; top: 0.75rem; right: 0.75rem;
  display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem; border: none; background: none;
  border-radius: 4px; color: var(--color-text-muted); cursor: pointer;
  transition: all 150ms ease;
  &:hover:not(:disabled) { background-color: var(--color-bg-hover); color: var(--color-text); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
