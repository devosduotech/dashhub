<template>
  <div class="clock-widget" :class="{ 'hide-date': hideDate }">
    <div class="clock-time">
      {{ formattedTime }}
    </div>
    <div v-if="!hideDate" class="clock-date">
      {{ formattedDate }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

// Config defaults
const timeZone = computed(() => props.config?.['timeZone'] as string || '')
const hideDate = computed(() => props.config?.['hideDate'] === true)
const hideSeconds = computed(() => props.config?.['hideSeconds'] === true)
const use12Hour = computed(() => props.config?.['use12Hour'] === true)
const format = computed(() => props.config?.['format'] as string || '')

function getDisplayDate(): Date {
  if (timeZone.value) {
    try {
      const str = new Date().toLocaleString('en-US', { timeZone: timeZone.value })
      const d = new Date(str)
      if (!isNaN(d.getTime())) return d
    } catch { /* ignore */ }
  }
  return new Date()
}

function formatTime(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  const hh24 = String(h).padStart(2, '0')
  const h12 = h % 12 || 12
  const suffix = h >= 12 ? 'PM' : 'AM'

  switch (format.value) {
    case 'HH:mm:ss': return `${hh24}:${mm}:${ss}`
    case 'HH:mm': return `${hh24}:${mm}`
    case 'h:mm:ss A': return `${h12}:${mm}:${ss} ${suffix}`
    case 'h:mm A': return `${h12}:${mm} ${suffix}`
  }

  if (use12Hour.value) {
    if (hideSeconds.value) return `${h12}:${mm} ${suffix}`
    return `${h12}:${mm}:${ss} ${suffix}`
  }
  if (hideSeconds.value) return `${hh24}:${mm}`
  return `${hh24}:${mm}:${ss}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formattedTime = computed(() => { void tick.value; return formatTime(getDisplayDate()) })
const formattedDate = computed(() => { void tick.value; return formatDate(getDisplayDate()) })

const tick = ref(0)
let _timer: ReturnType<typeof setInterval> | undefined
const bump = () => { tick.value++ }

onMounted(() => { _timer = setInterval(bump, 1000) })
onUnmounted(() => { clearInterval(_timer) })
</script>

<style scoped>
.clock-widget {
  font-family: inherit;
  text-align: center;
  padding: 10px;
  background: var(--widget-bg-color, var(--bg-color));
  border-radius: 4px;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.clock-time {
  font-size: 24px;
  font-weight: bold;
  color: var(--widget-text-color, var(--text-color));
}

.clock-date {
  font-size: 12px;
  color: var(--widget-text-color-muted, var(--text-color));
  margin-top: 4px;
}
</style>