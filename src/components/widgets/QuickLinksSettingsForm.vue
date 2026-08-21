<script setup lang="ts">
import { ref } from 'vue'
import type { QuickLink } from '@/types/config'
import { isImageIcon, safeIconName } from '@/utils/icons'
import MediaPicker from '@/components/common/MediaPicker.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

function getConfig(): { columns?: number; displayMode?: string; links: QuickLink[] } {
  return props.config as { columns?: number; displayMode?: string; links: QuickLink[] }
}

const editingIndex = ref(-1)
const editLink = ref<QuickLink>({ title: '', url: '', icon: '', description: '', target: 'newtab', category: '' })
const showIconPicker = ref(false)
const iconPickerTab = ref<'icons' | 'images'>('icons')

function openIconPicker(tab: 'icons' | 'images') {
  iconPickerTab.value = tab
  showIconPicker.value = true
}

function addLink() {
  editingIndex.value = getConfig().links.length
  editLink.value = { title: '', url: '', icon: '', description: '', target: 'newtab', category: '' }
}

function editLinkItem(index: number) {
  editingIndex.value = index
  const link = getConfig().links[index]
  editLink.value = { ...link }
}

function saveLink() {
  const cfg = { ...getConfig() }
  if (!cfg.links) cfg.links = []
  if (editingIndex.value >= 0 && editingIndex.value < cfg.links.length) {
    cfg.links[editingIndex.value] = { ...editLink.value }
  } else {
    cfg.links.push({ ...editLink.value })
  }
  emit('update', { ...props.config, links: cfg.links })
  editingIndex.value = -1
}

function deleteLink(index: number) {
  const cfg = { ...getConfig() }
  cfg.links.splice(index, 1)
  emit('update', { ...props.config, links: cfg.links })
}

function cancelEdit() {
  editingIndex.value = -1
}

function updateColumns(value: number) {
  emit('update', { ...props.config, columns: value })
}

function updateDisplayMode(value: string) {
  emit('update', { ...props.config, displayMode: value })
}

const dragIndex = ref(-1)
const dragOverIndex = ref(-1)

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(index: number, event: DragEvent) {
  event.preventDefault()
  dragOverIndex.value = index
}

function onDragEnd() {
  if (dragIndex.value >= 0 && dragOverIndex.value >= 0 && dragIndex.value !== dragOverIndex.value) {
    const cfg = { ...getConfig() }
    const items = [...cfg.links]
    const [moved] = items.splice(dragIndex.value, 1)
    items.splice(dragOverIndex.value, 0, moved)
    cfg.links = items
    emit('update', { ...props.config, links: cfg.links })
  }
  dragIndex.value = -1
  dragOverIndex.value = -1
}

function onIconSelected(value: string) {
  editLink.value.icon = value
  showIconPicker.value = false
}
</script>

<template>
  <div class="quick-links-form">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Columns</label>
        <select :value="getConfig().columns || 3" class="form-select" @change="updateColumns(Number(($event.target as HTMLSelectElement).value))">
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="4">4</option>
          <option :value="5">5</option>
          <option :value="6">6</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Display Mode</label>
        <select :value="getConfig().displayMode || 'grid'" class="form-select" @change="updateDisplayMode(($event.target as HTMLSelectElement).value)">
          <option value="grid">Grid</option>
          <option value="list">List</option>
          <option value="bar">Bar</option>
        </select>
      </div>
    </div>

    <div class="links-section">
      <div class="section-header">
        <span class="section-label">Links ({{ getConfig().links?.length || 0 }})</span>
        <button class="btn btn-small btn-primary" @click="addLink">+ Add Link</button>
      </div>

      <div v-if="editingIndex >= 0" class="link-editor">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input v-model="editLink.title" type="text" class="form-input" placeholder="My Service" />
          </div>
          <div class="form-group">
            <label class="form-label">URL</label>
            <input v-model="editLink.url" type="text" class="form-input" placeholder="https://example.com" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Icon</label>
            <div class="icon-field">
              <span class="icon-preview" v-if="editLink.icon">
                <img v-if="isImageIcon(editLink.icon)" :src="editLink.icon" class="icon-preview-img" @error="($event.target as HTMLImageElement).style.display = 'none'" />
                <AppIcon v-else :name="safeIconName(editLink.icon)" :size="18" class="icon-preview-emoji" />
              </span>
              <input v-model="editLink.icon" type="text" class="form-input icon-input" placeholder="Icon name, or /uploads/... path" />
              <button type="button" class="btn btn-small icon-pick-btn" @click="openIconPicker('icons')">Pick</button>
              <button type="button" class="btn btn-small icon-pick-btn" @click="openIconPicker('images')">Upload</button>
            </div>
            <div v-if="showIconPicker" class="icon-picker-inline">
              <MediaPicker :model-value="editLink.icon ?? ''" :initial-tab="iconPickerTab" @update:model-value="onIconSelected" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input v-model="editLink.category" type="text" class="form-input" placeholder="Monitoring" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input v-model="editLink.description" type="text" class="form-input" placeholder="Optional description" />
        </div>
        <div class="form-group">
          <label class="form-label">Open in</label>
          <select v-model="editLink.target" class="form-select">
            <option value="newtab">New Tab</option>
            <option value="sametab">Same Tab</option>
            <option value="modal">Modal</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn btn-small btn-secondary" @click="cancelEdit">Cancel</button>
          <button class="btn btn-small btn-primary" @click="saveLink">Save Link</button>
        </div>
      </div>

      <div v-else class="links-list">
        <div v-if="!getConfig().links || getConfig().links.length === 0" class="empty-hint">
          No links yet. Click "Add Link" to create one.
        </div>
        <div
          v-for="(link, index) in (getConfig().links || [])"
          :key="index"
          class="link-item"
          :class="{ 'drag-over': dragOverIndex === index }"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover="onDragOver(index, $event)"
          @dragend="onDragEnd"
        >
          <span class="link-icon" v-if="isImageIcon(link.icon)">
            <img :src="link.icon" :alt="link.title" class="link-icon-img" @error="($event.target as HTMLImageElement).style.display = 'none'" />
          </span>
          <span class="link-icon" v-else><AppIcon :name="safeIconName(link.icon)" :size="18" /></span>
          <span class="link-info">
            <span class="link-title">{{ link.title }}</span>
            <span class="link-url">{{ link.url }}</span>
          </span>
          <span v-if="link.category" class="link-category">{{ link.category }}</span>
          <div class="link-actions">
            <button class="btn btn-small" @click="editLinkItem(index)">Edit</button>
            <button class="btn btn-small btn-danger" @click="deleteLink(index)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-links-form {
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

.links-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
}

.link-editor {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-hint {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &.drag-over {
    border-color: var(--color-primary);
    background-color: var(--color-primary-dim);
  }
}

.link-icon {
  font-size: 1.25rem;
  width: 2rem;
  flex-shrink: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.link-icon-img {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  border-radius: 4px;
}

.link-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.link-title {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-url {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-category {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background-color: var(--color-primary-dim);
  border-radius: 12px;
  color: var(--color-text);
}

.link-actions {
  display: flex;
  gap: 0.25rem;
}

.btn {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.8125rem;
  background-color: var(--color-surface);
  color: var(--color-text);

  &:hover {
    background-color: var(--color-bg-hover);
  }
}

.btn-small {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);

  &:hover {
    background-color: var(--color-primary-hover);
  }
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text);
}

.btn-danger {
  color: var(--color-danger);
  border-color: var(--color-border);

  &:hover {
    background-color: var(--color-danger);
    color: white;
  }
}

.icon-field {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.icon-preview {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.icon-preview-emoji {
  font-size: 1.25rem;
}

.icon-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-input {
  flex: 1;
  min-width: 0;
}

.icon-pick-btn {
  flex-shrink: 0;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
}

.icon-picker-inline {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>