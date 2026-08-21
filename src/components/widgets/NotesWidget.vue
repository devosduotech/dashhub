<script setup lang="ts">
import { ref, computed } from 'vue'
import type { NotesWidgetConfig } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

const cfg = computed(() => props.config as NotesWidgetConfig)
const items = computed(() => cfg.value.items || [])
const displayMode = computed(() => cfg.value.displayMode || 'reminders')
const showCompleted = computed(() => cfg.value.showCompleted !== false)
const sortBy = computed(() => cfg.value.sortBy || 'created')

const newNoteText = ref('')
const newNotePriority = ref<'low' | 'medium' | 'high'>('medium')

const sortedItems = computed(() => {
  const filtered = showCompleted.value ? [...items.value] : items.value.filter(i => !i.completed)
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return filtered.sort((a, b) => {
    if (sortBy.value === 'priority') {
      const ap = priorityOrder[a.priority || 'medium']
      const bp = priorityOrder[b.priority || 'medium']
      return ap - bp
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

function addNote() {
  const text = newNoteText.value.trim()
  if (!text) return
  const allItems = [...items.value]
  allItems.push({
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    completed: false,
    priority: newNotePriority.value,
    createdAt: new Date().toISOString()
  })
  emit('update', { ...props.config, items: allItems })
  newNoteText.value = ''
}

function toggleComplete(index: number) {
  const allItems = [...items.value]
  const item = allItems[index]
  if (!item) return
  allItems[index] = { ...item, completed: !item.completed }
  emit('update', { ...props.config, items: allItems })
}

function deleteNote(index: number) {
  const allItems = [...items.value]
  allItems.splice(index, 1)
  emit('update', { ...props.config, items: allItems })
}
</script>

<template>
  <div class="notes-widget">
    <div v-if="sortedItems.length === 0 && !newNoteText" class="empty-state">
      <p>No notes yet.</p>
    </div>

    <div v-if="sortedItems.length > 0" class="notes-list" :class="{ 'notes-mode': displayMode === 'notes' }">
      <div
        v-for="item in sortedItems"
        :key="item.id"
        class="note-item"
        :class="{ completed: item.completed }"
      >
        <input
          type="checkbox"
          class="note-checkbox"
          :checked="item.completed"
          @change="toggleComplete(items.indexOf(item))"
        />
        <div class="note-content">
          <span class="note-text">{{ item.text }}</span>
        </div>
        <span
          v-if="item.priority && item.priority !== 'medium'"
          class="note-priority"
          :class="'priority-' + item.priority"
        >
          {{ item.priority }}
        </span>
        <button class="note-delete" @click="deleteNote(items.indexOf(item))" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>

    <div class="quick-add">
      <input
        v-model="newNoteText"
        type="text"
        class="quick-add-input"
        placeholder="Add a note..."
        @keydown.enter="addNote"
      />
      <select v-model="newNotePriority" class="quick-add-priority">
        <option value="low">Low</option>
        <option value="medium">Med</option>
        <option value="high">High</option>
      </select>
      <button class="quick-add-btn" @click="addNote" :disabled="!newNoteText.trim()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notes-widget {
  padding: 1rem;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 150ms ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--color-bg-hover);

    .note-delete {
      opacity: 1;
    }
  }

  &.completed {
    .note-text {
      text-decoration: line-through;
      color: var(--color-text-muted);
    }
  }
}

.note-checkbox {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.note-content {
  flex: 1;
  min-width: 0;
}

.note-text {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.4;
}

.notes-mode .note-text {
  white-space: normal;
  word-break: break-word;
}

.note-priority {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  padding: 0.1rem 0.375rem;
  border-radius: 4px;

  &.priority-high {
    color: var(--color-danger);
    background-color: var(--color-danger-dim);
  }

  &.priority-low {
    color: var(--color-text-muted);
    background-color: var(--color-bg);
  }
}

.note-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  opacity: 0;
  transition: all 150ms ease;
  flex-shrink: 0;

  &:hover {
    color: var(--color-danger);
    background-color: var(--color-danger-dim);
  }
}

.quick-add {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.quick-add-input {
  flex: 1;
  padding: 0.375rem 0.625rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.8125rem;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--color-text-dim);
  }
}

.quick-add-priority {
  padding: 0.375rem 0.375rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.75rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.quick-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: var(--color-primary);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 150ms ease;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
