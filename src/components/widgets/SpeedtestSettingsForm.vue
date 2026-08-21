<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SpeedtestWidgetConfig, SpeedtestServer } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'update', config: Record<string, unknown>): void }>()

const cfg = computed(() => props.config as SpeedtestWidgetConfig)

const server = ref<SpeedtestServer>(cfg.value.server || 'cloudflare')
const customBaseUrl = ref(cfg.value.customBaseUrl || '')
const testDuration = ref(cfg.value.testDuration || 10)
const parallelStreams = ref(cfg.value.parallelStreams || 4)

function update(updates: Partial<SpeedtestWidgetConfig>) {
  emit('update', { ...cfg.value, ...updates })
}

const servers: Array<{ value: SpeedtestServer; label: string; group: string }> = [
  { value: 'cloudflare', label: 'Cloudflare (Global)', group: 'Public Servers' },
  { value: 'dashhub', label: 'DashHub Server (Self)', group: 'Self-Hosted' },
  { value: 'custom', label: 'Custom URL (LibreSpeed / Other)', group: 'Custom' }
]

const groupedServers = computed(() => {
  const groups: Record<string, typeof servers> = {}
  for (const s of servers) {
    if (!groups[s.group]) groups[s.group] = []
    groups[s.group].push(s)
  }
  return groups
})

function onServerChange(val: string) {
  server.value = val as SpeedtestServer
  update({ server: server.value })
}

function onCustomUrlChange() {
  update({ customBaseUrl: customBaseUrl.value })
}

function onDurationChange(val: string) {
  testDuration.value = parseInt(val)
  update({ testDuration: testDuration.value })
}

function onStreamsChange(val: string) {
  parallelStreams.value = parseInt(val)
  update({ parallelStreams: parallelStreams.value })
}
</script>

<template>
  <div class="speedtest-settings">
    <div class="form-group">
      <label class="form-label">Test Server</label>
      <select
        class="form-select"
        :value="server"
        @change="onServerChange(($event.target as HTMLSelectElement).value)"
      >
        <optgroup v-for="(items, group) in groupedServers" :key="group" :label="group">
          <option v-for="s in items" :key="s.value" :value="s.value">
            {{ s.label }}
          </option>
        </optgroup>
      </select>
    </div>

    <div v-if="server === 'custom'" class="form-group">
      <label class="form-label">Base URL</label>
      <input
        class="form-input"
        type="url"
        :value="customBaseUrl"
        placeholder="https://example.com/speedtest"
        @input="customBaseUrl = ($event.target as HTMLInputElement).value; onCustomUrlChange()"
      />
      <p class="form-hint">
        Enter any speedtest server base URL. Supports Cloudflare (/__down, /__up, /__ping) and
        LibreSpeed (/garbage.php, /empty.php) protocols. Auto-detected.
      </p>
    </div>

    <div class="form-row">
      <div class="form-group form-group-half">
        <label class="form-label">Test Duration</label>
        <select
          class="form-select"
          :value="testDuration"
          @change="onDurationChange(($event.target as HTMLSelectElement).value)"
        >
          <option :value="5">5 seconds</option>
          <option :value="10">10 seconds</option>
          <option :value="15">15 seconds</option>
        </select>
      </div>

      <div class="form-group form-group-half">
        <label class="form-label">Parallel Streams</label>
        <select
          class="form-select"
          :value="parallelStreams"
          @change="onStreamsChange(($event.target as HTMLSelectElement).value)"
        >
          <option :value="1">1 stream</option>
          <option :value="2">2 streams</option>
          <option :value="4">4 streams</option>
        </select>
      </div>
    </div>

    <p class="form-hint">
      Longer duration and more streams give more accurate results but take more time.
    </p>
  </div>
</template>

<style scoped lang="scss">
.speedtest-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group-half {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.form-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}
</style>
