<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UptimeWidgetConfig } from '@/types/config'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'update', config: Record<string, unknown>): void }>()

const cfg = computed(() => props.config as UptimeWidgetConfig)

const endpoints = ref(JSON.parse(JSON.stringify(cfg.value.endpoints || [])))
const checkInterval = ref(cfg.value.checkInterval || 300)

function update(updates: Partial<UptimeWidgetConfig>) {
  emit('update', { ...cfg.value, ...updates })
}

function addEndpoint() {
  endpoints.value.push({ id: crypto.randomUUID(), name: '', url: '' })
}

function removeEndpoint(index: number) {
  endpoints.value.splice(index, 1)
  update({ endpoints: endpoints.value })
}

function onEndpointChange() {
  update({ endpoints: endpoints.value })
}

function onIntervalChange(val: string) {
  checkInterval.value = parseInt(val) as 60 | 300 | 900 | 1800
  update({ checkInterval: checkInterval.value })
}
</script>

<template>
  <div class="uptime-settings">
    <div class="form-group">
      <label class="form-label">Check Interval</label>
      <select
        class="form-select"
        :value="checkInterval"
        @change="onIntervalChange(($event.target as HTMLSelectElement).value)"
      >
        <option :value="60">Every 1 minute</option>
        <option :value="300">Every 5 minutes</option>
        <option :value="900">Every 15 minutes</option>
        <option :value="1800">Every 30 minutes</option>
      </select>
    </div>

    <div class="form-group">
      <div class="form-label-row">
        <label class="form-label">Endpoints</label>
        <button class="add-btn" @click="addEndpoint">
          <AppIcon name="plus" :size="14" /> Add
        </button>
      </div>

      <div v-if="endpoints.length === 0" class="empty-endpoints">
        No endpoints configured. Click "Add" to monitor a URL.
      </div>

      <div v-for="(ep, i) in endpoints" :key="ep.id" class="endpoint-form">
        <div class="endpoint-fields">
          <input
            class="form-input"
            type="text"
            :value="ep.name"
            placeholder="Name (e.g., My Website)"
            @input="ep.name = ($event.target as HTMLInputElement).value; onEndpointChange()"
          />
          <input
            class="form-input"
            type="url"
            :value="ep.url"
            placeholder="https://example.com"
            @input="ep.url = ($event.target as HTMLInputElement).value; onEndpointChange()"
          />
        </div>
        <button class="remove-btn" @click="removeEndpoint(i)">
          <AppIcon name="trash" :size="14" />
        </button>
      </div>
    </div>

    <p class="form-hint">
      History is retained for 7 days. Endpoints are checked server-side to avoid CORS issues.
    </p>
  </div>
</template>

<style scoped lang="scss">
.uptime-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-primary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-primary);
  }
}

.empty-endpoints {
  padding: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  border-radius: 6px;
}

.endpoint-form {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.endpoint-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    border-color: var(--color-danger, #ef4444);
    color: var(--color-danger, #ef4444);
  }
}
</style>
