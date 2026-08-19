<script setup lang="ts">
import { ref } from 'vue'
import type { YouTubeChannel } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

function getConfig(): { channels: YouTubeChannel[]; videosPerChannel?: number; displayMode?: string; thumbnailSize?: string; cacheTime?: number } {
  return props.config as { channels: YouTubeChannel[]; videosPerChannel?: number; displayMode?: string; thumbnailSize?: string; cacheTime?: number }
}

const editingIndex = ref(-1)
const editChannel = ref<YouTubeChannel>({ id: '', name: '' })

function addChannel() {
  editingIndex.value = getConfig().channels.length
  editChannel.value = { id: '', name: '' }
}

function editChannelItem(index: number) {
  editingIndex.value = index
  editChannel.value = { ...getConfig().channels[index] }
}

function saveChannel() {
  const cfg = { ...getConfig() }
  if (!cfg.channels) cfg.channels = []
  if (editingIndex.value >= 0 && editingIndex.value < cfg.channels.length) {
    cfg.channels[editingIndex.value] = { ...editChannel.value }
  } else {
    cfg.channels.push({ ...editChannel.value })
  }
  emit('update', { ...props.config, channels: cfg.channels })
  editingIndex.value = -1
}

function deleteChannel(index: number) {
  const cfg = { ...getConfig() }
  cfg.channels.splice(index, 1)
  emit('update', { ...props.config, channels: cfg.channels })
}

function cancelEdit() {
  editingIndex.value = -1
}

function updateField(field: string, value: unknown) {
  emit('update', { ...props.config, [field]: value })
}
</script>

<template>
  <div class="youtube-form">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Videos Per Channel</label>
        <input
          :value="getConfig().videosPerChannel || 3"
          type="number"
          class="form-input"
          min="1"
          @input="updateField('videosPerChannel', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <div class="form-group">
        <label class="form-label">Thumbnail Size</label>
        <select :value="getConfig().thumbnailSize || 'medium'" class="form-input" @change="updateField('thumbnailSize', ($event.target as HTMLSelectElement).value)">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Display Mode</label>
        <select :value="getConfig().displayMode || 'grid'" class="form-input" @change="updateField('displayMode', ($event.target as HTMLSelectElement).value)">
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Cache Time (minutes)</label>
        <input
          :value="getConfig().cacheTime || 60"
          type="number"
          class="form-input"
          min="1"
          @input="updateField('cacheTime', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <div class="channels-section">
      <div class="section-header">
        <span class="section-label">Channels ({{ getConfig().channels?.length || 0 }})</span>
        <button class="btn btn-small btn-primary" @click="addChannel">+ Add Channel</button>
      </div>

      <div v-if="editingIndex >= 0" class="channel-editor">
        <div class="form-group">
          <label class="form-label">Channel ID</label>
          <input v-model="editChannel.id" type="text" class="form-input" placeholder="UCXuqSBlHAE6Xw-yeJA0Tunw" />
          <span class="form-hint">From YouTube channel URL: youtube.com/channel/CHANNEL_ID</span>
        </div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input v-model="editChannel.name" type="text" class="form-input" placeholder="Linus Tech Tips" />
        </div>
        <div class="form-actions">
          <button class="btn btn-small btn-secondary" @click="cancelEdit">Cancel</button>
          <button class="btn btn-small btn-primary" @click="saveChannel">Save Channel</button>
        </div>
      </div>

      <div v-else class="channels-list">
        <div v-if="!getConfig().channels || getConfig().channels.length === 0" class="empty-hint">
          No channels yet. Click "Add Channel" to add one.
        </div>
        <div v-for="(channel, index) in (getConfig().channels || [])" :key="index" class="channel-item">
          <div class="channel-info">
            <span class="channel-name">{{ channel.name || channel.id }}</span>
            <span class="channel-id">{{ channel.id }}</span>
          </div>
          <div class="channel-actions">
            <button class="btn btn-small" @click="editChannelItem(index)">Edit</button>
            <button class="btn btn-small btn-danger" @click="deleteChannel(index)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.youtube-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-muted); }
.form-hint { font-size: 0.75rem; color: var(--color-text-dim); }
.form-input {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  &:focus { outline: none; border-color: var(--color-primary); }
}
.channels-section { border-top: 1px solid var(--color-border); padding-top: 1rem; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.section-label { font-weight: 600; font-size: 0.875rem; color: var(--color-text); }
.channel-editor {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.channels-list { display: flex; flex-direction: column; gap: 0.5rem; }
.empty-hint {
  padding: 1.5rem; text-align: center;
  color: var(--color-text-muted); font-size: 0.875rem;
  border: 2px dashed var(--color-border); border-radius: 8px;
}
.channel-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: 6px;
}
.channel-info { flex: 1; display: flex; flex-direction: column; }
.channel-name { font-weight: 500; font-size: 0.875rem; color: var(--color-text); }
.channel-id { font-size: 0.75rem; color: var(--color-text-dim); word-break: break-all; }
.channel-actions { display: flex; gap: 0.25rem; }
.btn {
  padding: 0.375rem 0.875rem; border: 1px solid var(--color-border);
  border-radius: 6px; font-size: 0.8125rem;
  background-color: var(--color-surface); color: var(--color-text); cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); }
}
.btn-small { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
.btn-primary {
  background-color: var(--color-primary); color: white; border-color: var(--color-primary);
  &:hover { background-color: var(--color-primary-hover); }
}
.btn-secondary { background-color: var(--color-surface); color: var(--color-text); }
.btn-danger {
  color: var(--color-danger); border-color: var(--color-border);
  &:hover { background-color: var(--color-danger); color: white; }
}
</style>