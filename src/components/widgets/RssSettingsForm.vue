<script setup lang="ts">
import { ref } from 'vue'
import type { RssFeed } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

function getConfig(): { feeds: RssFeed[]; itemsPerFeed?: number; showThumbnails?: boolean; cacheTime?: number } {
  return props.config as { feeds: RssFeed[]; itemsPerFeed?: number; showThumbnails?: boolean; cacheTime?: number }
}

const editingIndex = ref(-1)
const editFeed = ref<RssFeed>({ url: '', title: '', icon: '', group: '' })

function addFeed() {
  editingIndex.value = getConfig().feeds.length
  editFeed.value = { url: '', title: '', icon: '', group: '' }
}

function editFeedItem(index: number) {
  editingIndex.value = index
  editFeed.value = { ...getConfig().feeds[index] }
}

function saveFeed() {
  const cfg = { ...getConfig() }
  if (!cfg.feeds) cfg.feeds = []
  if (editingIndex.value >= 0 && editingIndex.value < cfg.feeds.length) {
    cfg.feeds[editingIndex.value] = { ...editFeed.value }
  } else {
    cfg.feeds.push({ ...editFeed.value })
  }
  emit('update', { ...props.config, feeds: cfg.feeds })
  editingIndex.value = -1
}

function deleteFeed(index: number) {
  const cfg = { ...getConfig() }
  cfg.feeds.splice(index, 1)
  emit('update', { ...props.config, feeds: cfg.feeds })
}

function cancelEdit() {
  editingIndex.value = -1
}

function updateField(field: string, value: unknown) {
  emit('update', { ...props.config, [field]: value })
}
</script>

<template>
  <div class="rss-form">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Items Per Feed</label>
        <input
          :value="getConfig().itemsPerFeed || 5"
          type="number"
          class="form-input"
          min="1"
          @input="updateField('itemsPerFeed', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <div class="form-group">
        <label class="form-label">Cache Time (minutes)</label>
        <input
          :value="getConfig().cacheTime || 15"
          type="number"
          class="form-input"
          min="1"
          @input="updateField('cacheTime', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <label class="checkbox-label">
      <input
        type="checkbox"
        :checked="getConfig().showThumbnails !== false"
        @change="updateField('showThumbnails', ($event.target as HTMLInputElement).checked)"
      />
      Show Thumbnails
    </label>

    <div class="feeds-section">
      <div class="section-header">
        <span class="section-label">Feeds ({{ getConfig().feeds?.length || 0 }})</span>
        <button class="btn btn-small btn-primary" @click="addFeed">+ Add Feed</button>
      </div>

      <div v-if="editingIndex >= 0" class="feed-editor">
        <div class="form-group">
          <label class="form-label">Feed URL</label>
          <input v-model="editFeed.url" type="text" class="form-input" placeholder="https://news.ycombinator.com/rss" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input v-model="editFeed.title" type="text" class="form-input" placeholder="Hacker News" />
          </div>
          <div class="form-group">
            <label class="form-label">Group</label>
            <input v-model="editFeed.group" type="text" class="form-input" placeholder="Tech" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-small btn-secondary" @click="cancelEdit">Cancel</button>
          <button class="btn btn-small btn-primary" @click="saveFeed">Save Feed</button>
        </div>
      </div>

      <div v-else class="feeds-list">
        <div v-if="!getConfig().feeds || getConfig().feeds.length === 0" class="empty-hint">
          No feeds yet. Click "Add Feed" to create one.
        </div>
        <div v-for="(feed, index) in (getConfig().feeds || [])" :key="index" class="feed-item">
          <div class="feed-info">
            <span class="feed-title">{{ feed.title || feed.url }}</span>
            <span class="feed-url">{{ feed.url }}</span>
          </div>
          <span v-if="feed.group" class="feed-group">{{ feed.group }}</span>
          <div class="feed-actions">
            <button class="btn btn-small" @click="editFeedItem(index)">Edit</button>
            <button class="btn btn-small btn-danger" @click="deleteFeed(index)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rss-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-muted); }
.form-input {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  &:focus { outline: none; border-color: var(--color-primary); }
}
.checkbox-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; color: var(--color-text); cursor: pointer;
  input { width: 1rem; height: 1rem; }
}
.feeds-section { border-top: 1px solid var(--color-border); padding-top: 1rem; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.section-label { font-weight: 600; font-size: 0.875rem; color: var(--color-text); }
.feed-editor {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.feeds-list { display: flex; flex-direction: column; gap: 0.5rem; }
.empty-hint {
  padding: 1.5rem; text-align: center;
  color: var(--color-text-muted); font-size: 0.875rem;
  border: 2px dashed var(--color-border); border-radius: 8px;
}
.feed-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: 6px;
}
.feed-info { flex: 1; display: flex; flex-direction: column; }
.feed-title { font-weight: 500; font-size: 0.875rem; color: var(--color-text); }
.feed-url { font-size: 0.75rem; color: var(--color-text-dim); word-break: break-all; }
.feed-group {
  font-size: 0.75rem; padding: 0.125rem 0.5rem;
  background-color: var(--color-primary-dim); border-radius: 12px; color: var(--color-text);
}
.feed-actions { display: flex; gap: 0.25rem; }
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