<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import WidgetWrapper from '@/components/widgets/WidgetWrapper.vue'
import WidgetPalette from '@/components/widgets/WidgetPalette.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { PageItem } from '@/types/config'

const route = useRoute()
const router = useRouter()
const store = useConfigStore()

const dragInfo = ref<{ itemId: string; columnIndex: number } | null>(null)
const dragOverInfo = ref<{ index: number; columnIndex: number } | null>(null)
const paletteColumn = ref<number | null>(null)

const columnCount = computed(() => store.activePage?.columnCount ?? 3)

const widgetsByColumn = computed(() => {
  if (!store.activePage) return [] as PageItem[][]
  const columns: PageItem[][] = Array.from({ length: columnCount.value }, () => [])
  for (const item of store.activePage.items) {
    const col = Math.max(0, Math.min(item.column ?? 0, columnCount.value - 1))
    columns[col].push(item)
  }
  return columns
})

// Watch for route changes and update active page
watch(() => route.params.pageName, (pageName) => {
  if (pageName && store.pages.length > 0) {
    const pageIndex = store.pages.findIndex(p => 
      p.name.toLowerCase().replace(/\s+/g, '-') === pageName
    )
    if (pageIndex >= 0) {
      store.setActivePage(pageIndex)
    }
  }
}, { immediate: true })

function onDragStart(itemId: string, columnIndex: number) {
  dragInfo.value = { itemId, columnIndex }
}

function onDragOver(e: DragEvent, index: number, columnIndex: number) {
  if (!dragInfo.value) return
  e.preventDefault()
  dragOverInfo.value = { index, columnIndex }
}

function onDrop(index: number, columnIndex: number) {
  if (!dragInfo.value) return
  const samePosition = dragInfo.value.columnIndex === columnIndex &&
    widgetsByColumn.value[columnIndex]?.[index]?.id === dragInfo.value.itemId
  if (!samePosition) {
    store.moveWidgetToColumn(store.activePageIndex, dragInfo.value.itemId, columnIndex, index)
  }
  dragInfo.value = null
  dragOverInfo.value = null
}

function onDropAtEnd(columnIndex: number) {
  if (!dragInfo.value) return
  const endIndex = widgetsByColumn.value[columnIndex]?.length ?? 0
  store.moveWidgetToColumn(store.activePageIndex, dragInfo.value.itemId, columnIndex, endIndex)
  dragInfo.value = null
  dragOverInfo.value = null
}

function onDragEnd() {
  dragInfo.value = null
  dragOverInfo.value = null
}

// Update URL when active page changes
watch(() => store.activePageIndex, (newIndex) => {
  if (newIndex >= 0 && store.pages[newIndex]) {
    const pageName = store.pages[newIndex].name.toLowerCase().replace(/\s+/g, '-')
    router.push(`/${pageName}`)
  }
})
</script>

<template>
  <main class="dashboard" :class="{ 'is-dragging': !!dragInfo }">
    <div v-if="store.loading" class="state-message">
      <AppIcon name="spinner" :size="22" />
      <p>Loading dashboard...</p>
    </div>
    <AppEmptyState
      v-else-if="!store.activePage"
      title="No pages configured"
      message="Create a page to organize your widgets. Enable Edit Mode to get started."
      :cta-text="store.editMode ? '' : 'Enable Edit Mode'"
      @cta="store.toggleEditMode"
    />
    <div v-else class="page-content">
      <div class="widget-grid" :style="{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }">
        <div
          v-for="(columnItems, colIndex) in widgetsByColumn"
          :key="colIndex"
          class="widget-column"
          :class="{ 'drop-target': dragInfo && dragOverInfo?.columnIndex === colIndex }"
          @dragover.prevent
          @drop="onDropAtEnd(colIndex)"
        >
          <div
            v-for="(item, i) in columnItems"
            :key="item.id || i"
            class="widget-slot"
            :class="{
              'dragging': dragInfo?.itemId === item.id,
              'drag-over': dragOverInfo?.index === i && dragOverInfo?.columnIndex === colIndex
            }"
            :draggable="store.editMode"
            @dragstart="onDragStart(item.id, colIndex)"
            @dragover="onDragOver($event, i, colIndex)"
            @drop="onDrop(i, colIndex)"
            @dragend="onDragEnd"
          >
            <WidgetWrapper :item="item" :page-index="store.activePageIndex" />
          </div>
          <button
            v-if="store.editMode"
            class="add-widget-btn"
            @click="paletteColumn = colIndex"
          >
            <AppIcon name="plus" :size="14" /> Add Widget
          </button>
          <div
            v-if="dragInfo || store.editMode"
            class="column-drop-zone"
            :class="{
              'drag-active': !!dragInfo,
              'drag-over': dragOverInfo?.columnIndex === colIndex && dragOverInfo?.index >= (widgetsByColumn[colIndex]?.length ?? 0)
            }"
          >
            <template v-if="dragInfo"><AppIcon name="arrow-up-right" :size="14" /> Drop here</template>
            <template v-else>End of column</template>
          </div>
        </div>
      </div>
      <WidgetPalette
        v-if="paletteColumn !== null"
        :column-index="paletteColumn"
        @close="paletteColumn = null"
      />
    </div>
  </main>
</template>

<style scoped lang="scss">
.dashboard {
  padding: 1.5rem;
  min-height: calc(100vh - 5.5rem);
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  align-items: start;
}

.widget-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  border-radius: 8px;
  padding: 0.25rem;
  transition: background-color 150ms ease;

  &.drop-target {
    background-color: rgba(var(--color-primary-rgb), 0.08);
  }
}

.widget-slot {
  position: relative;
  min-height: 100px;
  
  &[draggable="true"] {
    cursor: grab;
    &:active { cursor: grabbing; }
  }
}

.widget-slot.dragging {
  opacity: 0.4;
  border: 2px dashed var(--color-primary);
  border-radius: 8px;
}

.widget-slot.drag-over {
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  background-color: rgba(var(--color-primary-rgb), 0.1);
}

.column-drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  min-height: 56px;
  color: var(--color-text-dim);
  font-size: 0.8125rem;
  transition: all 150ms ease;

  &.drag-active {
    min-height: 64px;
    border-color: var(--color-border-strong);
  }

  &.drag-over {
    border-color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.12);
    color: var(--color-primary);
  }
}

.add-widget-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.05);
  }
}

.empty-page {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  border-radius: 12px;

  p {
    margin: 0.75rem 0 0;
    font-size: 0.875rem;
  }
}

.empty-page-icon {
  color: var(--color-text-dim);
}

.state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-muted);

  p { margin: 0; }
}
</style>
