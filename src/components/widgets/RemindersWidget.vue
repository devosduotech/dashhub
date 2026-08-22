<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RemindersWidgetConfig } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

const cfg = computed(() => props.config as RemindersWidgetConfig)
const items = computed(() => cfg.value.items || [])
const showCompleted = computed(() => cfg.value.showCompleted !== false)
const sortBy = computed(() => cfg.value.sortBy || 'created')

const newNoteText = ref('')
const newNotePriority = ref<'low' | 'medium' | 'high'>('medium')

const sortedItems = computed(() => {
  const filtered = showCompleted.value ? [...items.value] : items.value.filter(i => !i.completed)
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return filtered.sort((a, b) => {
    if (sortBy.value === 'priority') {
      return (priorityOrder[a.priority || 'medium'] ?? 1) - (priorityOrder[b.priority || 'medium'] ?? 1)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

function addNote() {
  const text = newNoteText.value.trim()
  if (!text) return
  const allItems = [...items.value, {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    completed: false,
    priority: newNotePriority.value,
    createdAt: new Date().toISOString()
  }]
  emit('update', { ...props.config, items: allItems })
  newNoteText.value = ''
}

function toggleComplete(id: string) {
  const allItems = items.value.map(i =>
    i.id === id ? { ...i, completed: !i.completed } : i
  )
  emit('update', { ...props.config, items: allItems })
}

function deleteNote(id: string) {
  const allItems = items.value.filter(i => i.id !== id)
  emit('update', { ...props.config, items: allItems })
}
</script>

<template>
  <div class="reminders-widget">
    <div v-if="sortedItems.length === 0 && !newNoteText" class="empty-state">
      <p>No reminders yet.</p>
    </div>

    <div v-if="sortedItems.length > 0" class="reminders-list">
      <div
        v-for="item in sortedItems"
        :key="item.id"
        class="reminder-item"
        :class="{ completed: item.completed }"
      >
        <input
          type="checkbox"
          class="reminder-checkbox"
          :checked="item.completed"
          @change="toggleComplete(item.id)"
        />
        <div class="reminder-content" :class="'priority-bar-' + (item.priority || 'medium')">
          <span class="reminder-text">{{ item.text }}</span>
        </div>
        <span class="reminder-priority" :class="'priority-' + (item.priority || 'medium')">
          {{ item.priority || 'medium' }}
        </span>
        <button class="reminder-delete" @click="deleteNote(item.id)" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>

    <div class="quick-add">
      <input
        v-model="newNoteText"
        type="text"
        class="quick-add-input"
        placeholder="Add a reminder..."
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
.reminders-widget { padding: 1rem; }

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  p { margin: 0; }
}

.reminders-list { display: flex; flex-direction: column; }

.reminder-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 150ms ease;

  &:last-child { border-bottom: none; }
  &:hover { background-color: var(--color-bg-hover); .reminder-delete { opacity: 1; } }

  &.completed {
    .reminder-text { text-decoration: line-through; color: var(--color-text-muted); }
  }
}

.reminder-checkbox {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.reminder-content {
  flex: 1;
  min-width: 0;
  border-left: 3px solid transparent;
  padding-left: 0.5rem;

  &.priority-bar-high { border-left-color: var(--color-danger, #ef4444); }
  &.priority-bar-medium { border-left-color: var(--color-primary, #6366f1); }
  &.priority-bar-low { border-left-color: var(--color-text-muted, #888); }
}
.reminder-text { font-size: 0.875rem; color: var(--color-text); line-height: 1.4; }

.reminder-priority {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
  padding: 0.1rem 0.375rem;
  border-radius: 4px;

  &.priority-high { color: var(--color-danger); background-color: var(--color-danger-dim); }
  &.priority-medium { color: var(--color-primary); background-color: var(--color-primary-dim); }
  &.priority-low { color: var(--color-text-muted); background-color: var(--color-bg); }
}

.reminder-delete {
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

  &:hover { color: var(--color-danger); background-color: var(--color-danger-dim); }
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

  &:focus { outline: none; border-color: var(--color-primary); }
  &::placeholder { color: var(--color-text-dim); }
}

.quick-add-priority {
  padding: 0.375rem 0.375rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.75rem;
  cursor: pointer;

  &:focus { outline: none; border-color: var(--color-primary); }
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

  &:hover:not(:disabled) { background-color: var(--color-primary-hover); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
</style>
