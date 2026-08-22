<script setup lang="ts">
import { computed } from 'vue'
import type { DatabaseMonitorWidgetConfig } from '@/types/config'
import type { SshConnection } from '@/types/config'
import { useConfigStore } from '@/stores/config'

const props = defineProps<{ config: Record<string, unknown> }>()
const emit = defineEmits<{ update: [config: Record<string, unknown>] }>()
const store = useConfigStore()
const cfg = computed(() => props.config as DatabaseMonitorWidgetConfig)

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
      <label>MySQL Host</label>
      <input :value="cfg.dbHost || '127.0.0.1'" @input="update('dbHost', ($event.target as HTMLInputElement).value)" placeholder="127.0.0.1" class="input" />
    </div>

    <div class="form-group">
      <label>MySQL Port</label>
      <input :value="cfg.dbPort || 3306" @input="update('dbPort', Number(($event.target as HTMLInputElement).value))" type="number" class="input input-small" />
    </div>

    <div class="form-group">
      <label>MySQL User</label>
      <input :value="cfg.dbUser || ''" @input="update('dbUser', ($event.target as HTMLInputElement).value)" class="input" placeholder="Auto-detect from Frappe/WordPress/Laravel" />
    </div>

    <div class="form-group">
      <label>MySQL Password</label>
      <input :value="cfg.dbPassword || ''" @input="update('dbPassword', ($event.target as HTMLInputElement).value)" type="password" class="input" placeholder="Auto-detect from app config" />
    </div>

    <div class="form-group">
      <label>Auto-Refresh</label>
      <select :value="cfg.refreshInterval" @change="update('refreshInterval', Number(($event.target as HTMLSelectElement).value))">
        <option :value="10">10 seconds</option>
        <option :value="30">30 seconds</option>
        <option :value="60">60 seconds</option>
      </select>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-group > label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
select, .input {
  padding: 0.5rem; background-color: var(--color-bg);
  border: 1px solid var(--color-border); border-radius: 6px;
  color: var(--color-text); font-size: 0.8125rem;
  &:focus { border-color: var(--color-primary); outline: none; }
}
.input-small { max-width: 100px; }
</style>
