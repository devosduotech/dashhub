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
  let list = processes.value

  if (cfg.value.viewMode === 'selected' && cfg.value.selectedProcesses?.length) {
    const selected = cfg.value.selectedProcesses.map(s => s.toLowerCase())
    list = list.filter(p => selected.some(s => p.name.toLowerCase().includes(s)))
  }

  const filter = (cfg.value.filterText || '').toLowerCase()
  if (filter) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(filter) ||
      p.command.toLowerCase().includes(filter) ||
      p.user.toLowerCase().includes(filter)
    )
  }

  return list
})

const totalCpu = computed(() => processes.value.reduce((sum, p) => sum + p.cpu, 0).toFixed(1))
const totalMem = computed(() => processes.value.reduce((sum, p) => sum + p.mem, 0).toFixed(1))

const topProcess = computed(() => {
  if (processes.value.length === 0) return null
  return processes.value.reduce((top, p) => p.cpu > top.cpu ? p : top, processes.value[0])
})

const cpuColor = computed(() => {
  const v = parseFloat(totalCpu.value)
  if (v > 80) return 'var(--color-danger, #ef4444)'
  if (v > 50) return 'var(--color-warning, #eab308)'
  return 'var(--color-success, #22c55e)'
})

const memColor = computed(() => {
  const v = parseFloat(totalMem.value)
  if (v > 80) return 'var(--color-danger, #ef4444)'
  if (v > 50) return 'var(--color-warning, #eab308)'
  return 'var(--color-success, #22c55e)'
})

function isTopCpu(p: ProcessInfo): boolean {
  const sorted = [...processes.value].sort((a, b) => b.cpu - a.cpu)
  return sorted.indexOf(p) < 3
}

function isTopMem(p: ProcessInfo): boolean {
  const sorted = [...processes.value].sort((a, b) => b.mem - a.mem)
  return sorted.indexOf(p) < 3
}

function cpuBarWidth(cpu: number): number {
  return Math.min(100, cpu)
}

function memBarWidth(mem: number): number {
  return Math.min(100, mem)
}

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
  const interval = (cfg.value.refreshInterval || 30) * 1000
  if (interval > 0) {
    refreshTimer = setInterval(loadProcesses, interval)
  }
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
        <div class="summary-cards">
          <div class="summary-card">
            <span class="card-value">{{ filteredProcesses.length }}</span>
            <span class="card-label">Processes</span>
          </div>
          <div class="summary-card">
            <span class="card-value" :style="{ color: cpuColor }">{{ totalCpu }}%</span>
            <span class="card-label">CPU</span>
            <div class="card-bar">
              <div class="card-bar-fill" :style="{ width: Math.min(100, parseFloat(totalCpu)) + '%', backgroundColor: cpuColor }"></div>
            </div>
          </div>
          <div class="summary-card">
            <span class="card-value" :style="{ color: memColor }">{{ totalMem }}%</span>
            <span class="card-label">MEM</span>
            <div class="card-bar">
              <div class="card-bar-fill" :style="{ width: Math.min(100, parseFloat(totalMem)) + '%', backgroundColor: memColor }"></div>
            </div>
          </div>
          <div class="summary-card" v-if="topProcess">
            <span class="card-value top-proc">{{ topProcess.name }}</span>
            <span class="card-label">Top: {{ topProcess.cpu.toFixed(1) }}% CPU</span>
          </div>
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
              <tr v-for="p in filteredProcesses" :key="p.pid" class="process-row" :class="{ 'top-row': isTopCpu(p) || isTopMem(p) }">
                <td class="col-name" :title="p.command">{{ p.name }}</td>
                <td class="col-pid">{{ p.pid }}</td>
                <td class="col-user">{{ p.user }}</td>
                <td class="col-cpu">
                  <div class="cell-with-bar">
                    <span :class="{ 'high-value': p.cpu > 50 }">{{ p.cpu.toFixed(1) }}</span>
                    <div class="mini-bar"><div class="mini-bar-fill cpu-fill" :style="{ width: cpuBarWidth(p.cpu) + '%' }"></div></div>
                  </div>
                </td>
                <td class="col-mem">
                  <div class="cell-with-bar">
                    <span :class="{ 'high-value': p.mem > 50 }">{{ p.mem.toFixed(1) }}</span>
                    <div class="mini-bar"><div class="mini-bar-fill mem-fill" :style="{ width: memBarWidth(p.mem) + '%' }"></div></div>
                  </div>
                </td>
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
.process-list-widget { padding: 1rem; padding-right: 2.75rem; position: relative; }

.empty-state, .loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 1.5rem; color: var(--color-text-muted); text-align: center;
  p { margin: 0; font-size: 0.8125rem; }
}
.empty-icon { color: var(--color-text-dim); }
.retry-btn {
  padding: 0.375rem 0.75rem; background-color: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: 4px;
  color: var(--color-text); font-size: 0.75rem; cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); }
}

.summary-cards {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.summary-card {
  display: flex; flex-direction: column; gap: 0.125rem;
  padding: 0.5rem; background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 6px;
  text-align: center;
}
.card-value { font-size: 0.875rem; font-weight: 700; color: var(--color-text); }
.card-value.top-proc { font-size: 0.6875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-label { font-size: 0.625rem; color: var(--color-text-dim); text-transform: uppercase; letter-spacing: 0.03em; }
.card-bar {
  height: 3px; background-color: var(--color-bg); border-radius: 2px; overflow: hidden; margin-top: 0.25rem;
}
.card-bar-fill { height: 100%; border-radius: 2px; transition: width 300ms ease; }

.process-table-wrap { overflow-x: auto; }
.process-table {
  width: 100%; border-collapse: collapse; font-size: 0.75rem;
  thead th {
    text-align: left; padding: 0.375rem 0.5rem;
    color: var(--color-text-muted); font-weight: 600; font-size: 0.6875rem;
    text-transform: uppercase; letter-spacing: 0.03em;
    border-bottom: 1px solid var(--color-border); white-space: nowrap;
    cursor: pointer; user-select: none;
    &:hover { color: var(--color-text); }
  }
  tbody td {
    padding: 0.25rem 0.5rem; color: var(--color-text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    border-bottom: 1px solid var(--color-border);
  }
  .process-row:hover { background-color: var(--color-bg-hover); }
  .top-row { border-left: 2px solid var(--color-danger); }
}
.col-name { max-width: 120px; }
.col-user { max-width: 80px; }
.high-value { color: var(--color-danger); font-weight: 600; }
.stat-badge { font-size: 0.6875rem; }
.cell-with-bar { display: flex; flex-direction: column; gap: 0.125rem; }
.mini-bar { height: 2px; background-color: var(--color-bg); border-radius: 1px; overflow: hidden; max-width: 3rem; }
.mini-bar-fill { height: 100%; border-radius: 1px; }
.cpu-fill { background-color: var(--color-danger); }
.mem-fill { background-color: var(--color-primary); }

.refresh-btn {
  position: absolute; top: 0.75rem; right: 0.75rem;
  display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem; border: none; background: none;
  border-radius: 4px; color: var(--color-text-muted); cursor: pointer;
  &:hover:not(:disabled) { background-color: var(--color-bg-hover); color: var(--color-text); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
