<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { UptimeWidgetConfig } from '@/types/config'
import {
  checkEndpoints,
  fetchUptimeHistory,
  calcUptimePercent,
  calcAvgLatency,
  buildUptimeBar,
  type UptimeEntry
} from '@/services/uptime'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as UptimeWidgetConfig)

const loading = ref(false)
const checking = ref(false)
const error = ref<string | null>(null)
const history = ref<Record<string, UptimeEntry[]>>({})
const latestResults = ref<Record<string, { status: 'up' | 'down' | 'unknown'; latency: number }>>({})
let checkTimer: ReturnType<typeof setInterval> | null = null

const endpoints = computed(() => cfg.value.endpoints || [])
const checkInterval = computed(() => (cfg.value.checkInterval || 300) * 1000)

async function runCheck() {
  if (endpoints.value.length === 0) return
  checking.value = true
  error.value = null
  try {
    const results = await checkEndpoints(endpoints.value)
    for (const r of results) {
      latestResults.value[r.id] = { status: r.status, latency: r.latency }
    }
    const hist = await fetchUptimeHistory()
    history.value = hist
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Check failed'
  } finally {
    checking.value = false
  }
}

async function loadHistory() {
  if (endpoints.value.length === 0) return
  loading.value = true
  try {
    history.value = await fetchUptimeHistory()
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function getEntries(id: string): UptimeEntry[] {
  return history.value[id] || []
}

function getBarSegments(id: string) {
  return buildUptimeBar(getEntries(id))
}

function getUptime(id: string) {
  return calcUptimePercent(getEntries(id))
}

function getAvgLatency(id: string) {
  return calcAvgLatency(getEntries(id))
}

function statusColor(status: string) {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  return 'var(--color-text-dim, #666)'
}

onMounted(() => {
  loadHistory()
  runCheck()
  checkTimer = setInterval(runCheck, checkInterval.value)
})

onUnmounted(() => {
  if (checkTimer) clearInterval(checkTimer)
})
</script>

<template>
  <div class="uptime-widget">
    <div v-if="endpoints.length === 0" class="empty-state">
      <AppIcon name="activity" :size="32" class="empty-icon" />
      <p>Add endpoints in widget settings</p>
    </div>

    <div v-else-if="error && Object.keys(history).length === 0 && Object.keys(latestResults).length === 0" class="error-state">
      <AppIcon name="alert-circle" :size="22" />
      <p>{{ error }}</p>
    </div>

    <div v-else-if="loading && Object.keys(history).length === 0" class="loading-state">
      <AppIcon name="spinner" :size="22" />
      <p>Loading uptime data...</p>
    </div>

    <template v-else>
      <div v-for="ep in endpoints" :key="ep.id" class="endpoint-row">
        <div class="endpoint-header">
          <span class="status-dot" :style="{ backgroundColor: statusColor(latestResults[ep.id]?.status || 'unknown') }"></span>
          <span class="endpoint-name">{{ ep.name }}</span>
          <span v-if="latestResults[ep.id]" class="endpoint-latency">
            {{ latestResults[ep.id].latency }}ms
          </span>
        </div>

        <div class="uptime-bar">
          <div
            v-for="(seg, i) in getBarSegments(ep.id)"
            :key="i"
            class="bar-segment"
            :style="{
              flex: seg.hours,
              backgroundColor: statusColor(seg.status)
            }"
            :title="`${seg.status}: ${seg.hours}h`"
          ></div>
        </div>

        <div class="endpoint-footer">
          <span class="uptime-percent">{{ getUptime(ep.id) }}% uptime</span>
          <span v-if="getAvgLatency(ep.id) > 0" class="avg-latency">
            Avg {{ getAvgLatency(ep.id) }}ms
          </span>
        </div>
      </div>
    </template>

    <button
      v-if="endpoints.length > 0"
      class="refresh-btn"
      :disabled="checking"
      @click="runCheck"
    >
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.uptime-widget {
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

.endpoint-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  & + & {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
  }
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.endpoint-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.endpoint-latency {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.uptime-bar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  gap: 1px;
  background-color: var(--color-bg-elevated);
}

.bar-segment {
  min-width: 1px;
  border-radius: 1px;
}

.endpoint-footer {
  display: flex;
  gap: 0.75rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.uptime-percent {
  font-weight: 500;
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
