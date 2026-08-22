<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import EditModeToolbar from '@/components/layout/EditModeToolbar.vue'
import PageTabs from '@/components/layout/PageTabs.vue'
import Footer from '@/components/layout/Footer.vue'

const store = useConfigStore()
const route = useRoute()

const appFontSize = computed(() => store.appConfig.fontSize ?? 100)
const isFullscreen = computed(() => !!route.meta.fullscreen)

onMounted(() => {
  store.loadConfig()
})
</script>

<template>
  <div class="app-shell" :class="{ editing: store.editMode, fullscreen: isFullscreen }" :style="{ fontSize: appFontSize + '%' }">
    <template v-if="!isFullscreen">
      <EditModeToolbar />
      <PageTabs />
      <RouterView />
      <Footer />
    </template>
    <RouterView v-else />
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