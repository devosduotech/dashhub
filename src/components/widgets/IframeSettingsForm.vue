<script setup lang="ts">
import { computed } from 'vue'
import type { IframeWidgetConfig } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

const cfg = computed(() => props.config as IframeWidgetConfig)

function update(field: string, value: unknown) {
  const newConfig = { ...props.config }
  newConfig[field] = value
  emit('update', newConfig)
}
</script>

<template>
  <div class="iframe-form">
    <div class="form-group">
      <label class="form-label">URL to embed</label>
      <input
        :value="cfg.url || ''"
        type="text"
        class="form-input"
        placeholder="http://grafana.local:3000"
        @input="update('url', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Height (px)</label>
        <input
          :value="cfg.height || 400"
          type="number"
          class="form-input"
          min="200"
          @input="update('height', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="cfg.fullWidth === true"
            @change="update('fullWidth', ($event.target as HTMLInputElement).checked)"
          />
          Full Width (span all columns)
        </label>
      </div>
    </div>

    <div v-if="cfg.fullWidth !== true" class="form-row">
      <div class="form-group">
        <label class="form-label">Width</label>
        <div class="width-field">
          <input
            :value="cfg.width && cfg.width !== '100%' ? String(cfg.width).replace('px', '') : ''"
            type="number"
            class="form-input"
            placeholder="100%"
            min="200"
            @input="update('width', ($event.target as HTMLInputElement).value ? ($event.target as HTMLInputElement).value + 'px' : '100%')"
          />
          <span class="width-unit">px</span>
        </div>
        <span class="form-hint">Leave empty for 100%</span>
      </div>
      <div class="form-group">
        <label class="form-label">Refresh (sec, 0 = off)</label>
        <input
          :value="cfg.refreshInterval || 0"
          type="number"
          class="form-input"
          min="0"
          @input="update('refreshInterval', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <div v-if="cfg.fullWidth !== true" class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="cfg.allowFullscreen !== false"
          @change="update('allowFullscreen', ($event.target as HTMLInputElement).checked)"
        />
        Allow Fullscreen
      </label>
    </div>

    <div v-if="cfg.fullWidth === true" class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="cfg.allowFullscreen !== false"
          @change="update('allowFullscreen', ($event.target as HTMLInputElement).checked)"
        />
        Allow Fullscreen
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.iframe-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-dim);
}

.form-input {
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

.width-field {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.width-unit {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
  margin-top: 1.25rem;

  input {
    width: 1rem;
    height: 1rem;
  }
}
</style>