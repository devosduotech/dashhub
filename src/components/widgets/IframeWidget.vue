<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IframeWidgetConfig } from '@/types/config'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as IframeWidgetConfig)
const iframeKey = ref(0)

const url = computed(() => cfg.value.url || '')
const height = computed(() => cfg.value.height || 400)
const fullWidth = computed(() => cfg.value.fullWidth === true)
const width = computed(() => {
  if (fullWidth.value) return '100%'
  const w = cfg.value.width
  if (!w || w === '100%') return '100%'
  return typeof w === 'number' ? w + 'px' : w
})
const allowFullscreen = computed(() => cfg.value.allowFullscreen !== false)

function refresh() {
  iframeKey.value++
}
</script>

<template>
  <div class="iframe-widget" :class="{ 'full-width': fullWidth }">
    <div v-if="!url" class="empty-state">
      <p>No URL configured.</p>
      <p v-if="editMode" class="hint">Click the gear icon to configure.</p>
    </div>

    <div v-else class="iframe-container" :style="{ height: height + 'px' }">
      <iframe
        :key="iframeKey"
        :src="url"
        :style="{ width: width }"
        class="embed-iframe"
        frameborder="0"
        :allowfullscreen="allowFullscreen"
      ></iframe>
    </div>

    <div v-if="url" class="iframe-footer">
      <span class="width-indicator" v-if="!fullWidth">{{ width }}</span>
      <button class="footer-btn" @click="refresh" title="Refresh"><AppIcon name="refresh" :size="13" /> Refresh</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.iframe-widget {
  display: flex;
  flex-direction: column;
}

.iframe-widget.full-width {
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

.iframe-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.embed-iframe {
  height: 100%;
  border: none;
  display: block;
  margin: 0 auto;
}

.iframe-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.5rem;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-elevated);
}

.width-indicator {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-right: auto;
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
</style>