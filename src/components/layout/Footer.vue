<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'

const store = useConfigStore()
const router = useRouter()
const footerText = computed(() => store.appConfig.footerText ?? '© 2026 OSDuo Tech, Bengaluru')
const showFooter = computed(() => store.appConfig.showFooter ?? true)
</script>

<template>
  <footer v-if="showFooter" class="app-footer">
    <div class="footer-content">
      <span class="footer-text">{{ footerText }}</span>
      <span class="footer-sep">·</span>
      <button class="footer-link" @click="router.push('/help')">Documentation</button>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
  padding: 0.625rem 1.5rem;
  text-align: center;
  flex-shrink: 0;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.footer-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.footer-sep {
  margin: 0 0.5rem;
  color: var(--color-border);
}

.footer-link {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  text-decoration: none;

  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }
}
</style>