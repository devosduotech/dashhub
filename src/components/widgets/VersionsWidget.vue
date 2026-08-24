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
    items.value = await fetchLatestVersions(getItems(), true)
  } catch {
    items.value = getItems().map(i => ({ ...i, error: 'Fetch failed' }))
  } finally {
    loading.value = false
  }
}

refresh()
</script>

<style scoped>
.versions-widget { padding: 1rem; min-height: 80px; }

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  font-style: italic;
  padding: 1.5rem 0;
}

.versions-list {
  list-style: none; padding: 0; margin: 0;
}

.version-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.item-name { font-size: 0.8125rem; font-weight: 500; color: var(--color-text); }
.item-source { font-size: 0.625rem; color: var(--color-text-muted); margin-left: 0.375rem; }
.version-tag { font-size: 0.75rem; font-weight: 600; color: var(--color-primary); }
.version-error { font-size: 0.75rem; color: #ef4444; font-weight: 700; cursor: help; }

.versions-footer { margin-top: 0.5rem; text-align: center; }
.refresh-btn {
  padding: 0.375rem 0.75rem;
  background: var(--color-primary);
  color: var(--color-bg);
  border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem;
}
.refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>