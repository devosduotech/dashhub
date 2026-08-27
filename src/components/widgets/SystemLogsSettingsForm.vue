<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SystemLogsWidgetConfig } from '@/types/config'
import type { SshConnection } from '@/types/config'
import { useConfigStore } from '@/stores/config'

const props = defineProps<{ config: Record<string, unknown> }>()
const emit = defineEmits<{ update: [config: Record<string, unknown>] }>()
const store = useConfigStore()
const cfg = computed(() => props.config as SystemLogsWidgetConfig)

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

const customService = ref('')

const commonServices = [
  { value: '', label: 'All services' },
  { value: 'nginx', label: 'nginx' },
  { value: 'docker', label: 'docker' },
  { value: 'sshd', label: 'sshd' },
  { value: 'systemd', label: 'systemd' },
  { value: 'kernel', label: 'kernel' },
  { value: 'cron', label: 'cron' },
  { value: 'mysql', label: 'mysql' },
  { value: 'postgresql', label: 'postgresql' }
]

function update(key: string, value: unknown) {
  emit('update', { ...props.config, [key]: value })
}

function setService(value: string) {
  update('service', value)
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
      <label>Service</label>
      <select :value="cfg.service || ''" @change="setService(($event.target as HTMLSelectElement).value)">
        <option v-for="s in commonServices" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <input
        v-model="customService"
        placeholder="Or enter custom service name..."
        class="input"
        @keyup.enter="setService(customService)"
      />
    </div>

    <div class="form-group">
      <label>Min Priority</label>
      <select :value="cfg.priority || 'info'" @change="update('priority', ($event.target as HTMLSelectElement).value)">
        <option value="emerg">Emergency only</option>
        <option value="alert">Alert+</option>
        <option value="crit">Critical+</option>
        <option value="err">Error+</option>
        <option value="warning">Warning+</option>
        <option value="notice">Notice+</option>
        <option value="info">Info+</option>
        <option value="debug">All (debug)</option>
      </select>
    </div>

    <div class="form-group">
      <label>Lines</label>
      <select :value="cfg.lines || 100" @change="update('lines', Number(($event.target as HTMLSelectElement).value))">
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="200">200</option>
        <option :value="500">500</option>
      </select>
    </div>

    <div class="form-group">
      <label>Auto-Refresh</label>
      <select :value="cfg.refreshInterval" @change="update('refreshInterval', Number(($event.target as HTMLSelectElement).value))">
          <option :value="0">Manual</option>
          <option :value="30">30 seconds</option>
          <option :value="60">60 seconds</option>
          <option :value="300">5 minutes</option>
          <option :value="900">15 minutes</option>
          <option :value="1800">30 minutes</option>
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
</style>
