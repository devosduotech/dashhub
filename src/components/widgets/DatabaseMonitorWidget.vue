<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DatabaseMonitorWidgetConfig } from '@/types/config'
import { fetchDatabaseMonitor, formatBytes, formatUptime, calcQps, type DatabaseStats } from '@/services/databaseMonitor'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as DatabaseMonitorWidgetConfig)
const loading = ref(false)
const error = ref<string | null>(null)
const stats = ref<DatabaseStats | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const refreshInterval = computed(() => (cfg.value.refreshInterval || 30) * 1000)

async function loadData() {
  if (!cfg.value.connectionId) return
  loading.value = !stats.value
  error.value = null
  try {
    stats.value = await fetchDatabaseMonitor(cfg.value.connectionId, {
      dbHost: cfg.value.dbHost,
      dbPort: cfg.value.dbPort,
      dbUser: cfg.value.dbUser,
      dbPassword: cfg.value.dbPassword
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to connect'
  } finally {
    loading.value = false
  }
}

const connPercent = computed(() => {
  if (!stats.value || stats.value.maxConnections === 0) return 0
  return Math.round((stats.value.connected / stats.value.maxConnections) * 100)
})

const connColor = computed(() => {
  if (connPercent.value > 80) return 'var(--color-danger, #ef4444)'
  if (connPercent.value > 50) return 'var(--color-warning, #eab308)'
  return 'var(--color-success, #22c55e)'
})

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
  <div class="db-monitor-widget">
    <div v-if="!cfg.connectionId" class="empty-state">
      <AppIcon name="database" :size="32" class="empty-icon" />
      <p>Select an SSH connection in widget settings</p>
    </div>

    <div v-else-if="error && !stats" class="error-state">
      <AppIcon name="alert-circle" :size="22" />
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadData"><AppIcon name="refresh" :size="14" /> Retry</button>
    </div>

    <div v-else-if="loading && !stats" class="loading-state">
      <AppIcon name="spinner" :size="22" />
      <p>Connecting to database...</p>
    </div>

    <template v-else-if="stats">
      <div class="status-bar">
        <span class="status-dot" :style="{ backgroundColor: error ? 'var(--color-danger)' : 'var(--color-success)' }"></span>
        <span class="status-text">{{ error ? 'Disconnected' : 'Connected' }}</span>
        <span class="uptime" v-if="stats.uptime">Up {{ formatUptime(stats.uptime) }}</span>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Connections</span>
            <span class="metric-value" :style="{ color: connColor }">{{ stats.connected }}/{{ stats.maxConnections }}</span>
          </div>
          <div class="usage-bar">
            <div class="usage-fill" :style="{ width: connPercent + '%', backgroundColor: connColor }"></div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Running</span>
            <span class="metric-value">{{ stats.running }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">QPS</span>
            <span class="metric-value">{{ calcQps(stats.queries, stats.uptime) }}</span>
          </div>
        </div>

        <div class="metric-card" :class="{ 'warning-card': stats.slowQueries > 0 }">
          <div class="metric-header">
            <span class="metric-label">Slow Queries</span>
            <span class="metric-value" :style="{ color: stats.slowQueries > 0 ? 'var(--color-danger)' : 'inherit' }">{{ stats.slowQueries }}</span>
          </div>
        </div>
      </div>

      <div class="traffic-row">
        <span class="traffic-label">Traffic:</span>
        <span class="traffic-sent">&#x2191; {{ formatBytes(stats.bytesSent) }}</span>
        <span class="traffic-recv">&#x2193; {{ formatBytes(stats.bytesReceived) }}</span>
      </div>
    </template>

    <button v-if="cfg.connectionId" class="refresh-btn" :disabled="loading" @click="loadData">
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.db-monitor-widget {
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
.status-bar {
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-text { font-size: 0.75rem; font-weight: 500; color: var(--color-text); }
.uptime { font-size: 0.6875rem; color: var(--color-text-dim); margin-left: auto; }
.metrics-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
}
.metric-card {
  display: flex; flex-direction: column; gap: 0.25rem;
  padding: 0.5rem; background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 6px;
}
.metric-card.warning-card { border-color: var(--color-danger); }
.metric-header { display: flex; justify-content: space-between; align-items: center; }
.metric-label { font-size: 0.6875rem; color: var(--color-text-dim); text-transform: uppercase; }
.metric-value { font-size: 0.875rem; font-weight: 600; }
.usage-bar {
  height: 4px; background-color: var(--color-bg);
  border-radius: 2px; overflow: hidden;
}
.usage-fill { height: 100%; border-radius: 2px; transition: width 300ms ease; }
.traffic-row {
  display: flex; gap: 0.75rem; margin-top: 0.5rem;
  font-size: 0.6875rem; color: var(--color-text-dim);
}
.traffic-label { font-weight: 600; }
.traffic-sent { color: var(--color-primary); }
.traffic-recv { color: var(--color-success); }
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
