<script setup lang="ts">
import { computed } from 'vue'
import { ICONS, type IconName } from '@/utils/iconPaths'

const props = withDefaults(defineProps<{
  name: IconName
  size?: number | string
}>(), {
  size: 16
})

const parts = computed(() => ICONS[props.name])
const strokeWidth = computed(() => (props.name === 'spinner' ? 2.5 : 2))

function strokeClass(name: IconName): string {
  if (name === 'spinner') return 'animate-spin'
  return ''
}
</script>

<template>
  <svg
    v-if="parts"
    class="app-icon"
    :class="strokeClass(name)"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-for="(part, i) in parts" :key="i">
      <path v-if="part.t === 'path'" :d="part.d" :fill="part.fill ? 'currentColor' : 'none'" />
      <circle v-else-if="part.t === 'circle'" :cx="part.cx" :cy="part.cy" :r="part.r" :fill="part.fill ? 'currentColor' : 'none'" />
      <ellipse v-else-if="part.t === 'ellipse'" :cx="part.cx" :cy="part.cy" :rx="part.rx" :ry="part.ry" />
      <line v-else-if="part.t === 'line'" :x1="part.x1" :y1="part.y1" :x2="part.x2" :y2="part.y2" />
      <rect v-else-if="part.t === 'rect'" :x="part.x" :y="part.y" :width="part.w" :height="part.h" :rx="part.rx ?? 0" />
      <polyline v-else-if="part.t === 'poly'" :points="part.points" :fill="part.fill ? 'currentColor' : 'none'" />
    </template>
  </svg>
  <span v-else class="app-icon-fallback" :style="{ fontSize: typeof size === 'number' ? size + 'px' : size }">?</span>
</template>

<style scoped lang="scss">
.app-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.app-icon.animate-spin {
  animation: app-icon-spin 0.9s linear infinite;
}

@keyframes app-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

.app-icon-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: var(--color-text-muted);
}
</style>