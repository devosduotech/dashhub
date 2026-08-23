<script setup lang="ts">
import { computed } from 'vue'
import { widgetList, type WidgetCategory } from './registry'
import type { WidgetType } from '@/types/config'
import { useConfigStore } from '@/stores/config'
import { WIDGET_ICONS } from '@/utils/iconPaths'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  columnIndex: number
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const store = useConfigStore()

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  infrastructure: 'Infrastructure',
  productivity: 'Productivity',
  network: 'Network',
  content: 'Content',
  general: 'General'
}

const CATEGORY_ORDER: WidgetCategory[] = ['infrastructure', 'productivity', 'network', 'content', 'general']

const groupedWidgets = computed(() => {
  const groups = new Map<WidgetCategory, typeof widgetList>()
  for (const cat of CATEGORY_ORDER) groups.set(cat, [])
  for (const w of widgetList) {
    groups.get(w.category)!.push(w)
  }
  return groups
})

function addWidget(type: WidgetType) {
  const def = widgetList.find((w) => w.type === type)
  if (!def) return
  store.addWidgetToColumn(store.activePageIndex, props.columnIndex, type, def.label, def.defaultConfig())
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="palette-overlay" @click.self="emit('close')">
      <div class="palette-modal">
        <div class="palette-header">
          <h3 class="palette-title">Add Widget to Column {{ columnIndex + 1 }}</h3>
          <button class="palette-close" @click="emit('close')">
            <AppIcon name="close" :size="16" />
          </button>
        </div>
        <div class="palette-list">
          <template v-for="cat in CATEGORY_ORDER" :key="cat">
            <div v-if="groupedWidgets.get(cat)!.length > 0" class="palette-category">
              <span class="palette-category-label">{{ CATEGORY_LABELS[cat] }}</span>
            </div>
            <button
              v-for="w in groupedWidgets.get(cat)"
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
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.palette-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.palette-modal {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.palette-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.palette-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  border-radius: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.palette-list {
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.palette-category {
  padding: 0.5rem 0.75rem 0.25rem;
}

.palette-category-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: left;
  transition: all 150ms ease;
  cursor: pointer;

  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
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
