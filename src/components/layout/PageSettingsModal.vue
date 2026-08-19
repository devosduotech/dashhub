<script setup lang="ts">
import { ref } from 'vue'
import { iconNames, safeIconName } from '@/utils/icons'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  pageIndex: number
  pageName: string
  pageIcon: string
  columnCount?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', updates: { name: string; icon: string; columnCount?: number }): void
}>()

const name = ref(props.pageName)
const icon = ref(props.pageIcon)
const columns = ref(props.columnCount ?? 3)

const showIconPicker = ref(false)

function save() {
  emit('update', {
    name: name.value.trim(),
    icon: icon.value,
    columnCount: columns.value
  })
  emit('close')
}

function cancel() {
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click="cancel">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Page Settings</h3>
        <button class="close-btn" @click="cancel"><AppIcon name="close" :size="18" /></button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Page Name</label>
          <input
            v-model="name"
            type="text"
            class="form-input"
            placeholder="Enter page name"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Page Icon</label>
          <div class="icon-selector">
            <button
              class="icon-preview-btn"
              @click="showIconPicker = !showIconPicker"
            >
              <AppIcon :name="safeIconName(icon)" :size="26" />
            </button>
            <span class="icon-hint">Click to pick icon</span>
          </div>

          <div v-if="showIconPicker" class="icon-picker">
            <div class="icon-grid">
              <button
                v-for="name in iconNames"
                :key="name"
                class="icon-option"
                :class="{ selected: icon === name }"
                @click="icon = name; showIconPicker = false"
                :title="name"
              ><AppIcon :name="name" :size="20" /></button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            Column Count: {{ columns }}
          </label>
          <input
            v-model.number="columns"
            type="range"
            min="1"
            max="6"
            class="form-range"
          />
          <div class="range-labels">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
          </div>
          <p class="form-hint">
            Widgets will stack vertically within each column
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="cancel">Cancel</button>
        <button class="btn btn-primary" @click="save">Save Settings</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
  }
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;

  &:hover {
    color: var(--color-text);
  }
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 0.5rem;
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
    box-shadow: 0 0 0 2px var(--color-primary-dim);
  }
}

.icon-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-preview-btn {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1.5rem;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
    background-color: var(--color-bg-hover);
  }
}

.icon-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.icon-picker {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
  gap: 0.375rem;
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

.form-range {
  width: 100%;
  margin: 0.5rem 0;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.375rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;

  &.btn-primary {
    background-color: var(--color-primary);
    color: white;
    border: none;

    &:hover {
      background-color: var(--color-primary-hover);
    }
  }

  &.btn-secondary {
    background-color: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover {
      border-color: var(--color-border-hover);
      background-color: var(--color-bg-hover);
    }
  }
}
</style>
