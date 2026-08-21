<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { SpeedtestWidgetConfig } from '@/types/config'
import {
  buildUrls,
  measurePing,
  measureDownload,
  measureUpload,
  type SpeedtestResult
} from '@/services/speedtest'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as SpeedtestWidgetConfig)
const server = computed(() => cfg.value.server || 'cloudflare')
const customBaseUrl = computed(() => cfg.value.customBaseUrl || '')
const testDuration = computed(() => cfg.value.testDuration || 10)
const parallelStreams = computed(() => cfg.value.parallelStreams || 4)

const running = ref(false)
const phase = ref<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle')
const phaseLabel = computed(() => {
  switch (phase.value) {
    case 'ping': return 'Testing ping...'
    case 'download': return 'Testing download...'
    case 'upload': return 'Testing upload...'
    case 'done': return 'Test complete'
    default: return 'Ready'
  }
})

const liveSpeed = ref(0)
const result = ref<SpeedtestResult | null>(null)
const lastTested = ref<string>('')
const error = ref<string | null>(null)

const gaugePercent = computed(() => {
  if (!result.value && !running.value) return 0
  const speed = liveSpeed.value
  if (speed <= 0) return 0
  return Math.min(100, (Math.log10(speed + 1) / Math.log10(1000)) * 100)
})

function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`
  if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`
  if (mbps <= 0) return '—'
  return `${(mbps * 1000).toFixed(0)} Kbps`
}

function formatTime(ms: number): string {
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

async function runTest() {
  if (running.value) return
  running.value = true
  error.value = null
  result.value = null
  liveSpeed.value = 0

  try {
    const urls = buildUrls(server.value, customBaseUrl.value)

    phase.value = 'ping'
    const pingResult = await measurePing(urls.ping, 10)

    phase.value = 'download'
    const dlResult = await measureDownload(
      urls.download,
      testDuration.value,
      parallelStreams.value,
      (speed) => { liveSpeed.value = speed }
    )

    liveSpeed.value = 0
    phase.value = 'upload'
    const ulResult = await measureUpload(
      urls.upload,
      testDuration.value,
      parallelStreams.value,
      (speed) => { liveSpeed.value = speed }
    )

    result.value = {
      ping: pingResult,
      download: dlResult,
      upload: ulResult
    }
    lastTested.value = timeAgo(new Date())
    phase.value = 'done'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Test failed'
    phase.value = 'idle'
  } finally {
    running.value = false
    liveSpeed.value = 0
  }
}

onUnmounted(() => {
  running.value = false
})
</script>

<template>
  <div class="speedtest-widget">
    <div class="gauge-area">
      <svg class="gauge" viewBox="0 0 120 80">
        <path
          class="gauge-bg"
          d="M10 70 A50 50 0 0 1 110 70"
          fill="none"
          stroke-width="8"
          stroke-linecap="round"
        />
        <path
          class="gauge-fill"
          d="M10 70 A50 50 0 0 1 110 70"
          fill="none"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="`${gaugePercent * 1.57} 157`"
        />
      </svg>
      <div class="gauge-value">
        <span class="speed-number">{{ running ? formatSpeed(liveSpeed) : (result ? formatSpeed(result.download.speed) : '—') }}</span>
        <span class="phase-label">{{ phaseLabel }}</span>
      </div>
    </div>

    <div v-if="result" class="results">
      <div class="result-row">
        <span class="result-label">Ping</span>
        <span class="result-value">{{ formatTime(result.ping.rtt) }}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Jitter</span>
        <span class="result-value">{{ formatTime(result.ping.jitter) }}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Download</span>
        <span class="result-value highlight-dl">{{ formatSpeed(result.download.speed) }}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Upload</span>
        <span class="result-value highlight-ul">{{ formatSpeed(result.upload.speed) }}</span>
      </div>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>

    <div class="actions">
      <button class="run-btn" :disabled="running" @click="runTest">
        {{ running ? 'Testing...' : 'Run Test' }}
      </button>
    </div>

    <div v-if="lastTested && !running" class="last-tested">
      Last tested: {{ lastTested }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.speedtest-widget {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.gauge-area {
  position: relative;
  width: 180px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gauge {
  width: 180px;
  height: 110px;
}

.gauge-bg {
  stroke: var(--color-border);
}

.gauge-fill {
  stroke: var(--color-primary);
  transition: stroke-dasharray 300ms ease;
}

.gauge-value {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.speed-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.phase-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.results {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.625rem;
  background-color: var(--color-bg-elevated);
  border-radius: 6px;
}

.result-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.result-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.highlight-dl {
  color: #22c55e;
}

.highlight-ul {
  color: #3b82f6;
}

.error-msg {
  color: var(--color-danger);
  font-size: 0.8125rem;
  text-align: center;
}

.actions {
  width: 100%;
}

.run-btn {
  width: 100%;
  padding: 0.625rem 1rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms ease;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.last-tested {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
