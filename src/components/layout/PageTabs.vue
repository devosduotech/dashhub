<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useConfigStore } from '@/stores/config'
import { iconNames, safeIconName } from '@/utils/icons'
import PageSettingsModal from './PageSettingsModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const store = useConfigStore()
const renamingIndex = ref(-1)
const newName = ref('')
const iconPickerIndex = ref(-1)
const settingsPageIndex = ref(-1)

function selectPage(index: number) {
  if (iconPickerIndex.value === index) {
    iconPickerIndex.value = -1
    return
  }
  store.setActivePage(index)
}

function startRename(index: number) {
  renamingIndex.value = index
  newName.value = store.pages[index].name
  nextTick(() => {
    document.querySelector<HTMLInputElement>('.tab-input')?.focus()
  })
}

function commitRename() {
  if (renamingIndex.value === -1) return
  const name = newName.value.trim()
  if (name) {
    store.renamePage(renamingIndex.value, name)
  }
  renamingIndex.value = -1
}

function addPage() {
  const name = `Page ${store.pageCount + 1}`
  store.addPage(name)
}

function deletePage(index: number) {
  if (store.pageCount <= 1) return
  if (confirm(`Delete page "${store.pages[index].name}"?`)) {
    store.deletePage(index)
  }
}

function toggleIconPicker(index: number) {
  iconPickerIndex.value = iconPickerIndex.value === index ? -1 : index
}

function setPageIcon(index: number, iconKey: string) {
  const page = store.pages[index]
  store.updatePage(index, { ...page, icon: iconKey })
  iconPickerIndex.value = -1
}

function openSettings(index: number) {
  settingsPageIndex.value = index
}

function updatePageSettings(updates: { name: string; icon: string; columnCount?: number }) {
  if (settingsPageIndex.value === -1) return
  const page = store.pages[settingsPageIndex.value]
  store.updatePage(settingsPageIndex.value, {
    ...page,
    ...updates
  })
  settingsPageIndex.value = -1
}
</script>

<template>
  <nav class="page-tabs">
    <div class="tabs-container">
      <div
        v-for="(page, index) in store.pages"
        :key="page.id || index"
        class="tab"
        :class="{ active: index === store.activePageIndex }"
      >
        <button class="tab-main" :title="store.editMode ? page.name : 'Switch to ' + page.name" @click="selectPage(index)">
          <template v-if="!store.editMode">
            <span class="tab-icon"><AppIcon :name="safeIconName(page.icon)" :size="16" /></span>
            <span class="tab-name">{{ page.name }}</span>
          </template>
          <template v-else>
            <input
              v-if="renamingIndex === index"
              v-model="newName"
              class="tab-input"
              @click.stop
              @blur="commitRename"
              @keyup.enter="commitRename"
              @keyup.esc="renamingIndex = -1"
            />
            <span v-else class="tab-name" @dblclick="startRename(index)">{{ page.name }}</span>
          </template>
        </button>
        <template v-if="store.editMode">
          <button class="tab-icon-btn" :title="page.icon || 'Page icon'" @click.stop="toggleIconPicker(index)">
            <AppIcon :name="safeIconName(page.icon)" :size="15" />
          </button>
          <button class="tab-edit-btn" title="Page settings" @click.stop="openSettings(index)">
            <AppIcon name="settings" :size="13" />
          </button>
          <button class="tab-edit-btn" title="Rename" @click.stop="startRename(index)">
            <AppIcon name="edit" :size="13" />
          </button>
          <button
            class="tab-edit-btn tab-edit-danger"
            title="Delete page"
            :disabled="store.pageCount <= 1"
            @click.stop="deletePage(index)"
          >
            <AppIcon name="trash" :size="13" />
          </button>
        </template>
      </div>
      <button v-if="store.editMode" class="tab tab-add" @click="addPage">
        <AppIcon name="plus" :size="13" />
        Add Page
      </button>
    </div>

    <div v-if="iconPickerIndex >= 0" class="icon-picker-overlay" @click="iconPickerIndex = -1">
      <div class="icon-picker" @click.stop>
        <div class="icon-picker-header">
          <span>Select Page Icon</span>
          <button class="icon-picker-close" @click="iconPickerIndex = -1">
            <AppIcon name="close" :size="16" />
          </button>
        </div>
        <div class="icon-grid">
          <button
            v-for="name in iconNames"
            :key="name"
            class="icon-option"
            :class="{ selected: store.pages[iconPickerIndex]?.icon === name }"
            @click="setPageIcon(iconPickerIndex, name)"
            :title="name"
          ><AppIcon :name="name" :size="20" /></button>
        </div>
      </div>
    </div>

    <PageSettingsModal
      v-if="settingsPageIndex >= 0"
      :page-index="settingsPageIndex"
      :page-name="store.pages[settingsPageIndex].name"
      :page-icon="store.pages[settingsPageIndex].icon"
      :column-count="store.pages[settingsPageIndex].columnCount"
      @close="settingsPageIndex = -1"
      @update="updatePageSettings"
    />
  </nav>
</template>

<style scoped lang="scss">
.page-tabs {
  background-color: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.tabs-container {
  display: flex;
  align-items: stretch;
  padding: 0 1rem;
  gap: 0.25rem;
  min-height: 2.75rem;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  white-space: nowrap;
  transition: all 150ms ease;
  position: relative;

  &:hover {
    color: var(--color-text);
    background-color: var(--color-bg-hover);
  }

  &.active {
    color: var(--color-text);
    border-bottom-color: var(--color-primary);
  }
}

.tab-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  background: none;
  border: none;
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  align-self: stretch;
}

.tab-icon {
  display: inline-flex;
  align-items: center;
  opacity: 0.7;
}

.tab-name {
  cursor: pointer;
}

.tab-input {
  background-color: var(--color-bg);
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  color: var(--color-text);
  padding: 0.125rem 0.375rem;
  font-size: 0.875rem;
  width: 8rem;
}

.tab-edit-btn,
.tab-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-dim);
  padding: 0.25rem;
  font-size: 0.875rem;
  line-height: 1;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    color: var(--color-text);
    background-color: var(--color-bg-hover);
  }

  &.tab-edit-danger:hover {
    color: var(--color-danger);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.tab-icon-btn {
  border: 1px solid transparent;

  &:hover {
    border-color: var(--color-border);
  }
}

.tab-add {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-dim);
  font-style: italic;

  &:hover {
    color: var(--color-primary-hover);
  }
}

.icon-picker-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;

  &:hover {
    color: var(--color-text);
    background-color: var(--color-bg-hover);
  }
}

.icon-picker-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.icon-picker {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.icon-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
}

.icon-picker-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  cursor: pointer;

  &:hover {
    color: var(--color-text);
  }
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
  gap: 0.25rem;
  padding: 1rem;
  overflow-y: auto;
}

.icon-option {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 100ms ease;

  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-border);
  }

  &.selected {
    background-color: var(--color-primary-dim);
    border-color: var(--color-primary);
  }
}
</style>