<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { SystemLogsWidgetConfig } from '@/types/config'
import { fetchSystemLogs, getPriorityColor, formatTimestamp, type LogEntry } from '@/services/systemLogs'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as SystemLogsWidgetConfig)
const loading = ref(false)
const error = ref<string | null>(null)
const entries = ref<LogEntry[]>([])
const logsContainer = ref<HTMLElement | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const refreshInterval = computed(() => (cfg.value.refreshInterval || 30) * 1000)
const service = computed(() => cfg.value.service || '')
const priority = computed(() => cfg.value.priority || 'info')
const lines = computed(() => cfg.value.lines || 100)

async function loadLogs() {
  if (!cfg.value.connectionId) return
  loading.value = !entries.value.length
  error.value = null
  try {
    entries.value = await fetchSystemLogs(cfg.value.connectionId, {
      service: service.value,
      priority: priority.value,
      lines: lines.value
    })
    await nextTick()
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load logs'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
  if (refreshInterval.value > 0) {
    refreshTimer = setInterval(loadLogs, refreshInterval.value)
  }
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="system-logs-widget">
    <div v-if="!cfg.connectionId" class="empty-state">
      <AppIcon name="file" :size="32" class="empty-icon" />
      <p>Select a connection in widget settings</p>
      <div class="help-text">
        <p class="help-title">Setup Instructions:</p>
        <ol>
          <li>Add an SSH widget and configure a connection to your server</li>
          <li>Select that connection in this widget's settings</li>
          <li>Choose a service (nginx, docker, sshd, etc.) or leave blank for all</li>
          <li>Set minimum priority level (Info recommended)</li>
        </ol>
        <p class="help-note">Requires systemd/journald on the remote server.</p>
      </div>
    </div>

    <div v-else-if="error && entries.length === 0" class="error-state">
      <AppIcon name="alert-circle" :size="22" />
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadLogs"><AppIcon name="refresh" :size="14" /> Retry</button>
    </div>

    <div v-else-if="loading && entries.length === 0" class="loading-state">
      <AppIcon name="spinner" :size="22" />
      <p>Loading logs...</p>
    </div>

    <template v-else>
      <div class="log-meta">
        <span class="log-count">{{ entries.length }} entries</span>
        <span v-if="service" class="log-filter">{{ service }}</span>
        <span class="log-filter">{{ priority }}+</span>
      </div>

      <div ref="logsContainer" class="logs-container">
        <div v-if="entries.length === 0" class="no-logs">No log entries found</div>
        <div v-for="(entry, i) in entries" :key="i" class="log-entry">
          <span class="log-time">{{ formatTimestamp(entry.timestamp) }}</span>
          <span class="log-svc">{{ entry.service }}</span>
          <span class="log-msg" :style="{ color: getPriorityColor(entry.message) }">{{ entry.message }}</span>
        </div>
      </div>
    </template>

    <button v-if="cfg.connectionId" class="refresh-btn" :disabled="loading" @click="loadLogs">
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.system-logs-widget {
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
.help-text {
  text-align: left; font-size: 0.75rem; color: var(--color-text-dim);
  max-width: 280px; margin-top: 0.5rem;
  ol { margin: 0.25rem 0; padding-left: 1.25rem; }
  li { margin-bottom: 0.25rem; }
}
.help-title { font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.25rem; }
.help-note { font-style: italic; margin-top: 0.5rem; }
.retry-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.375rem 0.75rem; border: 1px solid var(--color-border);
  background: none; border-radius: 4px; color: var(--color-text);
  font-size: 0.75rem; cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); }
}
.log-meta {
  display: flex; gap: 0.5rem; margin-bottom: 0.5rem;
  font-size: 0.6875rem; color: var(--color-text-dim);
}
.log-filter {
  padding: 0.125rem 0.375rem; background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 3px;
  text-transform: uppercase; font-weight: 500;
}
.logs-container {
  max-height: 350px; overflow-y: auto;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.6875rem;
}
.no-logs { padding: 1.5rem; text-align: center; color: var(--color-text-dim); }
.log-entry {
  display: flex; gap: 0.5rem; padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
  &:hover { background-color: var(--color-bg-hover); }
}
.log-time { color: var(--color-text-dim); white-space: nowrap; min-width: 7rem; }
.log-svc { color: var(--color-primary); min-width: 4rem; font-weight: 500; }
.log-msg { color: var(--color-text); word-break: break-word; }
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
