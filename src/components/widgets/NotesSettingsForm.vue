<script setup lang="ts">
import { ref } from 'vue'
import type { NoteItem } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

function getConfig(): { items: NoteItem[]; sortBy?: string } {
  return props.config as { items: NoteItem[]; sortBy?: string }
}

const editingIndex = ref(-1)
const editText = ref('')
const editPriority = ref<'low' | 'medium' | 'high'>('medium')

function addNote() {
  editingIndex.value = getConfig().items.length
  editText.value = ''
  editPriority.value = 'medium'
}

function editNoteItem(index: number) {
  editingIndex.value = index
  const item = getConfig().items[index]
  editText.value = item.text
  editPriority.value = item.priority || 'medium'
}

function saveNote() {
  const cfg = { ...getConfig() }
  const items = [...(cfg.items || [])]
  const now = new Date().toISOString()
  if (editingIndex.value >= 0 && editingIndex.value < items.length) {
    items[editingIndex.value] = {
      ...items[editingIndex.value],
      text: editText.value,
      priority: editPriority.value
    }
  } else {
    items.push({
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: editText.value,
      completed: false,
      priority: editPriority.value,
      createdAt: now
    })
  }
  emit('update', { ...props.config, items })
  editingIndex.value = -1
}

function deleteNote(index: number) {
  const cfg = { ...getConfig() }
  const items = [...(cfg.items || [])]
  items.splice(index, 1)
  emit('update', { ...props.config, items })
}

function cancelEdit() {
  editingIndex.value = -1
}

function updateSortBy(value: string) {
  emit('update', { ...props.config, sortBy: value })
}
</script>

<template>
  <div class="notes-form">
    <div class="form-group">
      <label class="form-label">Sort By</label>
      <select :value="getConfig().sortBy || 'created'" class="form-select" @change="updateSortBy(($event.target as HTMLSelectElement).value)">
        <option value="created">Created Date</option>
        <option value="priority">Priority</option>
      </select>
    </div>

    <div class="links-section">
      <div class="section-header">
        <span class="section-label">Notes ({{ getConfig().items?.length || 0 }})</span>
        <button class="btn btn-small btn-primary" @click="addNote">+ Add Note</button>
      </div>

      <div v-if="editingIndex >= 0" class="link-editor">
        <div class="form-group">
          <label class="form-label">Text</label>
          <textarea v-model="editText" class="form-textarea" rows="3" placeholder="Write your note..."></textarea>
          <span class="textarea-hint">Shift+Enter for new line, Enter to save</span>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select v-model="editPriority" class="form-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn btn-small btn-secondary" @click="cancelEdit">Cancel</button>
          <button class="btn btn-small btn-primary" @click="saveNote" :disabled="!editText.trim()">Save Note</button>
        </div>
      </div>

      <div v-else class="links-list">
        <div v-if="!getConfig().items || getConfig().items.length === 0" class="empty-hint">
          No notes yet. Click "Add Note" to create one.
        </div>
        <div
          v-for="(item, index) in (getConfig().items || [])"
          :key="item.id"
          class="link-item"
        >
          <span class="link-info">
            <span class="link-title">{{ item.text }}</span>
            <span class="link-url">Priority: {{ item.priority || 'medium' }}</span>
          </span>
          <div class="link-actions">
            <button class="btn btn-small" @click="editNoteItem(index)">Edit</button>
            <button class="btn btn-small btn-danger" @click="deleteNote(index)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notes-form {
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
.form-select,
.form-textarea {
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

.form-textarea {
  resize: vertical;
  min-height: 4rem;
  font-family: inherit;
}

.textarea-hint {
  font-size: 0.6875rem;
  color: var(--color-text-dim);
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

  &.completed-item {
    opacity: 0.6;
  }
}

.note-status {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: 4px;

  &.done {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
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
  white-space: pre-wrap;
  word-break: break-word;

  &.line-through {
    text-decoration: line-through;
    color: var(--color-text-muted);
  }
}

.link-url {
  font-size: 0.75rem;
  color: var(--color-text-dim);
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  &:hover:not(:disabled) {
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
</style>
