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

const showHistory = ref(false)
const historyEndpoint = ref('')

const HOUR_MS = 60 * 60 * 1000
const SEVEN_DAYS_MS = 7 * 24 * HOUR_MS

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
  return buildUptimeBar(getEntries(id), HOUR_MS)
}

function get7DayBarSegments(id: string) {
  return buildUptimeBar(getEntries(id), SEVEN_DAYS_MS)
}

function getUptime(id: string) {
  return calcUptimePercent(getEntries(id))
}

function get7DayUptime(id: string) {
  const entries = getEntries(id)
  const cutoff = Date.now() - SEVEN_DAYS_MS
  const recent = entries.filter(e => new Date(e.timestamp).getTime() >= cutoff)
  return calcUptimePercent(recent)
}

function getAvgLatency(id: string) {
  return calcAvgLatency(getEntries(id))
}

function statusColor(status: string) {
  if (status === 'up') return 'var(--color-success, #22c55e)'
  if (status === 'down') return 'var(--color-danger, #ef4444)'
  return 'var(--color-text-dim, #666)'
}

function openHistory(id: string) {
  historyEndpoint.value = id
  showHistory.value = true
}

function closeHistory() {
  showHistory.value = false
  historyEndpoint.value = ''
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

        <div class="uptime-bar" @click="openHistory(ep.id)">
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
          <span class="uptime-label">Last 1h:</span>
          <span class="uptime-percent">{{ getUptime(ep.id) }}%</span>
          <span class="uptime-divider">|</span>
          <span class="uptime-label">7d:</span>
          <span class="uptime-percent">{{ get7DayUptime(ep.id) }}%</span>
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

    <!-- History Modal -->
    <Teleport to="body">
      <div v-if="showHistory" class="modal-overlay" @click.self="closeHistory">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Uptime History — {{ endpoints.find(e => e.id === historyEndpoint)?.name }}</h2>
            <button class="modal-close" @click="closeHistory"><AppIcon name="close" :size="16" /></button>
          </div>
          <div class="modal-body">
            <div class="history-bar-wrapper">
              <span class="history-period">Last 7 days</span>
              <div class="history-bar">
                <div
                  v-for="(seg, i) in get7DayBarSegments(historyEndpoint)"
                  :key="i"
                  class="bar-segment"
                  :style="{
                    flex: seg.hours,
                    backgroundColor: statusColor(seg.status)
                  }"
                  :title="`${seg.status}: ${seg.hours}h`"
                ></div>
              </div>
              <span class="history-uptime">{{ get7DayUptime(historyEndpoint) }}% uptime</span>
            </div>

            <div class="history-recent">
              <span class="history-period">Last 1 hour</span>
              <div class="history-bar">
                <div
                  v-for="(seg, i) in getBarSegments(historyEndpoint)"
                  :key="i"
                  class="bar-segment"
                  :style="{
                    flex: seg.hours,
                    backgroundColor: statusColor(seg.status)
                  }"
                  :title="`${seg.status}: ${seg.hours}h`"
                ></div>
              </div>
              <span class="history-uptime">{{ getUptime(historyEndpoint) }}% uptime</span>
            </div>

            <div class="history-log">
              <h3 class="log-title">Recent Checks</h3>
              <div class="log-list">
                <div v-for="entry in getEntries(historyEndpoint).slice(-20).reverse()" :key="entry.timestamp" class="log-entry">
                  <span class="log-dot" :style="{ backgroundColor: statusColor(entry.status) }"></span>
                  <span class="log-time">{{ formatTimestamp(entry.timestamp) }}</span>
                  <span class="log-status" :class="'status-' + entry.status">{{ entry.status }}</span>
                  <span class="log-latency">{{ entry.latency }}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.uptime-widget {
  padding: 1rem;
  padding-right: 2.75rem;
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
  cursor: pointer;
  transition: opacity 150ms ease;

  &:hover { opacity: 0.8; }
}

.bar-segment {
  min-width: 1px;
  border-radius: 1px;
}

.endpoint-footer {
  display: flex;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.uptime-label {
  color: var(--color-text-dim);
}

.uptime-percent {
  font-weight: 500;
}

.uptime-divider {
  color: var(--color-border);
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-content {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 0.375rem;
  border-radius: 6px;
  cursor: pointer;

  &:hover { background-color: var(--color-bg-hover); }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.history-bar-wrapper,
.history-recent {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.history-period {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.history-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  gap: 1px;
  background-color: var(--color-bg);
}

.history-uptime {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
}

.history-log {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background-color: var(--color-bg);
  border-radius: 4px;
  font-size: 0.75rem;
}

.log-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.log-time {
  color: var(--color-text-muted);
  flex: 1;
}

.log-status {
  font-weight: 500;
  text-transform: capitalize;

  &.status-up { color: var(--color-success, #22c55e); }
  &.status-down { color: var(--color-danger, #ef4444); }
  &.status-unknown { color: var(--color-text-dim, #666); }
}

.log-latency {
  color: var(--color-text-muted);
  min-width: 3rem;
  text-align: right;
}
</style>
