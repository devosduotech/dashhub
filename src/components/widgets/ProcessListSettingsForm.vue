<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProcessListWidgetConfig, SshConnection } from '@/types/config'
import { useConfigStore } from '@/stores/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'update', config: Record<string, unknown>): void }>()

const cfg = computed(() => props.config as ProcessListWidgetConfig)
const store = useConfigStore()

const connectionId = ref(cfg.value.connectionId || '')
const refreshInterval = ref(cfg.value.refreshInterval || 10)
const sortBy = ref(cfg.value.sortBy || 'cpu')
const sortOrder = ref(cfg.value.sortOrder || 'desc')
const maxProcesses = ref(cfg.value.maxProcesses || 25)
const filterText = ref(cfg.value.filterText || '')

const sshConnections = computed<SshConnection[]>(() => {
  const conns: SshConnection[] = []
  for (const page of store.config.pages || []) {
    for (const item of page.items || []) {
      if (item.type === 'ssh' && Array.isArray(item.config?.connections)) {
        conns.push(...item.config.connections)
      }
    }
  }
  return conns
})

function update(updates: Partial<ProcessListWidgetConfig>) {
  emit('update', { ...cfg.value, ...updates })
}

function onConnectionChange(val: string) {
  connectionId.value = val
  update({ connectionId: val })
}

function onRefreshIntervalChange(val: string) {
  refreshInterval.value = parseInt(val)
  update({ refreshInterval: parseInt(val) })
}

function onSortByChange(val: string) {
  sortBy.value = val as 'cpu' | 'mem' | 'pid'
  update({ sortBy: val as 'cpu' | 'mem' | 'pid' })
}

function onSortOrderChange(val: string) {
  sortOrder.value = val as 'desc' | 'asc'
  update({ sortOrder: val as 'desc' | 'asc' })
}

function onMaxProcessesChange(val: string) {
  maxProcesses.value = parseInt(val)
  update({ maxProcesses: parseInt(val) })
}

function onFilterChange(val: string) {
  filterText.value = val
  update({ filterText: val })
}
</script>

<template>
  <div class="process-settings">
    <div class="form-group">
      <label class="form-label">SSH Connection</label>
      <select class="form-select" :value="connectionId" @change="onConnectionChange(($event.target as HTMLSelectElement).value)">
        <option value="">Select a connection...</option>
        <option v-for="conn in sshConnections" :key="conn.id" :value="conn.id">{{ conn.name }} ({{ conn.host }})</option>
      </select>
      <p class="form-hint">Uses existing SSH connections configured in the SSH widget</p>
    </div>

    <div class="form-row">
      <div class="form-group form-group-half">
        <label class="form-label">Sort By</label>
        <select class="form-select" :value="sortBy" @change="onSortByChange(($event.target as HTMLSelectElement).value)">
          <option value="cpu">CPU Usage</option>
          <option value="mem">Memory Usage</option>
          <option value="pid">PID</option>
        </select>
      </div>
      <div class="form-group form-group-half">
        <label class="form-label">Sort Order</label>
        <select class="form-select" :value="sortOrder" @change="onSortOrderChange(($event.target as HTMLSelectElement).value)">
          <option value="desc">Highest First</option>
          <option value="asc">Lowest First</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group form-group-half">
        <label class="form-label">Max Processes</label>
        <select class="form-select" :value="maxProcesses" @change="onMaxProcessesChange(($event.target as HTMLSelectElement).value)">
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </div>
      <div class="form-group form-group-half">
        <label class="form-label">Auto-Refresh</label>
        <select class="form-select" :value="refreshInterval" @change="onRefreshIntervalChange(($event.target as HTMLSelectElement).value)">
          <option :value="5">Every 5 seconds</option>
          <option :value="10">Every 10 seconds</option>
          <option :value="30">Every 30 seconds</option>
          <option :value="60">Every 60 seconds</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Filter</label>
      <input class="form-input" type="text" :value="filterText" placeholder="Filter by name, command, or user..." @input="onFilterChange(($event.target as HTMLInputElement).value)" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.process-settings { display: flex; flex-direction: column; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-group-half { flex: 1; }
.form-row { display: flex; gap: 1rem; }

.form-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text); }

.form-select, .form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  &:focus { outline: none; border-color: var(--color-primary); }
}

.form-hint { margin: 0; font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4; }
</style>
