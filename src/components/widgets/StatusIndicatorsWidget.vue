<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { StatusEndpoint, StatusIndicatorsWidgetConfig } from '@/types/config'

interface EndpointStatus {
  status: 'up' | 'down' | 'warning' | 'unknown'
  latency?: number
  statusCode?: number
  lastChecked: string
}

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as StatusIndicatorsWidgetConfig)
const endpoints = computed(() => cfg.value.endpoints || [])
const showLatency = computed(() => cfg.value.showLatency || false)
const showStatusCode = computed(() => cfg.value.showStatusCode || false)
const refreshInterval = computed(() => cfg.value.refreshInterval ?? 1800)

const statuses = ref<Record<string, EndpointStatus>>({})
const checking = ref(false)

const groupedEndpoints = computed(() => {
  const groups: Record<string, StatusEndpoint[]> = {}
  for (const ep of endpoints.value) {
    const cat = ep.category || 'All'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(ep)
  }
  return groups
})

async function checkEndpoint(ep: StatusEndpoint) {
  try {
    const res = await fetch('/api/status-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: ep.url,
        method: ep.method || 'GET',
        timeout: ep.timeout || 5,
        expectedStatus: ep.expectedStatus || 200
      })
    })
    const data = await res.json()
    return {
      status: data.ok ? 'up' as const : (data.error ? 'down' as const : 'warning' as const),
      latency: data.latency,
      statusCode: data.status,
      lastChecked: new Date().toLocaleTimeString()
    }
  } catch {
    return { status: 'down' as const, lastChecked: new Date().toLocaleTimeString() }
  }
}

async function checkAll() {
  checking.value = true
  const results = await Promise.all(endpoints.value.map(async (ep) => {
    const status = await checkEndpoint(ep)
    return { key: `${ep.url}-${ep.name}`, status }
  }))
  const newStatuses: Record<string, EndpointStatus> = {}
  for (const r of results) {
    newStatuses[r.key] = r.status
  }
  statuses.value = newStatuses
  checking.value = false
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  checkAll()
  if (refreshInterval.value > 0) {
    refreshTimer = setInterval(checkAll, refreshInterval.value * 1000)
  }
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

function getStatus(ep: StatusEndpoint): EndpointStatus {
  return statuses.value[`${ep.url}-${ep.name}`] || { status: 'unknown', lastChecked: '' }
}

function statusColor(status: string) {
  if (status === 'up') return 'var(--status-up, #22c55e)'
  if (status === 'down') return 'var(--status-down, #ef4444)'
  if (status === 'warning') return 'var(--status-warning, #f59e0b)'
  return 'var(--color-text-muted)'
}
</script>

<template>
  <div class="status-widget">
    <div v-if="endpoints.length === 0" class="empty-state">
      <p>No endpoints configured.</p>
      <p v-if="editMode" class="hint">Click the gear icon above to add endpoints.</p>
    </div>

    <div v-else class="status-list">
      <div v-for="(groupEndpoints, category) in groupedEndpoints" :key="category" class="status-group">
        <div v-if="Object.keys(groupedEndpoints).length > 1" class="group-title">{{ category }}</div>
        <div
          v-for="(ep, i) in groupEndpoints"
          :key="i"
          class="status-item"
        >
          <span class="status-dot" :style="{ backgroundColor: statusColor(getStatus(ep).status) }"></span>
          <span class="status-name">{{ ep.name }}</span>
          <span v-if="showLatency && getStatus(ep).latency != null" class="status-latency">
            {{ getStatus(ep).latency }}ms
          </span>
          <span v-if="showStatusCode && getStatus(ep).statusCode" class="status-code">
            {{ getStatus(ep).statusCode }}
          </span>
        </div>
      </div>

      <div class="status-footer">
        <button class="btn btn-small" @click="checkAll" :disabled="checking">
          {{ checking ? 'Checking...' : 'Refresh' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.status-widget {
  padding: 1rem;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.hint {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-top: 0.5rem;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.group-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.125rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.status-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-name {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-latency {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.status-code {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.status-footer {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.btn {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.8125rem;
  background-color: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-small {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}
</style>
