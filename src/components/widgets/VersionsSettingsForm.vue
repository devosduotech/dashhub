<template>
  <div class="versions-settings-form">
    <div class="items-list">
      <div v-for="(item, idx) in items" :key="idx" class="item-row">
        <input :value="item.name" placeholder="Display name" class="input name-input"
          @input="updateItem(idx, 'name', ($event.target as HTMLInputElement).value)" />
        <select :value="item.source" class="input source-input"
          @change="updateItem(idx, 'source', ($event.target as HTMLSelectElement).value)">
          <option value="npm">npm</option>
          <option value="github">GitHub</option>
          <option value="pypi">PyPI</option>
        </select>
        <input :value="item.identifier" placeholder="Package / repo" class="input id-input"
          @input="updateItem(idx, 'identifier', ($event.target as HTMLInputElement).value)" />
        <button @click="removeItem(idx)" class="remove-btn" title="Remove">✕</button>
      </div>
    </div>
    <button @click="addItem" class="add-btn">+ Add Package</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

const props = defineProps<{
  config: Record<string, unknown>
}>()

interface Item { name: string; source: string; identifier: string }

function getItems(): Item[] {
  return (props.config?.['items'] as Item[] || []).map(i => ({ ...i }))
}

const items = computed(() => getItems())

function emitUpdate(newItems: Item[]) {
  emit('update', { ...props.config, items: newItems })
}

function updateItem(idx: number, field: string, value: string) {
  const list = getItems()
  list[idx] = { ...list[idx], [field]: value }
  emitUpdate(list)
}

function addItem() {
  emitUpdate([...getItems(), { name: '', source: 'npm', identifier: '' }])
}

function removeItem(idx: number) {
  emitUpdate(getItems().filter((_, i) => i !== idx))
}
</script>

<style scoped>
.items-list { max-height: 200px; overflow-y: auto; margin-bottom: 8px; }
.item-row { display: flex; gap: 4px; margin-bottom: 4px; align-items: center; }
.input {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--color-text);
}
.input:focus { outline: none; border-color: var(--color-primary); }
.name-input { flex: 2; }
.source-input { flex: 1.2; }
.id-input { flex: 3; }
.remove-btn {
  background: none; border: none; cursor: pointer; color: #ef4444;
  font-size: 14px; padding: 2px 4px;
}
.add-btn {
  padding: 0.5rem 0.75rem; background: var(--color-primary);
  color: var(--color-bg);
  border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;
}
</style>