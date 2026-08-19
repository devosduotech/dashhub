<script setup lang="ts">
import { computed } from 'vue'
import type { GlancesWidgetConfig } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

const cfg = computed(() => props.config as GlancesWidgetConfig)

function update(field: string, value: unknown) {
  const newConfig = { ...props.config }
  newConfig[field] = value
  emit('update', newConfig)
}

function updateSsh(field: string, value: unknown) {
  const ssh = { ...(cfg.value.ssh || { enabled: false, host: '', port: 22, username: '' }), [field]: value }
  emit('update', { ...props.config, ssh })
}
</script>

<template>
  <div class="glances-form">
    <div class="form-group">
      <label class="form-label">Glances URL</label>
      <input
        :value="cfg.url || ''"
        type="text"
        class="form-input"
        placeholder="http://192.168.1.10:61208"
        @input="update('url', ($event.target as HTMLInputElement).value)"
      />
      <span class="form-hint">Full URL to the Glances web interface</span>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Display Mode</label>
        <select :value="cfg.displayMode || 'embedded'" class="form-select" @change="update('displayMode', ($event.target as HTMLSelectElement).value)">
          <option value="embedded">Embedded (iframe)</option>
          <option value="link">Link Only</option>
          <option value="compact">Compact</option>
        </select>
      </div>
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
    </div>

    <div v-if="(cfg.displayMode || 'embedded') === 'embedded'" class="form-row">
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
      <div v-if="cfg.fullWidth !== true" class="form-group">
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
    </div>

    <div class="form-group">
      <label class="form-label">Refresh Interval (seconds, 0 = off)</label>
      <input
        :value="cfg.refreshInterval || 0"
        type="number"
        class="form-input"
        min="0"
        @input="update('refreshInterval', Number(($event.target as HTMLInputElement).value))"
      />
    </div>

    <div class="ssh-section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="cfg.ssh?.enabled || false"
          @change="updateSsh('enabled', ($event.target as HTMLInputElement).checked)"
        />
        Enable SSH Quick-Connect
      </label>

      <div v-if="cfg.ssh?.enabled" class="ssh-fields">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">SSH Host</label>
            <input
              :value="cfg.ssh?.host || ''"
              type="text"
              class="form-input"
              placeholder="192.168.1.10"
              @input="updateSsh('host', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="form-group">
            <label class="form-label">SSH Port</label>
            <input
              :value="cfg.ssh?.port || 22"
              type="number"
              class="form-input"
              @input="updateSsh('port', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">SSH Username</label>
          <input
            :value="cfg.ssh?.username || ''"
            type="text"
            class="form-input"
            placeholder="admin"
            @input="updateSsh('username', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.glances-form {
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

.form-input,
.form-select {
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

.ssh-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
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

.width-field {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.width-unit {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.ssh-fields {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>