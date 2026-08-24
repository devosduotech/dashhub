<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { CalendarWidgetConfig } from '@/types/config'
import {
  fetchEvents, createEvent, deleteEvent,
  formatEventDate, getMonthDays, type CalDAVEvent
} from '@/services/caldav'
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

const selectedDay = ref<Date | null>(null)
const showAddForm = ref(false)
const adding = ref(false)
const deleting = ref<string | null>(null)
const formSummary = ref('')
const formDescription = ref('')
const formLocation = ref('')
const formStartDate = ref('')
const formStartTime = ref('')
const formEndDate = ref('')
const formEndTime = ref('')
const formError = ref<string | null>(null)

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

const selectedDayEvents = computed(() => {
  if (!selectedDay.value) return []
  const dayStr = selectedDay.value.toDateString()
  return events.value.filter(e => e.start && new Date(e.start).toDateString() === dayStr)
})

function hasEvent(date: Date): boolean {
  return eventDates.value.has(date.toDateString())
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else { viewMonth.value-- }
  selectedDay.value = null
  loadEvents()
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else { viewMonth.value++ }
  selectedDay.value = null
  loadEvents()
}

function goToday() {
  viewYear.value = new Date().getFullYear()
  viewMonth.value = new Date().getMonth()
  selectedDay.value = null
  loadEvents()
}

function selectDay(date: Date) {
  if (selectedDay.value && selectedDay.value.toDateString() === date.toDateString()) {
    selectedDay.value = null
  } else {
    selectedDay.value = date
    showAddForm.value = false
    resetForm()
  }
}

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function openAddForm() {
  if (!selectedDay.value) return
  resetForm()
  const d = selectedDay.value
  formStartDate.value = toLocalDateStr(d)
  formEndDate.value = toLocalDateStr(d)
  formStartTime.value = '09:00'
  formEndTime.value = '10:00'
  showAddForm.value = true
}

function resetForm() {
  formSummary.value = ''
  formDescription.value = ''
  formLocation.value = ''
  formStartDate.value = ''
  formStartTime.value = ''
  formEndDate.value = ''
  formEndTime.value = ''
  formError.value = null
}

async function submitEvent() {
  if (!formSummary.value.trim() || !formStartDate.value || !formStartTime.value || !formEndDate.value || !formEndTime.value) {
    formError.value = 'Title, date, and time are required'
    return
  }
  if (!cfg.value.serverUrl || !cfg.value.username || !cfg.value.password || !cfg.value.calendarUrl) {
    formError.value = 'CalDAV not configured. Open widget settings first.'
    return
  }
  adding.value = true
  formError.value = null
  try {
    const start = new Date(`${formStartDate.value}T${formStartTime.value}`)
    const end = new Date(`${formEndDate.value}T${formEndTime.value}`)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      formError.value = 'Invalid date or time'
      return
    }
    if (end <= start) {
      formError.value = 'End time must be after start time'
      return
    }
    console.log('[calendar] creating event:', {
      baseUrl: cfg.value.serverUrl,
      username: cfg.value.username,
      calendarUrl: cfg.value.calendarUrl,
      summary: formSummary.value.trim(),
      start: start.toISOString(),
      end: end.toISOString()
    })
    await createEvent(
      cfg.value.serverUrl,
      cfg.value.username,
      cfg.value.password,
      cfg.value.calendarUrl,
      {
        summary: formSummary.value.trim(),
        description: formDescription.value.trim(),
        location: formLocation.value.trim(),
        start,
        end
      }
    )
    showAddForm.value = false
    resetForm()
    await loadEvents()
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Failed to create event'
  } finally {
    adding.value = false
  }
}

async function handleDeleteEvent(uid: string) {
  deleting.value = uid
  try {
    await deleteEvent(
      cfg.value.serverUrl,
      cfg.value.username,
      cfg.value.password,
      cfg.value.calendarUrl,
      uid
    )
    await loadEvents()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete event'
  } finally {
    deleting.value = null
  }
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
      <!-- Upcoming view -->
      <div v-if="cfg.displayMode === 'upcoming'" class="upcoming-view">
        <div v-if="loading && events.length === 0" class="loading-state">
          <AppIcon name="spinner" :size="18" />
        </div>
        <div v-else-if="error" class="error-state">{{ error }}</div>
        <div v-else-if="upcomingEvents.length === 0" class="no-events">No upcoming events</div>
        <div v-else class="event-list">
          <div v-for="ev in upcomingEvents" :key="ev.uid" class="event-item">
            <div class="event-item-content">
              <div v-if="ev.start" class="event-time">{{ formatEventDate(ev.start, ev.allDay) }}</div>
              <div class="event-summary">{{ ev.summary }}</div>
              <div v-if="ev.location" class="event-location">{{ ev.location }}</div>
            </div>
            <button
              class="event-delete-btn"
              title="Delete event"
              :disabled="deleting === ev.uid"
              @click="handleDeleteEvent(ev.uid)"
            >
              <AppIcon :name="deleting === ev.uid ? 'spinner' : 'trash'" :size="12" />
            </button>
          </div>
        </div>
      </div>

      <!-- Month view -->
      <div v-else class="month-view">
        <div class="month-nav">
          <button class="nav-btn prev" @click="prevMonth"><AppIcon name="chevron-right" :size="14" /></button>
          <span class="month-label" @click="goToday">{{ monthLabel }}</span>
          <button class="nav-btn next" @click="nextMonth"><AppIcon name="chevron-right" :size="14" /></button>
          <button v-if="cfg.serverUrl" class="refresh-btn-inline" :disabled="loading" @click="loadEvents">
            <AppIcon name="refresh" :size="14" />
          </button>
        </div>
        <div class="weekday-row">
          <span v-for="d in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="d" class="weekday">{{ d }}</span>
        </div>
        <div class="days-grid">
          <span
            v-for="(day, i) in monthDays"
            :key="i"
            class="day-cell"
            :class="{
              'out-month': !day.inMonth,
              'today': day.date.toDateString() === new Date().toDateString(),
              'has-event': hasEvent(day.date),
              'selected': selectedDay && day.date.toDateString() === selectedDay.toDateString()
            }"
            @click="day.inMonth && selectDay(day.date)"
          >{{ day.date.getDate() }}</span>
        </div>

        <!-- Selected day panel -->
        <div v-if="selectedDay" class="day-panel">
          <div class="day-panel-header">
            <span class="day-panel-title">{{ selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) }}</span>
            <button class="add-event-btn" @click="openAddForm">
              <AppIcon name="plus" :size="12" /> Add Event
            </button>
          </div>

          <!-- Add event form -->
          <div v-if="showAddForm" class="add-event-form">
            <input v-model="formSummary" class="form-input" placeholder="Event title" maxlength="200" />
            <div class="form-row">
              <input v-model="formStartDate" type="date" class="form-input form-date" />
              <input v-model="formStartTime" type="time" class="form-input form-time" />
            </div>
            <div class="form-row">
              <input v-model="formEndDate" type="date" class="form-input form-date" />
              <input v-model="formEndTime" type="time" class="form-input form-time" />
            </div>
            <input v-model="formLocation" class="form-input" placeholder="Location (optional)" maxlength="200" />
            <textarea v-model="formDescription" class="form-input form-textarea" placeholder="Description (optional)" rows="2" maxlength="1000"></textarea>
            <div v-if="formError" class="form-error">{{ formError }}</div>
            <div class="form-actions">
              <button class="form-btn cancel" @click="showAddForm = false; resetForm()">Cancel</button>
              <button class="form-btn submit" :disabled="adding" @click="submitEvent">
                {{ adding ? 'Creating...' : 'Create' }}
              </button>
            </div>
          </div>

          <!-- Events for selected day -->
          <div v-else-if="selectedDayEvents.length > 0" class="day-events">
            <div v-for="ev in selectedDayEvents" :key="ev.uid" class="day-event-item">
              <div class="day-event-content">
                <div v-if="ev.start" class="day-event-time">{{ formatEventDate(ev.start, ev.allDay) }}</div>
                <div class="day-event-summary">{{ ev.summary }}</div>
                <div v-if="ev.location" class="day-event-location">{{ ev.location }}</div>
              </div>
              <button
                class="event-delete-btn"
                title="Delete event"
                :disabled="deleting === ev.uid"
                @click="handleDeleteEvent(ev.uid)"
              >
                <AppIcon :name="deleting === ev.uid ? 'spinner' : 'trash'" :size="12" />
              </button>
            </div>
          </div>
          <div v-else class="no-day-events">No events on this day</div>
        </div>
      </div>
    </template>
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
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  background-color: var(--color-bg-elevated);
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
}

.event-item-content { flex: 1; min-width: 0; }
.event-time { font-size: 0.6875rem; color: var(--color-primary); font-weight: 500; }
.event-summary { font-size: 0.8125rem; font-weight: 600; color: var(--color-text); margin-top: 0.125rem; }
.event-location { font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 0.125rem; }

.event-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  border-radius: 4px;
  color: var(--color-text-dim);
  cursor: pointer;
  flex-shrink: 0;
  &:hover { color: var(--color-danger); background-color: rgba(239, 68, 68, 0.1); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  gap: 0.25rem;
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
  &.prev { transform: scaleX(-1); }
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
  cursor: default;
  &.out-month { color: var(--color-text-dim); }
  &:not(.out-month) { cursor: pointer; }
  &:not(.out-month):hover { background-color: var(--color-bg-hover); }
  &.today { background-color: var(--color-primary); color: white; font-weight: 700; }
  &.selected:not(.today) { background-color: var(--color-primary-dim); color: var(--color-primary); font-weight: 600; }
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

.day-panel {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.day-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.day-panel-title { font-size: 0.8125rem; font-weight: 600; color: var(--color-text); }

.add-event-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
  &:hover { background-color: var(--color-primary-hover); }
}

.day-events { display: flex; flex-direction: column; gap: 0.375rem; }

.day-event-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background-color: var(--color-bg-elevated);
  border-radius: 4px;
  border-left: 2px solid var(--color-primary);
}

.day-event-content { flex: 1; min-width: 0; }
.day-event-time { font-size: 0.625rem; color: var(--color-primary); font-weight: 500; }
.day-event-summary { font-size: 0.75rem; font-weight: 600; color: var(--color-text); }
.day-event-location { font-size: 0.625rem; color: var(--color-text-muted); }

.no-day-events {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.5rem;
}

.add-event-form {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.5rem;
  background-color: var(--color-bg-elevated);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.form-row {
  display: flex;
  gap: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.75rem;
  font-family: inherit;
  &:focus { border-color: var(--color-primary); outline: none; }
}

.form-date { flex: 1; }
.form-time { flex: 1; }
.form-textarea { resize: vertical; min-height: 2.5rem; }

.form-error { font-size: 0.6875rem; color: var(--color-danger); }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.375rem;
  margin-top: 0.25rem;
}

.form-btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  &.cancel {
    background: none;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    &:hover { background-color: var(--color-bg-hover); }
  }
  &.submit {
    background-color: var(--color-primary);
    color: white;
    &:hover { background-color: var(--color-primary-hover); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

.refresh-btn-inline {
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
  margin-left: auto;
  &:hover:not(:disabled) { background-color: var(--color-bg-hover); color: var(--color-text); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
