<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CalendarWidgetConfig } from '@/types/config'
import { discoverCalendars, type CalDAVCalendar } from '@/services/caldav'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'update', config: Record<string, unknown>): void }>()

const cfg = computed(() => props.config as CalendarWidgetConfig)

const serverUrl = ref(cfg.value.serverUrl || '')
const username = ref(cfg.value.username || '')
const password = ref(cfg.value.password || '')
const calendarUrl = ref(cfg.value.calendarUrl || '')
const displayName = ref(cfg.value.displayName || '')
const displayMode = ref(cfg.value.displayMode || 'upcoming')
const eventCount = ref(cfg.value.eventCount || 10)
const refreshInterval = ref(cfg.value.refreshInterval || 15)

const calendars = ref<CalDAVCalendar[]>([])
const discovering = ref(false)
const discoverError = ref<string | null>(null)
const discoverSuccess = ref(false)

function update(updates: Partial<CalendarWidgetConfig>) {
  emit('update', { ...cfg.value, ...updates })
}

async function onDiscover() {
  if (!serverUrl.value || !username.value || !password.value) return
  discovering.value = true
  discoverError.value = null
  discoverSuccess.value = false
  try {
    calendars.value = await discoverCalendars(serverUrl.value, username.value, password.value)
    discoverSuccess.value = true
    if (calendars.value.length === 1 && !calendarUrl.value) {
      calendarUrl.value = calendars.value[0].url
      displayName.value = calendars.value[0].name
      update({ serverUrl: serverUrl.value, username: username.value, password: password.value, calendarUrl: calendarUrl.value, displayName: displayName.value })
    }
  } catch (err) {
    discoverError.value = err instanceof Error ? err.message : 'Discovery failed'
  } finally {
    discovering.value = false
  }
}

function onCalendarSelect(url: string) {
  const cal = calendars.value.find(c => c.url === url)
  calendarUrl.value = url
  displayName.value = cal?.name || ''
  update({ serverUrl: serverUrl.value, username: username.value, password: password.value, calendarUrl: calendarUrl.value, displayName: displayName.value })
}

function onSave() {
  update({ serverUrl: serverUrl.value, username: username.value, password: password.value, calendarUrl: calendarUrl.value, displayName: displayName.value, displayMode: displayMode.value, eventCount: eventCount.value, refreshInterval: refreshInterval.value })
}

function onDisplayModeChange(val: string) {
  displayMode.value = val as 'upcoming' | 'month'
  onSave()
}

function onEventCountChange(val: string) {
  eventCount.value = parseInt(val)
  onSave()
}

function onRefreshIntervalChange(val: string) {
  refreshInterval.value = parseInt(val)
  onSave()
}
</script>

<template>
  <div class="caldav-settings">
    <div class="form-group">
      <label class="form-label">CalDAV Server URL</label>
      <input
        class="form-input"
        type="url"
        :value="serverUrl"
        placeholder="https://cloud.example.com"
        @input="serverUrl = ($event.target as HTMLInputElement).value"
      />
      <p class="form-hint">e.g., Nextcloud: https://cloud.example.com</p>
    </div>

    <div class="form-row">
      <div class="form-group form-group-half">
        <label class="form-label">Username</label>
        <input class="form-input" type="text" :value="username" placeholder="username" @input="username = ($event.target as HTMLInputElement).value" />
      </div>
      <div class="form-group form-group-half">
        <label class="form-label">Password (App Password)</label>
        <input class="form-input" type="password" :value="password" placeholder="xxxx-xxxx-xxxx-xxxx" @input="password = ($event.target as HTMLInputElement).value" />
      </div>
    </div>

    <button class="discover-btn" :disabled="discovering || !serverUrl || !username || !password" @click="onDiscover">
      <AppIcon v-if="discovering" name="spinner" :size="14" />
      <AppIcon v-else name="search" :size="14" />
      {{ discovering ? 'Discovering...' : 'Discover Calendars' }}
    </button>

    <div v-if="discoverError" class="discover-error">{{ discoverError }}</div>

    <div v-if="calendars.length > 0" class="form-group">
      <label class="form-label">Calendar</label>
      <select class="form-select" :value="calendarUrl" @change="onCalendarSelect(($event.target as HTMLSelectElement).value)">
        <option value="">Select a calendar...</option>
        <option v-for="cal in calendars" :key="cal.url" :value="cal.url">{{ cal.name }}</option>
      </select>
    </div>

    <div class="form-row">
      <div class="form-group form-group-half">
        <label class="form-label">Display Mode</label>
        <select class="form-select" :value="displayMode" @change="onDisplayModeChange(($event.target as HTMLSelectElement).value)">
          <option value="upcoming">Upcoming Events</option>
          <option value="month">Month View</option>
        </select>
      </div>
      <div class="form-group form-group-half">
        <label class="form-label">Event Count</label>
        <select class="form-select" :value="eventCount" @change="onEventCountChange(($event.target as HTMLSelectElement).value)">
          <option :value="5">5 events</option>
          <option :value="10">10 events</option>
          <option :value="15">15 events</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Auto-Refresh Interval</label>
      <select class="form-select" :value="refreshInterval" @change="onRefreshIntervalChange(($event.target as HTMLSelectElement).value)">
        <option :value="5">Every 5 minutes</option>
        <option :value="15">Every 15 minutes</option>
        <option :value="30">Every 30 minutes</option>
        <option :value="60">Every 60 minutes</option>
      </select>
    </div>

    <button v-if="serverUrl && username && password" class="save-btn" @click="onSave">
      Save Configuration
    </button>

    <p class="form-hint">
      For Nextcloud, use an app password (Settings > Security > Create new app password).
      Credentials are sent per-request and never stored on the server.
    </p>
  </div>
</template>

<style scoped lang="scss">
.caldav-settings { display: flex; flex-direction: column; gap: 1rem; }

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

.discover-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  &:hover:not(:disabled) { background-color: var(--color-bg-hover); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.discover-error { font-size: 0.8125rem; color: var(--color-danger); }

.save-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-primary);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  &:hover { background-color: var(--color-primary-hover); }
}
</style>
