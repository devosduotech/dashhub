<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { RssWidgetConfig } from '@/types/config'
import AppIcon from '@/components/ui/AppIcon.vue'
import { fetchFeedItems, relativeTime, type RssItem } from '@/services/rss'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as RssWidgetConfig)
const feeds = computed(() => cfg.value.feeds || [])

interface FeedState {
  url: string
  title: string
  items: RssItem[]
  loading: boolean
  error: string
}

const states = ref<FeedState[]>([])

function stateFor(url: string): FeedState | undefined {
  return states.value.find((s) => s.url === url)
}

async function loadFeed(feed: { url: string }, force = false) {
  const existing = stateFor(feed.url)
  if (existing && !force && (existing.loading || existing.items.length > 0 || existing.error)) return

  states.value = feeds.value.map((f) => {
    const prev = stateFor(f.url)
    return prev ? { ...prev } : { url: f.url, title: f.title || '', items: [], loading: false, error: '' }
  })

  const state = stateFor(feed.url)
  if (!state) return
  state.loading = true
  try {
    const max = cfg.value.itemsPerFeed || 5
    const cacheMinutes = cfg.value.cacheTime || 15
    const result = await fetchFeedItems(feed.url, { max, cacheMinutes })
    state.items = result.items
    state.title = result.title || state.title
    state.error = ''
  } catch (err) {
    state.items = []
    state.error = err instanceof Error ? err.message : 'Unable to load feed'
  } finally {
    state.loading = false
  }
}

async function loadAll() {
  await Promise.all(feeds.value.map((f) => loadFeed(f)))
}

onMounted(loadAll)
watch(
  () => [cfg.value.feeds, cfg.value.itemsPerFeed, cfg.value.cacheTime, cfg.value.showThumbnails],
  () => loadAll(),
  { deep: true }
)

const showThumbnails = computed(() => cfg.value.showThumbnails !== false)
</script>

<template>
  <div class="rss-widget">
    <div v-if="feeds.length === 0" class="empty-state">
      <p>No feeds configured.</p>
      <p v-if="editMode" class="hint">Click the gear icon to add feeds.</p>
    </div>

    <div v-else class="feeds-list">
      <div v-for="feed in feeds" :key="feed.url" class="feed-section">
        <div class="feed-header">
          <span class="feed-icon"><AppIcon name="rss" :size="14" /></span>
          <span class="feed-title">{{ stateFor(feed.url)?.title || feed.title || feed.url }}</span>
          <span v-if="feed.group" class="feed-group">{{ feed.group }}</span>
          <a :href="feed.url" target="_blank" rel="noopener noreferrer" class="feed-link" title="Open feed">
            <AppIcon name="external-link" :size="12" />
          </a>
        </div>

        <div v-if="stateFor(feed.url)?.loading" class="feed-state">
          <AppIcon name="refresh" :size="16" class="spin" /> Loading items…
        </div>
        <div v-else-if="stateFor(feed.url)?.error" class="feed-state feed-state--error">
          <AppIcon name="alert-circle" :size="16" /> {{ stateFor(feed.url)?.error }}
        </div>
        <div v-else-if="stateFor(feed.url)?.items.length" class="feed-items">
          <a
            v-for="item in stateFor(feed.url)?.items"
            :key="item.url || item.title"
            :href="item.url || feed.url"
            target="_blank"
            rel="noopener noreferrer"
            class="feed-item-link"
          >
            <img
              v-if="showThumbnails && item.thumbnail"
              :src="item.thumbnail"
              :alt="item.title"
              loading="lazy"
              class="item-thumb"
            />
            <div class="item-meta">
              <span class="item-title">{{ item.title }}</span>
              <span v-if="item.description" class="item-excerpt">{{ item.description }}</span>
              <span v-if="relativeTime(item.publishedAt)" class="item-date">{{ relativeTime(item.publishedAt) }}</span>
            </div>
          </a>
        </div>
        <div v-else class="feed-state">No items available.</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rss-widget { padding: 1rem; }
.empty-state {
  text-align: center; padding: 1.5rem;
  color: var(--color-text-muted); font-size: 0.875rem;
}
.hint { font-size: 0.75rem; color: var(--color-text-dim); margin-top: 0.5rem; }
.feeds-list { display: flex; flex-direction: column; gap: 0.75rem; }
.feed-section {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-bg-elevated);
}
.feed-header {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}
.feed-icon { display: inline-flex; align-items: center; color: var(--color-warning); flex-shrink: 0; }
.feed-title { flex: 1; font-weight: 600; font-size: 0.875rem; color: var(--color-text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.feed-group {
  font-size: 0.6875rem; padding: 0.125rem 0.5rem;
  background-color: var(--color-primary-dim); border-radius: 12px; color: var(--color-text);
}
.feed-link {
  display: inline-flex; align-items: center;
  color: var(--color-text-dim);
  &:hover { color: var(--color-primary-hover); }
}
.feed-state {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; color: var(--color-text-dim);
  padding: 0.75rem;
}
.feed-state--error { color: var(--color-danger); }
.spin { animation: dashhub-spin 900ms linear infinite; }
@keyframes dashhub-spin { to { transform: rotate(360deg); } }

.feed-items { display: flex; flex-direction: column; }
.feed-item-link {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  color: var(--color-text); text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
  &:hover { background-color: var(--color-bg-hover); }
  &:hover .item-title { color: var(--color-primary-hover); }
}
.item-thumb {
  width: 96px; height: 64px; object-fit: cover; flex-shrink: 0;
  border-radius: 4px; border: 1px solid var(--color-border);
  background-color: var(--color-bg);
}
.item-meta { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
.item-title {
  font-size: 0.8125rem; font-weight: 500; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.item-excerpt {
  font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.item-date { font-size: 0.6875rem; color: var(--color-text-dim); }
</style>