<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { CalendarWidgetConfig } from '@/types/config'
import { fetchEvents, formatEventDate, getMonthDays, type CalDAVEvent } from '@/services/caldav'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const cfg = computed(() => props.config as CalendarWidgetConfig)

const loading = ref(false)
const error = ref<string | null>(null)
const events = ref<CalDAVEvent[]>([])
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
let refreshTimer: ReturnType<typeof setInterval> | null = null

const monthLabel = computed(() => {
  return new Date(viewYear.value, viewMonth.value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const upcomingEvents = computed(() => {
  const now = new Date()
  return events.value
    .filter(e => e.start && new Date(e.start) >= now)
    .slice(0, cfg.value.eventCount || 10)
})

const monthDays = computed(() => getMonthDays(viewYear.value, viewMonth.value))

const eventDates = computed(() => {
  const set = new Set<string>()
  for (const e of events.value) {
    if (e.start) {
      set.add(new Date(e.start).toDateString())
    }
  }
  return set
})

function hasEvent(date: Date): boolean {
  return eventDates.value.has(date.toDateString())
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else { viewMonth.value-- }
  loadEvents()
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else { viewMonth.value++ }
  loadEvents()
}

function goToday() {
  viewYear.value = new Date().getFullYear()
  viewMonth.value = new Date().getMonth()
  loadEvents()
}

async function loadEvents() {
  if (!cfg.value.serverUrl || !cfg.value.calendarUrl) return
  loading.value = true
  error.value = null
  try {
    const start = new Date(viewYear.value, viewMonth.value, 1)
    const end = new Date(viewYear.value, viewMonth.value + 1, 0, 23, 59, 59)
    events.value = await fetchEvents(
      cfg.value.serverUrl,
      cfg.value.username,
      cfg.value.password,
      cfg.value.calendarUrl,
      start,
      end
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load events'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEvents()
  refreshTimer = setInterval(loadEvents, (cfg.value.refreshInterval || 15) * 60 * 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="calendar-widget">
    <div v-if="!cfg.serverUrl || !cfg.calendarUrl" class="empty-state">
      <AppIcon name="calendar" :size="32" class="empty-icon" />
      <p>Configure CalDAV connection in settings</p>
    </div>

    <template v-else>
      <div v-if="cfg.displayMode === 'upcoming'" class="upcoming-view">
        <div v-if="loading && events.length === 0" class="loading-state">
          <AppIcon name="spinner" :size="18" />
        </div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else-if="upcomingEvents.length === 0" class="no-events">No upcoming events</div>
        <div v-else class="event-list">
          <div v-for="ev in upcomingEvents" :key="ev.uid" class="event-item">
            <div v-if="ev.start" class="event-time">{{ formatEventDate(ev.start, ev.allDay) }}</div>
            <div class="event-summary">{{ ev.summary }}</div>
            <div v-if="ev.location" class="event-location">{{ ev.location }}</div>
          </div>
        </div>
      </div>

      <div v-else class="month-view">
        <div class="month-nav">
          <button class="nav-btn" @click="prevMonth"><AppIcon name="chevron-right" :size="14" /></button>
          <span class="month-label" @click="goToday">{{ monthLabel }}</span>
          <button class="nav-btn next" @click="nextMonth"><AppIcon name="chevron-right" :size="14" /></button>
        </div>
        <div class="weekday-row">
          <span v-for="d in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="d" class="weekday">{{ d }}</span>
        </div>
        <div class="days-grid">
          <span
            v-for="(day, i) in monthDays"
            :key="i"
            class="day-cell"
            :class="{ 'out-month': !day.inMonth, 'today': day.date.toDateString() === new Date().toDateString(), 'has-event': hasEvent(day.date) }"
          >{{ day.date.getDate() }}</span>
        </div>
      </div>
    </template>

    <button v-if="cfg.serverUrl" class="refresh-btn" :disabled="loading" @click="loadEvents">
      <AppIcon name="refresh" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.calendar-widget { padding: 1rem; position: relative; }

.empty-state, .loading-state, .error-state, .no-events {
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

.event-list { display: flex; flex-direction: column; gap: 0.5rem; }

.event-item {
  padding: 0.5rem 0.625rem;
  background-color: var(--color-bg-elevated);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
}

.event-time { font-size: 0.6875rem; color: var(--color-primary); font-weight: 500; }
.event-summary { font-size: 0.8125rem; font-weight: 600; color: var(--color-text); margin-top: 0.125rem; }
.event-location { font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 0.125rem; }

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.month-label { font-size: 0.875rem; font-weight: 600; color: var(--color-text); cursor: pointer; }
.month-label:hover { color: var(--color-primary); }

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); color: var(--color-text); }
  &.next { transform: rotate(0deg); }
}

.weekday-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; margin-bottom: 0.25rem; }
.weekday { font-size: 0.625rem; text-align: center; color: var(--color-text-muted); font-weight: 600; padding: 0.25rem 0; }

.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }

.day-cell {
  text-align: center;
  font-size: 0.6875rem;
  padding: 0.25rem;
  border-radius: 4px;
  color: var(--color-text);
  position: relative;
  &.out-month { color: var(--color-text-dim); }
  &.today { background-color: var(--color-primary); color: white; font-weight: 700; }
  &.has-event:not(.today)::after {
    content: '';
    position: absolute;
    bottom: 1px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--color-primary);
  }
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
  &:hover:not(:disabled) { background-color: var(--color-bg-hover); color: var(--color-text); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
