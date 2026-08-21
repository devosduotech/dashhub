<template>
  <div class="versions-widget">
    <div v-if="items.length === 0" class="empty-state">
      No items configured. Add packages in settings.
    </div>
    <ul v-else class="versions-list">
      <li v-for="(item, idx) in items" :key="idx" class="version-item">
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-source">{{ item.source }}</span>
        </div>
        <div class="item-version">
          <span v-if="item.error" class="version-error" :title="item.error">!</span>
          <span v-else class="version-tag">{{ item.latestVersion || '—' }}</span>
        </div>
      </li>
    </ul>
    <div class="versions-footer">
      <button @click="refresh" class="refresh-btn" :disabled="loading">
        <AppIcon name="refresh" :size="14" /> {{ loading ? 'Checking…' : 'Refresh' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fetchLatestVersions, type VersionItem } from '@/services/versions'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const items = ref<VersionItem[]>([])
const loading = ref(false)

function getItems(): VersionItem[] {
  const raw = props.config?.['items'] as any[] || []
  return raw.map((r: any) => ({
    name: r.name || r.identifier,
    source: r.source || 'npm',
    identifier: r.identifier || r.name,
    latestVersion: r.latestVersion,
    publishedAt: r.publishedAt,
    url: r.url,
    error: r.error
  }))
}

async function refresh() {
  loading.value = true
  try {
    items.value = await fetchLatestVersions(getItems())
  } catch {
    items.value = getItems().map(i => ({ ...i, error: 'Fetch failed' }))
  } finally {
    loading.value = false
  }
}

refresh()
</script>

<style scoped>
.versions-widget { font-family: inherit; min-height: 80px; }

.empty-state {
  text-align: center;
  color: var(--widget-text-color-muted, var(--text-color));
  font-style: italic;
  padding: 20px 0;
}

.versions-list {
  list-style: none; padding: 0; margin: 0;
  max-height: 220px; overflow-y: auto;
}

.version-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.item-name { font-size: 13px; font-weight: 500; color: var(--widget-text-color, var(--text-color)); }
.item-source { font-size: 10px; color: var(--widget-text-color-muted, var(--text-color)); margin-left: 6px; }
.version-tag { font-size: 12px; font-weight: 600; color: var(--widget-accent-color, var(--primary-color)); }
.version-error { font-size: 12px; color: #ef4444; font-weight: 700; cursor: help; }

.versions-footer { margin-top: 8px; text-align: center; }
.refresh-btn {
  padding: 4px 12px;
  background: var(--button-bg-color, var(--primary-color));
  color: var(--button-text-color, var(--bg-color));
  border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
}
.refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>