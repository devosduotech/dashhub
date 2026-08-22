<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RemindersWidgetConfig } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'update', config: Record<string, unknown>): void }>()

const cfg = computed(() => props.config as RemindersWidgetConfig)

const showCompleted = ref(cfg.value.showCompleted !== false)
const sortBy = ref(cfg.value.sortBy || 'created')

function update(updates: Partial<RemindersWidgetConfig>) {
  emit('update', { ...cfg.value, ...updates })
}

function onShowCompletedChange(val: boolean) {
  showCompleted.value = val
  update({ showCompleted: val })
}

function onSortByChange(val: string) {
  sortBy.value = val as 'created' | 'priority'
  update({ sortBy: val as 'created' | 'priority' })
}
</script>

<template>
  <div class="reminders-settings">
    <div class="form-row">
      <div class="form-group form-group-half">
        <label class="form-label">Sort By</label>
        <select class="form-select" :value="sortBy" @change="onSortByChange(($event.target as HTMLSelectElement).value)">
          <option value="created">Date Created</option>
          <option value="priority">Priority</option>
        </select>
      </div>
      <div class="form-group form-group-half">
        <label class="form-label">Show Completed</label>
        <label class="toggle">
          <input type="checkbox" :checked="showCompleted" @change="onShowCompletedChange(($event.target as HTMLInputElement).checked)" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <p class="form-hint">
      Reminders support checkboxes, priorities (Low/Medium/High), and completion tracking.
    </p>
  </div>
</template>

<style scoped lang="scss">
.reminders-settings { display: flex; flex-direction: column; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-group-half { flex: 1; }
.form-row { display: flex; gap: 1rem; align-items: flex-start; }

.form-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text); }

.form-select {
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

.toggle {
  position: relative;
  display: inline-block;
  width: 2.5rem;
  height: 1.375rem;
  cursor: pointer;

  input { opacity: 0; width: 0; height: 0; }

  .toggle-slider {
    position: absolute;
    inset: 0;
    background-color: var(--color-border);
    border-radius: 7px;
    transition: background-color 150ms ease;

    &::before {
      content: '';
      position: absolute;
      width: 1rem;
      height: 1rem;
      left: 0.1875rem;
      bottom: 0.1875rem;
      background-color: white;
      border-radius: 50%;
      transition: transform 150ms ease;
    }
  }

  input:checked + .toggle-slider {
    background-color: var(--color-primary);
    &::before { transform: translateX(1.125rem); }
  }
}
</style>
