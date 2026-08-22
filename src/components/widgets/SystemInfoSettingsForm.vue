<script setup lang="ts">
import { computed } from 'vue'
import type { SystemInfoWidgetConfig } from '@/types/config'
import type { SshConnection } from '@/types/config'
import { useConfigStore } from '@/stores/config'

const props = defineProps<{ config: Record<string, unknown> }>()
const emit = defineEmits<{ update: [config: Record<string, unknown>] }>()
const store = useConfigStore()
const cfg = computed(() => props.config as SystemInfoWidgetConfig)

const sshConnections = computed<SshConnection[]>(() => {
  const conns: SshConnection[] = []
  for (const page of store.config.pages || []) {
    for (const item of page.items || []) {
      if (item.type === 'ssh' && Array.isArray(item.config?.connections)) {
        conns.push(...item.config.connections)
      }
    }
  }
  return conns
})

function update(key: string, value: unknown) {
  emit('update', { ...props.config, [key]: value })
}
</script>

<template>
  <div class="settings-form">
    <div class="form-group">
      <label>SSH Connection</label>
      <select :value="cfg.connectionId" @change="update('connectionId', ($event.target as HTMLSelectElement).value)">
        <option value="">Select connection...</option>
        <option v-for="conn in sshConnections" :key="conn.id" :value="conn.id">{{ conn.name }} ({{ conn.host }})</option>
      </select>
    </div>

    <div class="form-group">
      <label>Auto-Refresh</label>
      <select :value="cfg.refreshInterval" @change="update('refreshInterval', Number(($event.target as HTMLSelectElement).value))">
        <option :value="10">10 seconds</option>
        <option :value="30">30 seconds</option>
        <option :value="60">60 seconds</option>
      </select>
    </div>

    <div class="form-group">
      <label>Show Sections</label>
      <div class="toggle-group">
        <label class="toggle">
          <input type="checkbox" :checked="cfg.showCpu !== false" @change="update('showCpu', ($event.target as HTMLInputElement).checked)" />
          <span>CPU</span>
        </label>
        <label class="toggle">
          <input type="checkbox" :checked="cfg.showMemory !== false" @change="update('showMemory', ($event.target as HTMLInputElement).checked)" />
          <span>Memory</span>
        </label>
        <label class="toggle">
          <input type="checkbox" :checked="cfg.showDisk !== false" @change="update('showDisk', ($event.target as HTMLInputElement).checked)" />
          <span>Disk</span>
        </label>
        <label class="toggle">
          <input type="checkbox" :checked="cfg.showNetwork !== false" @change="update('showNetwork', ($event.target as HTMLInputElement).checked)" />
          <span>Network</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-group label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
select {
  padding: 0.5rem; background-color: var(--color-bg);
  border: 1px solid var(--color-border); border-radius: 6px;
  color: var(--color-text); font-size: 0.8125rem;
  &:focus { border-color: var(--color-primary); outline: none; }
}
.toggle-group { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.toggle {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; color: var(--color-text); cursor: pointer;
  input { width: 1rem; height: 1rem; accent-color: var(--color-primary); }
}
</style>
