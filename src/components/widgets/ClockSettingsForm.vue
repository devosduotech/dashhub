<template>
  <div class="clock-settings-form">
    <div class="form-group">
      <label for="timeZone">Time Zone</label>
      <select id="timeZone" v-model="timeZone">
        <optgroup label="Local">
          <option value="">Local</option>
        </optgroup>
        <optgroup label="UTC">
          <option value="UTC">UTC</option>
        </optgroup>
        <optgroup v-for="(zones, region) in groupedTimezones" :key="region" :label="region">
          <option v-for="tz in zones" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
        </optgroup>
      </select>
    </div>

    <div class="form-group">
      <label for="format">Format</label>
      <select id="format" v-model="format">
        <option value="">Default</option>
        <option value="HH:mm:ss">HH:mm:ss</option>
        <option value="HH:mm">HH:mm</option>
        <option value="h:mm:ss A">h:mm:ss A</option>
        <option value="h:mm A">h:mm A</option>
      </select>
    </div>

    <div class="form-group row">
      <div class="checkbox-wrapper">
        <input type="checkbox" id="hideDate" v-model="hideDate" />
        <label for="hideDate">Hide Date</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="hideSeconds" v-model="hideSeconds" />
        <label for="hideSeconds">Hide Seconds</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="use12Hour" v-model="use12Hour" />
        <label for="use12Hour">12-hour Format</label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

const props = defineProps<{
  config: Record<string, unknown>
}>()

function updateConfig(newConfig: Record<string, unknown>) {
  emit('update', { ...props.config, ...newConfig })
}

const timeZone = computed({
  get: () => props.config?.['timeZone'] as string || '',
  set: (val: string) => updateConfig({ timeZone: val })
})

const format = computed({
  get: () => props.config?.['format'] as string || '',
  set: (val: string) => updateConfig({ format: val })
})

const hideDate = computed({
  get: () => props.config?.['hideDate'] === true,
  set: (val: boolean) => updateConfig({ hideDate: val })
})

const hideSeconds = computed({
  get: () => props.config?.['hideSeconds'] === true,
  set: (val: boolean) => updateConfig({ hideSeconds: val })
})

const use12Hour = computed({
  get: () => props.config?.['use12Hour'] === true,
  set: (val: boolean) => updateConfig({ use12Hour: val })
})

const timezoneData: Record<string, Array<{ value: string; label: string }>> = {
  'Africa': [
    { value: 'Africa/Cairo', label: 'Cairo (EET, UTC+2)' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST, UTC+2)' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT, UTC+1)' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT, UTC+3)' },
  ],
  'Americas': [
    { value: 'America/Anchorage', label: 'Anchorage (AKST, UTC-9)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART, UTC-3)' },
    { value: 'America/Bogota', label: 'Bogota (COT, UTC-5)' },
    { value: 'America/Caracas', label: 'Caracas (VET, UTC-4)' },
    { value: 'America/Chicago', label: 'Chicago (CST, UTC-6)' },
    { value: 'America/Denver', label: 'Denver (MST, UTC-7)' },
    { value: 'America/La_Paz', label: 'La Paz (BOT, UTC-4)' },
    { value: 'America/Lima', label: 'Lima (PET, UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST, UTC-8)' },
    { value: 'America/Mexico_City', label: 'Mexico City (CST, UTC-6)' },
    { value: 'America/New_York', label: 'New York (EST, UTC-5)' },
    { value: 'America/Phoenix', label: 'Phoenix (MST, UTC-7)' },
    { value: 'America/Santiago', label: 'Santiago (CLT, UTC-4)' },
    { value: 'America/Sao_Paulo', label: 'Sao Paulo (BRT, UTC-3)' },
    { value: 'America/Toronto', label: 'Toronto (EST, UTC-5)' },
    { value: 'America/Vancouver', label: 'Vancouver (PST, UTC-8)' },
  ],
  'Asia': [
    { value: 'Asia/Bangkok', label: 'Bangkok (ICT, UTC+7)' },
    { value: 'Asia/Colombo', label: 'Colombo (IST, UTC+5:30)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT, UTC+8)' },
    { value: 'Asia/Jakarta', label: 'Jakarta (WIB, UTC+7)' },
    { value: 'Asia/Karachi', label: 'Karachi (PKT, UTC+5)' },
    { value: 'Asia/Kathmandu', label: 'Kathmandu (NPT, UTC+5:45)' },
    { value: 'Asia/Kolkata', label: 'Kolkata (IST, UTC+5:30)' },
    { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (MYT, UTC+8)' },
    { value: 'Asia/Manila', label: 'Manila (PHT, UTC+8)' },
    { value: 'Asia/Riyadh', label: 'Riyadh (AST, UTC+3)' },
    { value: 'Asia/Seoul', label: 'Seoul (KST, UTC+9)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST, UTC+8)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8)' },
    { value: 'Asia/Taipei', label: 'Taipei (CST, UTC+8)' },
    { value: 'Asia/Tehran', label: 'Tehran (IRST, UTC+3:30)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST, UTC+9)' },
  ],
  'Atlantic': [
    { value: 'Atlantic/Reykjavik', label: 'Reykjavik (GMT, UTC+0)' },
  ],
  'Australia': [
    { value: 'Australia/Adelaide', label: 'Adelaide (ACST, UTC+9:30)' },
    { value: 'Australia/Brisbane', label: 'Brisbane (AEST, UTC+10)' },
    { value: 'Australia/Darwin', label: 'Darwin (ACST, UTC+9:30)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST, UTC+10)' },
    { value: 'Australia/Perth', label: 'Perth (AWST, UTC+8)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST, UTC+10)' },
  ],
  'Europe': [
    { value: 'Europe/Amsterdam', label: 'Amsterdam (CET, UTC+1)' },
    { value: 'Europe/Athens', label: 'Athens (EET, UTC+2)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET, UTC+1)' },
    { value: 'Europe/Brussels', label: 'Brussels (CET, UTC+1)' },
    { value: 'Europe/Bucharest', label: 'Bucharest (EET, UTC+2)' },
    { value: 'Europe/Budapest', label: 'Budapest (CET, UTC+1)' },
    { value: 'Europe/Copenhagen', label: 'Copenhagen (CET, UTC+1)' },
    { value: 'Europe/Dublin', label: 'Dublin (GMT, UTC+0)' },
    { value: 'Europe/Helsinki', label: 'Helsinki (EET, UTC+2)' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT, UTC+3)' },
    { value: 'Europe/Lisbon', label: 'Lisbon (WET, UTC+0)' },
    { value: 'Europe/London', label: 'London (GMT, UTC+0)' },
    { value: 'Europe/Madrid', label: 'Madrid (CET, UTC+1)' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK, UTC+3)' },
    { value: 'Europe/Oslo', label: 'Oslo (CET, UTC+1)' },
    { value: 'Europe/Paris', label: 'Paris (CET, UTC+1)' },
    { value: 'Europe/Prague', label: 'Prague (CET, UTC+1)' },
    { value: 'Europe/Rome', label: 'Rome (CET, UTC+1)' },
    { value: 'Europe/Stockholm', label: 'Stockholm (CET, UTC+1)' },
    { value: 'Europe/Vienna', label: 'Vienna (CET, UTC+1)' },
    { value: 'Europe/Warsaw', label: 'Warsaw (CET, UTC+1)' },
    { value: 'Europe/Zurich', label: 'Zurich (CET, UTC+1)' },
  ],
  'Pacific': [
    { value: 'Pacific/Auckland', label: 'Auckland (NZST, UTC+12)' },
    { value: 'Pacific/Fiji', label: 'Fiji (FJT, UTC+12)' },
    { value: 'Pacific/Guam', label: 'Guam (ChST, UTC+10)' },
    { value: 'Pacific/Honolulu', label: 'Honolulu (HST, UTC-10)' },
    { value: 'Pacific/Noumea', label: 'Noumea (NCT, UTC+11)' },
    { value: 'Pacific/Pago_Pago', label: 'Pago Pago (SST, UTC-11)' },
    { value: 'Pacific/Tongatapu', label: 'Tongatapu (TOT, UTC+13)' },
  ],
}

const groupedTimezones = computed(() => timezoneData)
</script>

<style scoped>
.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 12px; color: var(--color-text-muted); }
.form-group.row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.checkbox-wrapper { display: flex; align-items: center; gap: 4px; }
select, input[type="checkbox"] {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
}
select:focus { outline: none; border-color: var(--color-primary); }
</style>
