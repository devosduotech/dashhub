<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { SystemInfoWidgetConfig } from '@/types/config'
import { fetchSystemInfo, formatBytes, getHealthColor, type SystemInfo } from '@/services/systemInfo'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as SystemInfoWidgetConfig)
const loading = ref(false)
const error = ref<string | null>(null)
const info = ref<SystemInfo | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const showCpu = computed(() => cfg.value.showCpu !== false)
const showMemory = computed(() => cfg.value.showMemory !== false)
const showDisk = computed(() => cfg.value.showDisk !== false)
const showNetwork = computed(() => cfg.value.showNetwork !== false)
const refreshInterval = computed(() => (cfg.value.refreshInterval || 30) * 1000)

async function loadData() {
  if (!cfg.value.connectionId) return
  loading.value = !info.value
  error.value = null
  try {
    info.value = await fetchSystemInfo(cfg.value.connectionId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
  } finally {
    loading.value = false
  }
}

const overallHealth = computed(() => {
  if (!info.value) return 'good'
  const cpu = info.value.cpu.usagePercent
  const mem = info.value.memory.percent
  const diskMax = info.value.disk.length > 0 ? Math.max(...info.value.disk.map(d => d.percent)) : 0
  if (cpu > 90 || mem > 90 || diskMax > 90) return 'critical'
  if (cpu > 70 || mem > 70 || diskMax > 70) return 'warning'
  return 'good'
})

const healthColor = computed(() => {
  if (overallHealth.value === 'critical') return 'var(--color-danger, #ef4444)'
  if (overallHealth.value === 'warning') return 'var(--color-warning, #eab308)'
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
  <div class="system-info-widget">
    <div v-if="!cfg.connectionId" class="empty-state">
      <AppIcon name="server" :size="32" class="empty-icon" />
      <p>Select a connection in widget settings</p>
    </div>

    <div v-else-if="error && !info" class="error-state">
      <AppIcon name="alert-circle" :size="22" />
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadData"><AppIcon name="refresh" :size="14" /> Retry</button>
    </div>

    <div v-else-if="loading && !info" class="loading-state">
      <AppIcon name="spinner" :size="22" />
      <p>Loading system info...</p>
    </div>

    <template v-else-if="info">
      <div v-if="showCpu" class="metric-card">
        <div class="metric-header">
          <AppIcon name="cpu" :size="16" />
          <span class="metric-label">CPU</span>
          <span class="metric-value" :style="{ color: getHealthColor(info.cpu.usagePercent) }">{{ info.cpu.usagePercent }}%</span>
        </div>
        <div class="usage-bar">
          <div class="usage-fill" :style="{ width: info.cpu.usagePercent + '%', backgroundColor: getHealthColor(info.cpu.usagePercent) }"></div>
        </div>
        <div class="metric-detail">
          <span>{{ info.cpu.cores }} cores</span>
          <span v-if="info.cpu.model" class="cpu-model">{{ info.cpu.model }}</span>
        </div>
        <div class="load-avg" v-if="info.cpu.loadAvg.some(v => v > 0)">
          Load: {{ info.cpu.loadAvg.map(v => v.toFixed(2)).join(' / ') }}
        </div>
      </div>

      <div v-if="showMemory" class="metric-card">
        <div class="metric-header">
          <AppIcon name="server" :size="16" />
          <span class="metric-label">Memory</span>
          <span class="metric-value" :style="{ color: getHealthColor(info.memory.percent) }">{{ info.memory.percent }}%</span>
        </div>
        <div class="usage-bar">
          <div class="usage-fill" :style="{ width: info.memory.percent + '%', backgroundColor: getHealthColor(info.memory.percent) }"></div>
        </div>
        <div class="metric-detail">
          <span>{{ formatBytes(info.memory.usedMb) }} / {{ formatBytes(info.memory.totalMb) }}</span>
        </div>
      </div>

      <div v-if="showDisk && info.disk.length > 0" class="metric-card">
        <div class="metric-header">
          <AppIcon name="storage" :size="16" />
          <span class="metric-label">Disk</span>
        </div>
        <div v-for="d in info.disk" :key="d.mount" class="disk-row">
          <div class="disk-info">
            <span class="disk-mount">{{ d.mount }}</span>
            <span class="disk-usage">{{ d.used }} / {{ d.total }}</span>
          </div>
          <div class="usage-bar">
            <div class="usage-fill" :style="{ width: d.percent + '%', backgroundColor: getHealthColor(d.percent) }"></div>
          </div>
        </div>
      </div>

      <div v-if="showNetwork && info.network.length > 0" class="metric-card">
        <div class="metric-header">
          <AppIcon name="network" :size="16" />
          <span class="metric-label">Network</span>
        </div>
        <div v-for="n in info.network" :key="n.interface" class="net-row">
          <span class="net-iface">{{ n.interface }}</span>
          <span class="net-ip">{{ n.ip }}</span>
          <span class="net-traffic" v-if="n.rxMb !== undefined">
            <span class="rx">&#x2193;{{ n.rxMb }} MB</span>
            <span class="tx">&#x2191;{{ n.txMb }} MB</span>
          </span>
        </div>
      </div>
    </template>

    <div v-if="info" class="health-indicator" :style="{ backgroundColor: healthColor }" :title="'System health: ' + overallHealth"></div>

    <button v-if="cfg.connectionId" class="refresh-btn" :disabled="loading" @click="loadData">
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.system-info-widget {
  padding: 1rem;
  padding-right: 2.75rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.empty-state, .loading-state, .error-state {
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
.retry-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.375rem 0.75rem; border: 1px solid var(--color-border);
  background: none; border-radius: 4px; color: var(--color-text);
  font-size: 0.75rem; cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); }
}
.metric-card {
  display: flex; flex-direction: column; gap: 0.375rem;
  padding: 0.625rem; background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 6px;
}
.metric-header {
  display: flex; align-items: center; gap: 0.5rem;
  color: var(--color-text-muted);
}
.metric-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; flex: 1; }
.metric-value { font-size: 0.875rem; font-weight: 600; }
.usage-bar {
  height: 4px; background-color: var(--color-bg);
  border-radius: 2px; overflow: hidden;
}
.usage-fill { height: 100%; border-radius: 2px; transition: width 300ms ease; }
.metric-detail {
  display: flex; gap: 0.5rem; font-size: 0.6875rem; color: var(--color-text-dim);
}
.cpu-model { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.load-avg { font-size: 0.6875rem; color: var(--color-text-dim); }
.disk-row { display: flex; flex-direction: column; gap: 0.25rem; }
.disk-row + .disk-row { margin-top: 0.25rem; }
.disk-info { display: flex; justify-content: space-between; font-size: 0.6875rem; }
.disk-mount { color: var(--color-text); font-weight: 500; }
.disk-usage { color: var(--color-text-dim); }
.net-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.375rem 0.5rem; background-color: var(--color-bg);
  border-radius: 4px; font-size: 0.75rem;
}
.net-iface { font-weight: 500; color: var(--color-text); min-width: 3rem; }
.net-ip { color: var(--color-text-muted); flex: 1; }
.net-traffic { display: flex; gap: 0.75rem; font-size: 0.6875rem; color: var(--color-text-dim); }
.rx { color: var(--color-success, #22c55e); }
.tx { color: var(--color-primary, #3b82f6); }
.health-indicator {
  position: absolute; top: 0.75rem; right: 0.75rem;
  width: 8px; height: 8px; border-radius: 50%;
}
.refresh-btn {
  position: absolute; top: 0.75rem; right: 2rem;
  display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem; border: none; background: none;
  border-radius: 4px; color: var(--color-text-muted); cursor: pointer;
  transition: all 150ms ease;
  &:hover:not(:disabled) { background-color: var(--color-bg-hover); color: var(--color-text); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
