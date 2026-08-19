<script setup lang="ts">
import { widgetList } from './registry'
import type { WidgetType } from '@/types/config'
import { useConfigStore } from '@/stores/config'
import { WIDGET_ICONS } from '@/utils/iconPaths'
import AppIcon from '@/components/ui/AppIcon.vue'

const store = useConfigStore()

function addWidget(type: WidgetType) {
  const def = widgetList.find((w) => w.type === type)
  if (!def) return
  store.addWidget(store.activePageIndex, type, def.label, def.defaultConfig())
}
</script>

<template>
  <div class="widget-palette">
    <h3 class="palette-title">Add Widget</h3>
    <div class="palette-list">
      <button
        v-for="w in widgetList"
        :key="w.type"
        class="palette-item"
        @click="addWidget(w.type)"
      >
        <span class="palette-icon">
          <AppIcon :name="WIDGET_ICONS[w.type] || 'dashboard'" :size="18" />
        </span>
        <span class="palette-info">
          <span class="palette-label">{{ w.label }}</span>
          <span class="palette-desc">{{ w.description }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.widget-palette {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.palette-title {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.palette-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  text-align: left;
  transition: all 150ms ease;
  overflow: hidden;

  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-primary);
  }
}

.palette-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 6px;
  background-color: var(--color-primary-dim);
  color: var(--color-primary);
  flex-shrink: 0;
}

.palette-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  overflow: hidden;
}

.palette-label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.palette-desc {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>