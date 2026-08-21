<template>
  <div class="public-ip-settings-form">
    <div class="form-group">
      <label for="provider">Provider</label>
      <select id="provider" v-model="provider">
        <option value="ipinfo">IPInfo (default)</option>
        <option value="freeipapi">FreeIPAPI</option>
        <option value="ipquery">IPQuery</option>
        <option value="ip-api">IP-API.com</option>
        <option value="ipgeolocation">IPGeolocation</option>
      </select>
    </div>

    <div class="form-group">
      <label>
        <input type="checkbox" id="useProxy" v-model="useProxy" />
        <span>Use Proxy (server-side lookup)</span>
      </label>
    </div>

    <div class="form-group">
      <label>
        <input type="checkbox" id="hideLocation" v-model="hideLocation" />
        <span>Hide Location Information</span>
      </label>
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

// Computed from config
const provider = computed({
  get: () => props.config?.['provider'] as string || 'ipinfo',
  set: (val: string) => updateConfig({ provider: val })
})

const useProxy = computed({
  get: () => props.config?.['useProxy'] === true,
  set: (val: boolean) => updateConfig({ useProxy: val })
})

const hideLocation = computed({
  get: () => props.config?.['hideLocation'] === true,
  set: (val: boolean) => updateConfig({ hideLocation: val })
})
</script>

<style scoped>
.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 12px; color: var(--color-text-muted); }
select {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
}
select:focus { outline: none; border-color: var(--color-primary); }
</style>