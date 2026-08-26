<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import AppSettingsModal from './AppSettingsModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppLogo from '@/components/ui/AppLogo.vue'

const store = useConfigStore()
const router = useRouter()
const showSettings = ref(false)
</script>

<template>
  <div class="edit-toolbar" :class="{ editing: store.editMode }">
    <div class="toolbar-left">
      <img
        v-if="store.appConfig.showLogo && store.appConfig.logoUrl"
        :src="store.appConfig.logoUrl"
        class="toolbar-logo"
        alt="Logo"
      />
      <AppLogo v-else variant="mark" :size="26" />
      <span class="toolbar-title">{{ store.appConfig.title }}</span>
      <span v-if="store.editMode" class="edit-badge">
        <AppIcon name="edit" :size="13" />
        Editing Dashboard
      </span>
      <span v-if="store.saving" class="save-indicator">
        <AppIcon name="check" :size="12" />
        Saving...
      </span>
      <span v-if="store.error" class="error-indicator" :title="store.error">
        <AppIcon name="alert-circle" :size="13" />
      </span>
    </div>
    <div class="toolbar-right">
      <button
        class="toolbar-btn toolbar-btn-secondary"
        @click="router.push('/help')"
        title="Documentation"
      >
        <AppIcon name="book" :size="14" />
        Help
      </button>
      <button
        v-if="store.editMode"
        class="toolbar-btn toolbar-btn-secondary"
        @click="showSettings = true"
        title="App Settings"
      >
        <AppIcon name="settings" :size="14" />
        Settings
      </button>
      <button class="toolbar-btn" :class="{ 'toolbar-btn-edit': !store.editMode }" @click="store.toggleEditMode">
        <AppIcon v-if="!store.editMode" name="edit" :size="14" />
        <AppIcon v-else name="check" :size="14" />
        {{ store.editMode ? 'Done' : 'Edit Mode' }}
      </button>
    </div>

    <AppSettingsModal
      v-if="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<style scoped lang="scss">
.edit-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  gap: 1rem;
  transition: background-color 150ms ease;

  &.editing {
    background-color: var(--color-bg-elevated);
    border-bottom-color: var(--color-primary);
  }
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
  overflow: hidden;
}

.toolbar-logo {
  max-height: 26px;
  max-width: 120px;
  object-fit: contain;
  flex-shrink: 0;
}

.toolbar-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  background-color: var(--color-primary-dim);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.error-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  background-color: var(--color-danger);
  color: white;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0.5rem;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 150ms ease;

  &:hover {
    background-color: var(--color-primary-hover);
  }

  &.toolbar-btn-secondary {
    background-color: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover {
      background-color: var(--color-bg-hover);
      border-color: var(--color-border-hover);
    }
  }

  &.toolbar-btn-edit {
    background-color: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover {
      background-color: var(--color-bg-hover);
      border-color: var(--color-primary);
    }
  }
}
</style>