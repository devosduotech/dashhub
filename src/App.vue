<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import EditModeToolbar from '@/components/layout/EditModeToolbar.vue'
import PageTabs from '@/components/layout/PageTabs.vue'
import Footer from '@/components/layout/Footer.vue'

const store = useConfigStore()

const appFontSize = computed(() => store.appConfig.fontSize ?? 100)

onMounted(() => {
  store.loadConfig()
})
</script>

<template>
  <div class="app-shell" :class="{ editing: store.editMode }" :style="{ fontSize: appFontSize + '%' }">
    <EditModeToolbar />
    <PageTabs />
    <RouterView />
    <Footer />
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: background-color 150ms ease;

  &.editing {
    background-color: var(--color-bg-editing, var(--color-bg));
  }
}
</style>