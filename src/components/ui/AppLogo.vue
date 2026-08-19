<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'mark' | 'full'
  size?: number
}>(), {
  variant: 'full',
  size: 32
})
</script>

<template>
  <span class="app-logo" :class="`variant-${variant}`" role="img" aria-label="DashHub">
    <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" aria-hidden="true" class="logo-mark">
      <rect x="1" y="1" width="30" height="30" rx="7.5" fill="var(--color-primary)" />
      <rect x="8" y="8" width="7" height="9" rx="1.5" fill="#ffffff" opacity="0.95" />
      <rect x="17" y="8" width="7" height="5" rx="1.5" fill="#ffffff" opacity="0.7" />
      <rect x="17" y="16" width="7" height="9" rx="1.5" fill="#ffffff" opacity="0.95" />
      <rect x="8" y="19" width="7" height="5" rx="1.5" fill="#ffffff" opacity="0.7" />
    </svg>
    <span v-if="variant === 'full'" class="logo-word">DashHub</span>
  </span>
</template>

<style scoped lang="scss">
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-mark {
  flex-shrink: 0;
}

.logo-word {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
  white-space: nowrap;
}
</style>