<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { YouTubeWidgetConfig } from '@/types/config'
import AppIcon from '@/components/ui/AppIcon.vue'
import { fetchChannelVideos, thumbnailFor, relativeTime, type YouTubeVideo } from '@/services/youtube'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as YouTubeWidgetConfig)
const channels = computed(() => cfg.value.channels || [])

interface ChannelState {
  channelId: string
  videos: YouTubeVideo[]
  loading: boolean
  error: string
}

const states = ref<ChannelState[]>([])

function stateFor(id: string): ChannelState | undefined {
  return states.value.find((s) => s.channelId === id)
}

async function loadChannel(channel: { id: string }, force = false) {
  const existing = stateFor(channel.id)
  if (existing && !force && (existing.loading || existing.videos.length > 0 || existing.error)) return

  states.value = channels.value.map((c) => {
    const prev = stateFor(c.id)
    return prev ? { ...prev } : { channelId: c.id, videos: [], loading: false, error: '' }
  })

  const state = stateFor(channel.id)
  if (!state) return
  state.loading = true
  try {
    const max = cfg.value.videosPerChannel || 3
    const cacheMinutes = cfg.value.cacheTime || 60
    const result = await fetchChannelVideos(channel.id, { max, cacheMinutes })
    state.videos = result.videos
    state.error = ''
  } catch (err) {
    state.videos = []
    state.error = err instanceof Error ? err.message : 'Unable to load videos'
  } finally {
    state.loading = false
  }
}

async function loadAll() {
  await Promise.all(channels.value.map((c) => loadChannel(c)))
}

onMounted(loadAll)
watch(
  () => [cfg.value.channels, cfg.value.videosPerChannel, cfg.value.cacheTime, cfg.value.displayMode],
  () => loadAll(),
  { deep: true }
)

function channelUrl(id: string) {
  return `https://www.youtube.com/channel/${id}`
}

const displayMode = computed(() => cfg.value.displayMode || 'grid')
const thumbnailSize = computed(() => cfg.value.thumbnailSize || 'medium')
</script>

<template>
  <div class="youtube-widget">
    <div v-if="channels.length === 0" class="empty-state">
      <p>No channels configured.</p>
      <p v-if="editMode" class="hint">Click the gear icon to add channels.</p>
    </div>

    <div v-else class="channels-list" :class="`channels-list--${displayMode}`">
      <div v-for="channel in channels" :key="channel.id" class="channel-block">
        <div class="channel-heading">
          <AppIcon name="youtube" :size="20" class="channel-icon" />
          <span class="channel-name">{{ channel.name || channel.id }}</span>
          <a
            :href="channelUrl(channel.id)"
            target="_blank"
            rel="noopener noreferrer"
            class="channel-link"
          ><AppIcon name="external-link" :size="12" /> View Channel</a>
        </div>

        <div v-if="stateFor(channel.id)?.loading" class="feed-state">
          <AppIcon name="refresh" :size="16" class="spin" /> Loading videos…
        </div>
        <div v-else-if="stateFor(channel.id)?.error" class="feed-state feed-state--error">
          <AppIcon name="alert-circle" :size="16" /> {{ stateFor(channel.id)?.error }}
        </div>
        <div v-else-if="stateFor(channel.id)?.videos.length" class="video-list" :class="`video-list--${displayMode}`">
          <a
            v-for="video in stateFor(channel.id)?.videos"
            :key="video.id || video.url"
            :href="video.url"
            target="_blank"
            rel="noopener noreferrer"
            class="video-card"
          >
            <div class="video-thumb" :class="`video-thumb--${thumbnailSize}`">
              <img :src="thumbnailFor(video, thumbnailSize)" :alt="video.title" loading="lazy" />
            </div>
            <div class="video-meta">
              <span class="video-title">{{ video.title }}</span>
              <span v-if="relativeTime(video.publishedAt)" class="video-date">{{ relativeTime(video.publishedAt) }}</span>
            </div>
          </a>
        </div>
        <div v-else class="feed-state">No videos available.</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.youtube-widget { padding: 1rem; }
.empty-state {
  text-align: center; padding: 1.5rem;
  color: var(--color-text-muted); font-size: 0.875rem;
}
.hint { font-size: 0.75rem; color: var(--color-text-dim); margin-top: 0.5rem; }
.channels-list { display: flex; flex-direction: column; gap: 1rem; }
.channel-block {
  display: flex; flex-direction: column; gap: 0.625rem;
  padding: 0.75rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 8px;
}
.channel-heading { display: flex; align-items: center; gap: 0.5rem; }
.channel-icon { color: var(--color-danger); flex-shrink: 0; }
.channel-name { font-weight: 600; font-size: 0.875rem; color: var(--color-text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.channel-link {
  display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: 0.75rem; color: var(--color-primary-hover); flex-shrink: 0;
}
.feed-state {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; color: var(--color-text-dim);
  padding: 0.375rem 0;
}
.feed-state--error { color: var(--color-danger); }
.spin { animation: dashhub-spin 900ms linear infinite; }
@keyframes dashhub-spin { to { transform: rotate(360deg); } }

.video-list { display: grid; gap: 0.625rem; }
.video-list--grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
.video-list--list { grid-template-columns: 1fr; }
.video-card {
  display: flex; flex-direction: column; gap: 0.375rem;
  color: var(--color-text); text-decoration: none;
  &:hover .video-thumb { border-color: var(--color-border-hover); }
}
.video-thumb {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-bg);
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
}
.video-thumb--small { max-height: 100px; }
.video-thumb--medium { max-height: 160px; }
.video-thumb--large { max-height: 220px; }
.video-meta { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
.video-title {
  font-size: 0.8125rem; line-height: 1.35; color: var(--color-text);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.video-date { font-size: 0.75rem; color: var(--color-text-dim); }

.video-list--list .video-card { flex-direction: row; align-items: flex-start; }
.video-list--list .video-thumb { width: 160px; flex-shrink: 0; }
.video-list--list .video-thumb--small { width: 120px; }
.video-list--list .video-thumb--large { width: 220px; }
.video-list--list .video-meta { flex: 1; }
</style>