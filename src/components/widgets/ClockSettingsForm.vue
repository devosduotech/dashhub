<template>
  <div class="clock-settings-form">
    <div class="form-group">
      <label for="timeZone">Time Zone</label>
      <select id="timeZone" v-model="timeZone">
        <option value="">Local</option>
        <option value="Europe/London">Europe/London</option>
        <option value="America/New_York">America/New_York</option>
        <option value="Asia/Tokyo">Asia/Tokyo</option>
        <option value="UTC">UTC</option>
      </select>
    </div>

    <div class="form-group">
      <label for="format">Format</label>
      <select id="format" v-model="format">
        <option value="">Default</option>
        <option value="HH:mm:ss A">12-hour (HH:mm:ss A)</option>
        <option value="HH:mm:ss">24-hour (HH:mm:ss)</option>
        <option value="h:mm a">12-hour (h:mm a)</option>
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
  'update:config': [config: Record<string, unknown>]
}>()

const props = defineProps<{
  config: Record<string, unknown>
}>()

// Emit updated config
function updateConfig(newConfig: Record<string, unknown>) {
  emit('update:config', { ...props.config, ...newConfig })
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
</script>

<style scoped>
.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--widget-text-color-secondary, var(--text-color));
}

.form-group.row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

select {
  padding: 4px 8px;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 4px;
  background-color: var(--input-bg-color, #fff);
  color: var(--input-text-color, var(--text-color));
}
</style>