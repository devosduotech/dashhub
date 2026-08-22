<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ProcessListWidgetConfig } from '@/types/config'
import { fetchProcesses, formatBytes, statLabel, statColor, type ProcessInfo } from '@/services/processes'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as ProcessListWidgetConfig)

const loading = ref(false)
const error = ref<string | null>(null)
const processes = ref<ProcessInfo[]>([])
const sortBy = ref<'cpu' | 'mem' | 'pid'>(cfg.value.sortBy || 'cpu')
const sortOrder = ref<'desc' | 'asc'>(cfg.value.sortOrder || 'desc')
let refreshTimer: ReturnType<typeof setInterval> | null = null

const filteredProcesses = computed(() => {
  const filter = (cfg.value.filterText || '').toLowerCase()
  if (!filter) return processes.value
  return processes.value.filter(p =>
    p.name.toLowerCase().includes(filter) ||
    p.command.toLowerCase().includes(filter) ||
    p.user.toLowerCase().includes(filter)
  )
})

const totalCpu = computed(() => processes.value.reduce((sum, p) => sum + p.cpu, 0).toFixed(1))
const totalMem = computed(() => processes.value.reduce((sum, p) => sum + p.mem, 0).toFixed(1))

async function loadProcesses() {
  if (!cfg.value.connectionId) return
  loading.value = true
  error.value = null
  try {
    processes.value = await fetchProcesses(
      cfg.value.connectionId,
      sortBy.value,
      sortOrder.value,
      cfg.value.maxProcesses || 25
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load processes'
  } finally {
    loading.value = false
  }
}

function toggleSort(col: 'cpu' | 'mem' | 'pid') {
  if (sortBy.value === col) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = col
    sortOrder.value = col === 'pid' ? 'asc' : 'desc'
  }
  loadProcesses()
}

function sortIcon(col: 'cpu' | 'mem' | 'pid') {
  if (sortBy.value !== col) return ''
  return sortOrder.value === 'desc' ? ' \u2193' : ' \u2191'
}

onMounted(() => {
  loadProcesses()
  refreshTimer = setInterval(loadProcesses, (cfg.value.refreshInterval || 10) * 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="process-list-widget">
    <div v-if="!cfg.connectionId" class="empty-state">
      <AppIcon name="cpu" :size="32" class="empty-icon" />
      <p>Select an SSH connection in settings</p>
    </div>

    <template v-else>
      <div v-if="loading && processes.length === 0" class="loading-state">
        <AppIcon name="spinner" :size="18" />
      </div>
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadProcesses">Retry</button>
      </div>
      <template v-else>
        <div class="summary-bar">
          <span class="summary-item">Processes: {{ filteredProcesses.length }}</span>
          <span class="summary-item">CPU: {{ totalCpu }}%</span>
          <span class="summary-item">MEM: {{ totalMem }}%</span>
        </div>
        <div class="process-table-wrap">
          <table class="process-table">
            <thead>
              <tr>
                <th class="col-name">Name</th>
                <th class="col-pid" @click="toggleSort('pid')">PID{{ sortIcon('pid') }}</th>
                <th class="col-user">User</th>
                <th class="col-cpu" @click="toggleSort('cpu')">CPU%{{ sortIcon('cpu') }}</th>
                <th class="col-mem" @click="toggleSort('mem')">MEM%{{ sortIcon('mem') }}</th>
                <th class="col-rss">RSS</th>
                <th class="col-stat">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProcesses" :key="p.pid" class="process-row">
                <td class="col-name" :title="p.command">{{ p.name }}</td>
                <td class="col-pid">{{ p.pid }}</td>
                <td class="col-user">{{ p.user }}</td>
                <td class="col-cpu" :class="{ 'high-value': p.cpu > 50 }">{{ p.cpu.toFixed(1) }}</td>
                <td class="col-mem" :class="{ 'high-value': p.mem > 50 }">{{ p.mem.toFixed(1) }}</td>
                <td class="col-rss">{{ formatBytes(p.rss) }}</td>
                <td class="col-stat">
                  <span class="stat-badge" :style="{ color: statColor(p.stat) }">{{ statLabel(p.stat) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <button v-if="cfg.connectionId" class="refresh-btn" :disabled="loading" @click="loadProcesses">
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.process-list-widget { padding: 1rem; position: relative; }

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
  padding: 0.375rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.75rem;
  cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); }
}

.summary-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.summary-item { white-space: nowrap; }

.process-table-wrap {
  overflow-x: auto;
}

.process-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;

  thead th {
    text-align: left;
    padding: 0.375rem 0.5rem;
    color: var(--color-text-muted);
    font-weight: 600;
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    &:hover { color: var(--color-text); }
  }

  tbody td {
    padding: 0.25rem 0.5rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 1px solid var(--color-border);
  }

  .process-row:hover {
    background-color: var(--color-bg-hover);
  }
}

.col-name { max-width: 120px; }
.col-user { max-width: 80px; }

.high-value { color: var(--color-danger); font-weight: 600; }

.stat-badge { font-size: 0.6875rem; }

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
  &:hover:not(:disabled) { background-color: var(--color-bg-hover); color: var(--color-text); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
