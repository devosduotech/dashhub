<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ServiceStatusWidgetConfig } from '@/types/config'
import type { SshConnection } from '@/types/config'
import { useConfigStore } from '@/stores/config'

const props = defineProps<{ config: Record<string, unknown> }>()
const emit = defineEmits<{ update: [config: Record<string, unknown>] }>()
const store = useConfigStore()
const cfg = computed(() => props.config as ServiceStatusWidgetConfig)

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

const newService = ref('')
const newLabel = ref('')

function addService() {
  if (!newService.value.trim()) return
  const services = [...(cfg.value.services || []), { name: newService.value.trim(), label: newLabel.value.trim() || undefined }]
  emit('update', { ...props.config, services })
  newService.value = ''
  newLabel.value = ''
}

function removeService(index: number) {
  const services = (cfg.value.services || []).filter((_: unknown, i: number) => i !== index)
  emit('update', { ...props.config, services })
}

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
      <label>Services</label>
      <div class="service-list">
        <div v-for="(svc, i) in cfg.services || []" :key="i" class="service-item">
          <span class="service-name">{{ svc.label || svc.name }}</span>
          <span class="service-id">{{ svc.name }}</span>
          <button class="remove-btn" @click="removeService(i)"><span>&times;</span></button>
        </div>
      </div>
      <div class="add-service">
        <input v-model="newService" placeholder="Service name (e.g. nginx)" class="input" @keyup.enter="addService" />
        <input v-model="newLabel" placeholder="Label (optional)" class="input input-small" @keyup.enter="addService" />
        <button class="btn btn-small btn-primary" @click="addService">+ Add</button>
      </div>
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
.input-small { max-width: 140px; }
.service-list { display: flex; flex-direction: column; gap: 0.25rem; }
.service-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.375rem 0.5rem; background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 4px;
}
.service-name { font-size: 0.8125rem; font-weight: 500; color: var(--color-text); flex: 1; }
.service-id { font-size: 0.6875rem; color: var(--color-text-dim); }
.remove-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.25rem; height: 1.25rem; border: none; background: none;
  color: var(--color-text-dim); cursor: pointer; border-radius: 3px;
  &:hover { background-color: var(--color-danger-dim); color: var(--color-danger); }
}
.add-service { display: flex; gap: 0.5rem; align-items: center; }
.btn {
  padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8125rem;
  cursor: pointer; border: 1px solid var(--color-border);
  white-space: nowrap;
}
.btn-small { padding: 0.375rem 0.625rem; font-size: 0.75rem; }
.btn-primary {
  background-color: var(--color-primary); border-color: var(--color-primary);
  color: white; &:hover { opacity: 0.9; }
}
</style>
