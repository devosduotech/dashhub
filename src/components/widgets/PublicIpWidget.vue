<template>
  <div class="public-ip-widget">
    <div class="ip-info">
      <div v-if="ipAddress" class="ip-address">
        {{ ipAddress }}
      </div>
      <div v-if="!hideLocation && location" class="location">
        {{ location }}
      </div>
    </div>
    <div class="ip-actions">
      <button @click="refreshIp" class="refresh-btn">
        <AppIcon name="refresh" :size="16" /> Refresh
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { fetchPublicIp } from '@/services/public-ip'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

// Config defaults
const provider = computed(() => props.config?.['provider'] as string || 'ipinfo')
const useProxy = computed(() => props.config?.['useProxy'] === true)
const hideLocation = computed(() => props.config?.['hideLocation'] === true)

// State
const ipAddress = ref<string>('…')
const location = ref<string>('…')
const loading = ref<boolean>(false)

// Refresh IP
async function refreshIp() {
  loading.value = true
  try {
    const result = await fetchPublicIp(provider.value, useProxy.value)
    ipAddress.value = result.ip
    location.value = result.location || ''
  } catch (error) {
    ipAddress.value = 'Error'
    location.value = ''
    console.error('Failed to fetch IP:', error)
  } finally {
    loading.value = false
  }
}

// Initial load on mount
onMounted(refreshIp)
</script>

<style scoped>
.public-ip-widget {
  font-family: inherit;
  text-align: center;
  padding: 10px;
  background: var(--widget-bg-color, var(--bg-color));
  border-radius: 4px;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ip-address {
  font-size: 18px;
  font-weight: bold;
  color: var(--widget-text-color, var(--text-color));
  margin-bottom: 4px;
}

.location {
  font-size: 12px;
  color: var(--widget-text-color-muted, var(--text-color));
}

.refresh-btn {
  margin-top: 8px;
  padding: 4px 8px;
  background: var(--button-bg-color, var(--primary-color));
  color: var(--button-text-color, var(--bg-color));
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
</style>