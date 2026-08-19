<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GlancesWidgetConfig } from '@/types/config'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as GlancesWidgetConfig)
const iframeKey = ref(0)

const displayMode = computed(() => cfg.value.displayMode || 'embedded')
const height = computed(() => cfg.value.height || 400)
const url = computed(() => cfg.value.url || '')
const fullWidth = computed(() => cfg.value.fullWidth === true)
const width = computed(() => {
  if (fullWidth.value) return '100%'
  const w = cfg.value.width
  if (!w || w === '100%') return '100%'
  return typeof w === 'number' ? w + 'px' : w
})

function refresh() {
  iframeKey.value++
}

function openInNewTab() {
  if (url.value) window.open(url.value, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="glances-widget" :class="{ 'full-width': fullWidth && displayMode !== 'link' }">
    <div v-if="!url" class="empty-state">
      <p>No server URL configured.</p>
      <p v-if="editMode" class="hint">Click the gear icon to configure.</p>
    </div>

    <div v-else-if="displayMode === 'link'" class="link-mode">
      <a :href="url" target="_blank" rel="noopener noreferrer" class="server-link">
        <AppIcon name="monitor" :size="16" />
        Open Glances Dashboard
      </a>
      <button v-if="cfg.ssh?.enabled" class="ssh-btn">SSH: {{ cfg.ssh.username }}@{{ cfg.ssh.host }}</button>
    </div>

    <div v-else class="iframe-container" :style="{ height: height + 'px' }">
      <iframe
        :key="iframeKey"
        :src="url"
        :style="{ width: width }"
        class="glances-iframe"
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>

    <div v-if="url && displayMode !== 'link'" class="widget-footer">
      <button v-if="cfg.ssh?.enabled" class="footer-btn ssh-link">SSH</button>
      <button class="footer-btn" @click="openInNewTab" title="Open in new tab"><AppIcon name="external-link" :size="13" /></button>
      <button class="footer-btn" @click="refresh" title="Refresh"><AppIcon name="refresh" :size="13" /></button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.glances-widget {
  display: flex;
  flex-direction: column;
}

.glances-widget.full-width {
  grid-column: 1 / -1;
}

.empty-state {
  text-align: center;
  padding: 2rem 1.5rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.hint {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-top: 0.5rem;
}

.link-mode {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.server-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  text-decoration: none;

  &:hover {
    border-color: var(--color-primary);
    text-decoration: none;
  }
}

.ssh-btn {
  padding: 0.375rem 0.75rem;
  background-color: var(--color-primary-dim);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-size: 0.8125rem;
}

.iframe-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.glances-iframe {
  height: 100%;
  border: none;
  display: block;
  margin: 0 auto;
}

.widget-footer {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-elevated);
}

.footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }
}

.ssh-link {
  color: var(--color-primary-hover);
}
</style>