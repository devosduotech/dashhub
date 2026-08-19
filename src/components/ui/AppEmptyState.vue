<script setup lang="ts">
import AppLogo from './AppLogo.vue'
import AppIcon from './AppIcon.vue'

defineProps<{
  title: string
  message?: string
  ctaText?: string
  icon?: 'dashboard' | 'server' | 'image'
}>()

defineEmits<{
  (e: 'cta'): void
}>()
</script>

<template>
  <div class="app-empty-state">
    <div class="empty-mark">
      <AppLogo v-if="!icon" variant="mark" :size="48" />
      <AppIcon v-else :name="icon" :size="36" class="empty-icon" />
    </div>
    <h2 class="empty-title">{{ title }}</h2>
    <p v-if="message" class="empty-message">{{ message }}</p>
    <button v-if="ctaText" type="button" class="empty-cta" @click="$emit('cta')">
      <AppIcon name="plus" :size="16" />
      {{ ctaText }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.app-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 14px;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  margin-bottom: 0.5rem;
}

.empty-icon {
  color: var(--color-text-muted);
}

.empty-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.empty-message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  max-width: 32rem;
  line-height: 1.5;
}

.empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.75rem;
  padding: 0.625rem 1.25rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease;

  &:hover {
    background-color: var(--color-primary-hover);
  }
}
</style>