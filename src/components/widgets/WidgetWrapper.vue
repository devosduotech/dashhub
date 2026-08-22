<script setup lang="ts">
import { ref, computed, defineAsyncComponent, h } from 'vue'
import type { PageItem, WidgetConfig } from '@/types/config'
import { useConfigStore } from '@/stores/config'
import { widgetRegistry } from './registry'
import { WIDGET_ICONS } from '@/utils/iconPaths'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  item: PageItem
  pageIndex: number
}>()

const emit = defineEmits<{ (e: 'refresh'): void }>()

const store = useConfigStore()
const showSettings = ref(false)
const showMoveDropdown = ref(false)

const def = widgetRegistry[props.item.type]
const widgetIcon = WIDGET_ICONS[props.item.type] || 'dashboard'
const WidgetComponent = def ? defineAsyncComponent({
  loader: def.component,
  loadingComponent: () => h('div', { class: 'widget-loading' }, 'Loading...'),
  delay: 0
}) : null

const SettingsForm = def ? defineAsyncComponent(def.settingsForm) : null

const draftTitle = ref(props.item.title)
const draftConfig = ref<WidgetConfig>(JSON.parse(JSON.stringify(props.item.config)))

function openSettings() {
  store.updateWidget(props.pageIndex, props.item.id, {
    title: props.item.title,
    config: draftConfig.value
  })
  draftTitle.value = props.item.title
  draftConfig.value = JSON.parse(JSON.stringify(props.item.config))
  showSettings.value = true
}

function closeSettings() {
  showSettings.value = false
}

function saveSettings() {
  store.updateWidget(props.pageIndex, props.item.id, {
    title: draftTitle.value,
    config: draftConfig.value
  })
  showSettings.value = false
}

function updateDraftConfig(newConfig: WidgetConfig) {
  draftConfig.value = newConfig
  store.updateWidget(props.pageIndex, props.item.id, { config: newConfig })
}

function removeWidget() {
  store.removeWidget(props.pageIndex, props.item.id)
}

function refresh() {
  emit('refresh')
}

function moveToPage(toPageIndex: number) {
  store.moveWidgetBetweenPages(props.pageIndex, toPageIndex, props.item.id)
  store.setActivePage(toPageIndex)
  showMoveDropdown.value = false
}

const otherPages = computed(() => {
  return store.pages
    .map((page, index) => ({ page, index }))
    .filter(({ index }) => index !== props.pageIndex)
})
</script>

<template>
  <div class="widget-wrapper" :class="{ 'edit-mode': store.editMode }">
    <div class="widget-header">
      <span class="widget-icon" v-if="def">
        <AppIcon :name="widgetIcon" :size="16" />
      </span>
      <span class="widget-title">{{ item.title }}</span>
      <div class="widget-actions">
        <button
          v-if="store.editMode"
          class="widget-btn"
          title="Settings"
          @click="openSettings"
        ><AppIcon name="settings" :size="15" /></button>
        <div v-if="store.editMode && otherPages.length > 0" class="move-dropdown-wrapper">
          <button
            class="widget-btn"
            title="Move to page"
            @click="showMoveDropdown = !showMoveDropdown"
          ><AppIcon name="external-link" :size="15" /></button>
          <div v-if="showMoveDropdown" class="move-dropdown">
            <button
              v-for="{ page, index } in otherPages"
              :key="page.id"
              class="move-option"
              @click="moveToPage(index)"
            >{{ page.name }}</button>
          </div>
        </div>
        <button
          class="widget-btn"
          title="Refresh"
          @click="refresh"
        ><AppIcon name="refresh" :size="15" /></button>
        <button
          v-if="store.editMode"
          class="widget-btn widget-btn-danger"
          title="Remove"
          @click="removeWidget"
        ><AppIcon name="trash" :size="15" /></button>
      </div>
    </div>
    <div class="widget-body">
      <component
        v-if="WidgetComponent"
        :is="WidgetComponent"
        :config="draftConfig"
        :edit-mode="store.editMode"
        @update="updateDraftConfig"
      />
      <div v-else class="widget-error">
        Unknown widget type: {{ item.type }}
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showSettings" class="modal-overlay" @click.self="closeSettings">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Edit {{ draftTitle || def?.label || 'Widget' }}</h2>
            <button class="modal-close" @click="closeSettings"><AppIcon name="close" :size="16" /></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Widget Title</label>
              <input v-model="draftTitle" type="text" class="form-input" placeholder="Widget title" />
            </div>
            <div class="form-section">
              <h3 class="section-title">Configuration</h3>
              <component
                v-if="SettingsForm && showSettings"
                :is="SettingsForm"
                :key="props.item.id + '-' + (showSettings ? 'open' : 'closed')"
                :config="draftConfig"
                @update="updateDraftConfig"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeSettings">Cancel</button>
            <button class="btn btn-primary" @click="saveSettings">Save</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.widget-wrapper {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color 150ms ease;

  &:hover {
    border-color: var(--color-border-strong);
  }

  &.edit-mode {
    border-style: dashed;
  }
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background-color: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  min-height: 42px;
}

.widget-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 6px;
  background-color: var(--color-primary-dim);
  color: var(--color-primary);
  flex-shrink: 0;
}

.widget-title {
  flex: 1;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-actions {
  display: flex;
  gap: 0.125rem;
  align-items: center;
}

.move-dropdown-wrapper {
  position: relative;
}

.move-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.25rem;
  min-width: 140px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.move-option {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: var(--color-bg-hover);
  }
}

.widget-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 0.3125rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }

  &.widget-btn-danger:hover {
    color: var(--color-danger);
  }
}

.widget-body {
  flex: 1;
  overflow: auto;
}

.widget-error {
  padding: 1rem;
  color: var(--color-danger);
  font-size: 0.875rem;
}

.widget-loading {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-content {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 0.375rem;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

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

.form-section {
  margin-top: 1.5rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;

  &:hover {
    background-color: var(--color-primary-hover);
  }
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);

  &:hover {
    background-color: var(--color-bg-hover);
  }
}
</style>