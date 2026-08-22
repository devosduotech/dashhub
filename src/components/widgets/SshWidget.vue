<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SshConnection, SshWidgetConfig } from '@/types/config'
import TerminalModal from './TerminalModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/utils/iconPaths'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const cfg = computed(() => props.config as SshWidgetConfig)
const connections = computed(() => cfg.value.connections || [])

const activeConn = ref<SshConnection | null>(null)

const grouped = computed(() => {
  const groups: Record<string, SshConnection[]> = {}
  for (const conn of connections.value) {
    const g = conn.group || 'Default'
    if (!groups[g]) groups[g] = []
    groups[g].push(conn)
  }
  return groups
})

const AUTH_META: Record<string, { icon: IconName; label: string }> = {
  password: { icon: 'lock', label: 'Password authentication' },
  key: { icon: 'key', label: 'SSH key authentication' },
  agent: { icon: 'bot', label: 'SSH agent authentication' }
}

function connect(conn: SshConnection) {
  if (props.editMode) return
  activeConn.value = conn
}

function openInNewTab(conn: SshConnection) {
  if (props.editMode) return
  const id = conn.id || conn.name
  const url = `/ssh/${encodeURIComponent(id)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function closeTerminal() {
  activeConn.value = null
}
</script>

<template>
  <div class="ssh-widget">
    <div v-if="connections.length === 0" class="empty-state">
      <p>No SSH connections configured.</p>
      <p v-if="editMode" class="hint">Click the gear icon to add connections.</p>
    </div>

    <div v-else class="conn-groups">
      <div v-for="(conns, group) in grouped" :key="group" class="conn-group">
        <div class="group-title">{{ group }}</div>
        <div class="conn-list">
          <div v-for="(conn, i) in conns" :key="i" class="conn-item">
            <span class="conn-status" title="Disconnected"></span>
            <div class="conn-info">
              <span class="conn-name">{{ conn.name }}</span>
              <span class="conn-detail">{{ conn.username }}@{{ conn.host }}:{{ conn.port }}</span>
            </div>
            <span
              class="auth-badge"
              :title="AUTH_META[conn.authType]?.label || conn.authType"
            >
              <AppIcon :name="AUTH_META[conn.authType]?.icon || 'key'" :size="13" />
            </span>
            <button
              class="connect-btn"
              :disabled="editMode"
              :title="editMode ? 'Exit edit mode to connect' : 'Connect'"
              @click="connect(conn)"
            >Connect</button>
            <button
              class="open-tab-btn"
              :disabled="editMode"
              :title="editMode ? 'Exit edit mode to open' : 'Open in new tab'"
              @click="openInNewTab(conn)"
            ><AppIcon name="external-link" :size="13" /></button>
          </div>
        </div>
      </div>
    </div>

    <TerminalModal
      v-if="activeConn"
      :conn="activeConn"
      :default-shell="cfg.defaultShell"
      :theme="cfg.theme"
      :font-size="cfg.fontSize"
      @close="closeTerminal"
    />
  </div>
</template>

<style scoped lang="scss">
.ssh-widget { padding: 1rem; }
.empty-state {
  text-align: center; padding: 1.5rem;
  color: var(--color-text-muted); font-size: 0.875rem;
}
.hint { font-size: 0.75rem; color: var(--color-text-dim); margin-top: 0.5rem; }
.conn-groups { display: flex; flex-direction: column; gap: 1rem; }
.group-title {
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--color-text-muted); margin-bottom: 0.5rem;
}
.conn-list { display: flex; flex-direction: column; gap: 0.375rem; }
.conn-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border); border-radius: 6px;
  transition: border-color 150ms ease;
  overflow: hidden;

  &:hover {
    border-color: var(--color-border-strong);
  }
}
.conn-status {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--color-text-dim);
  flex-shrink: 0;
}
.conn-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.conn-name { font-weight: 500; font-size: 0.875rem; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.conn-detail { font-size: 0.75rem; color: var(--color-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.auth-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 5px;
  background-color: var(--color-primary-dim);
  color: var(--color-primary);
  flex-shrink: 0;
}
.connect-btn {
  padding: 0.25rem 0.75rem;
  background-color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  color: white;
  font-size: 0.8125rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 1;
  transition: background-color 150ms ease;

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    background-color: var(--color-primary-dim);
    border-color: var(--color-border);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.7;
  }
}
.open-tab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  flex-shrink: 1;
  transition: background-color 150ms ease;

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>