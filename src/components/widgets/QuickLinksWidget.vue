<script setup lang="ts">
import { computed } from 'vue'
import type { QuickLink, QuickLinksWidgetConfig } from '@/types/config'
import { isImageIcon, safeIconName } from '@/utils/icons'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as QuickLinksWidgetConfig)
const links = computed(() => cfg.value.links || [])
const columns = computed(() => cfg.value.columns || 3)
const displayMode = computed(() => cfg.value.displayMode || 'grid')

const groupedLinks = computed(() => {
  const groups: Record<string, QuickLink[]> = {}
  for (const link of links.value) {
    const cat = link.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(link)
  }
  return groups
})

function getTarget(target?: string): string {
  if (target === 'sametab') return '_self'
  if (target === 'modal') return '_self'
  return '_blank'
}
</script>

<template>
  <div class="quick-links-widget">
    <div v-if="links.length === 0" class="empty-state">
      <p>No links configured.</p>
      <p v-if="editMode" class="hint">Click the gear icon above to add links.</p>
    </div>

    <div v-else class="links-container" :class="{ 'list-mode': displayMode === 'list' }">
      <div v-for="(groupLinks, category) in groupedLinks" :key="category" class="link-group">
        <div v-if="Object.keys(groupedLinks).length > 1" class="group-title">{{ category }}</div>
        <div class="link-grid" :style="{ gridTemplateColumns: displayMode === 'list' ? '1fr' : `repeat(${columns}, 1fr)` }">
          <a
            v-for="(link, i) in groupLinks"
            :key="i"
            :href="link.url"
            :target="getTarget(link.target)"
            rel="noopener noreferrer"
            class="link-tile"
            :class="{ 'list-item': displayMode === 'list' }"
          >
            <span class="link-icon" v-if="isImageIcon(link.icon)">
              <img :src="link.icon" :alt="link.title" class="link-icon-img" @error="($event.target as HTMLImageElement).style.display = 'none'" />
            </span>
            <span class="link-icon" v-else><AppIcon :name="safeIconName(link.icon)" :size="20" /></span>
            <span class="link-text">
              <span class="link-title">{{ link.title }}</span>
              <span v-if="link.description" class="link-desc">{{ link.description }}</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-links-widget {
  padding: 1rem;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.hint {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-top: 0.5rem;
}

.links-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.link-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.link-grid {
  display: grid;
  gap: 0.5rem;
}

.link-tile {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  transition: all 150ms ease;

  &:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-primary);
    text-decoration: none;
    transform: translateY(-1px);
  }
}

.link-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  width: 2rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.link-icon-img {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
  border-radius: 4px;
}

.link-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.link-title {
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}
</style>