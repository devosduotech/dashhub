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
  if (use12Hour.value) {
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    if (hideSeconds.value) return `${h12}:${mm} ${suffix}`
    return `${h12}:${mm}:${ss} ${suffix}`
  }
  const hh = String(h).padStart(2, '0')
  if (hideSeconds.value) return `${hh}:${mm}`
  return `${hh}:${mm}:${ss}`
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