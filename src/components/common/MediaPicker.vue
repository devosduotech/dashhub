<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { iconNames } from '@/utils/icons'
import { listUploads, uploadImage, deleteUpload, type UploadEntry } from '@/services/uploads'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  modelValue: string
  maxSizeMb?: number
  initialTab?: 'icons' | 'images'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const tab = ref<'icons' | 'images'>(props.initialTab ?? 'icons')
const uploads = ref<UploadEntry[]>([])
const loading = ref(false)
const uploading = ref(false)
const error = ref('')

function select(value: string) {
  emit('update:modelValue', value)
}

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    uploads.value = await listUploads()
  } catch {
    error.value = 'Unable to load uploaded images.'
  } finally {
    loading.value = false
  }
}

async function onUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const max = (props.maxSizeMb ?? 2) * 1024 * 1024
  if (file.size > max) {
    error.value = `Image too large. Maximum ${props.maxSizeMb ?? 2} MB.`
    return
  }
  uploading.value = true
  error.value = ''
  try {
    await uploadImage(file)
    await refresh()
  } catch {
    error.value = 'Upload failed. Unsupported format or server error.'
  } finally {
    uploading.value = false
  }
}

async function remove(entry: UploadEntry, e: Event) {
  e.stopPropagation()
  try {
    await deleteUpload(entry.name)
    uploads.value = uploads.value.filter((u) => u.name !== entry.name)
    if (props.modelValue === entry.url) select('')
  } catch {
    error.value = 'Failed to delete the image.'
  }
}

onMounted(refresh)
</script>

<template>
  <div class="media-picker">
    <div class="media-tabs">
      <button
        type="button"
        class="media-tab"
        :class="{ active: tab === 'icons' }"
        @click="tab = 'icons'"
      >Icons</button>
      <button
        type="button"
        class="media-tab"
        :class="{ active: tab === 'images' }"
        @click="tab = 'images'"
      >Images</button>
    </div>

    <p v-if="error" class="media-error">{{ error }}</p>

    <div v-if="tab === 'icons'" class="icon-grid">
      <button
        v-for="name in iconNames"
        :key="name"
        type="button"
        class="icon-option"
        :class="{ selected: modelValue === name }"
        :title="name"
        @click="select(name)"
      ><AppIcon :name="name" :size="18" /></button>
    </div>

    <div v-else class="images-panel">
      <div class="upload-row">
        <label class="btn upload-btn">
          {{ uploading ? 'Uploading\u2026' : 'Upload image' }}
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden @change="onUpload" />
        </label>
      </div>
      <p v-if="loading" class="media-hint">Loading uploaded images\u2026</p>
      <p v-else-if="uploads.length === 0" class="media-hint">No uploaded images yet. Upload one to reuse it across widgets.</p>
      <div v-else class="image-grid">
        <div
          v-for="up in uploads"
          :key="up.name"
          class="image-tile"
          :class="{ selected: modelValue === up.url }"
          :title="up.name"
          @click="select(up.url)"
        >
          <img :src="up.url" :alt="up.name" loading="lazy" />
          <button
            type="button"
            class="image-delete"
            title="Delete image"
            @click="remove(up, $event)"
          ><AppIcon name="close" :size="12" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.media-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.media-tabs {
  display: flex;
  gap: 0.25rem;

  .media-tab {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text-muted);
    cursor: pointer;

    &.active {
      background-color: var(--color-primary-dim);
      border-color: var(--color-primary);
      color: var(--color-text);
    }

    &:hover {
      border-color: var(--color-border-hover);
    }
  }
}

.media-error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-danger);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(2rem, 1fr));
  gap: 0.125rem;
  max-height: 200px;
  overflow-y: auto;

  .icon-option {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 1.125rem;
    cursor: pointer;
    color: var(--color-text);

    &:hover {
      background-color: var(--color-bg-hover);
      border-color: var(--color-border);
    }

    &.selected {
      background-color: var(--color-primary-dim);
      border-color: var(--color-primary);
    }
  }
}

.images-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  background-color: var(--color-primary);
  border: 1px solid var(--color-primary);
  color: white;
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background-color: var(--color-primary-hover);
  }
}

.media-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.image-tile {
  position: relative;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  &.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-dim);
  }

  .image-delete {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 1.25rem;
    height: 1.25rem;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    line-height: 1;
    color: white;
    background-color: var(--color-danger);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
  }

  &:hover .image-delete {
    display: flex;
  }
}
</style>