<script setup lang="ts">
import { ref } from 'vue'
import type { SshConnection } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

function getConfig(): { connections: SshConnection[]; defaultShell?: string; theme?: string; fontSize?: number } {
  return props.config as { connections: SshConnection[]; defaultShell?: string; theme?: string; fontSize?: number }
}

const editingIndex = ref(-1)
const editConn = ref<SshConnection>({ name: '', host: '', port: 22, username: '', authType: 'key', group: '' })
const showPassword = ref(false)
const showKey = ref(false)

function addConn() {
  editingIndex.value = getConfig().connections.length
  editConn.value = { name: '', host: '', port: 22, username: '', authType: 'key', group: '' }
  showPassword.value = false
  showKey.value = false
}

function editConnItem(index: number) {
  editingIndex.value = index
  editConn.value = { ...getConfig().connections[index] }
  showPassword.value = false
  showKey.value = false
}

function saveConn() {
  const cfg = { ...getConfig() }
  if (!cfg.connections) cfg.connections = []
  const prev = editingIndex.value >= 0 && editingIndex.value < cfg.connections.length
    ? cfg.connections[editingIndex.value]
    : null
  const conn = { ...editConn.value }
  if (conn.authType !== 'password') delete conn.password
  if (conn.authType !== 'key') delete conn.privateKey
  if (conn.authType === 'password') {
    if (conn.password && conn.password.length > 0) {
      delete conn.hasCredential
    } else {
      delete conn.password
      conn.hasCredential = prev?.hasCredential === true
    }
  } else if (conn.authType === 'key') {
    if (conn.privateKey && conn.privateKey.trim().length > 0) {
      delete conn.hasCredential
    } else {
      delete conn.privateKey
      conn.hasCredential = prev?.hasCredential === true
    }
  }
  if (editingIndex.value >= 0 && editingIndex.value < cfg.connections.length) {
    cfg.connections[editingIndex.value] = conn
  } else {
    cfg.connections.push(conn)
  }
  emit('update', { ...props.config, connections: cfg.connections })
  editingIndex.value = -1
}

function deleteConn(index: number) {
  const cfg = { ...getConfig() }
  cfg.connections.splice(index, 1)
  emit('update', { ...props.config, connections: cfg.connections })
}

function cancelEdit() {
  editingIndex.value = -1
}

function updateField(field: string, value: unknown) {
  emit('update', { ...props.config, [field]: value })
}
</script>

<template>
  <div class="ssh-form">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Default Shell</label>
        <input
          :value="getConfig().defaultShell || '/bin/bash'"
          type="text"
          class="form-input"
          @input="updateField('defaultShell', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-group">
        <label class="form-label">Font Size</label>
        <input
          :value="getConfig().fontSize || 14"
          type="number"
          class="form-input"
          min="10"
          @input="updateField('fontSize', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Terminal Theme</label>
      <select :value="getConfig().theme || 'monokai'" class="form-input" @change="updateField('theme', ($event.target as HTMLSelectElement).value)">
        <option value="monokai">Monokai</option>
        <option value="solarized-dark">Solarized Dark</option>
        <option value="dracula">Dracula</option>
        <option value="nord">Nord</option>
      </select>
    </div>

    <div class="conns-section">
      <div class="section-header">
        <span class="section-label">Connections ({{ getConfig().connections?.length || 0 }})</span>
        <button class="btn btn-small btn-primary" @click="addConn">+ Add Connection</button>
      </div>

      <div v-if="editingIndex >= 0" class="conn-editor">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input v-model="editConn.name" type="text" class="form-input" placeholder="Web Server" />
          </div>
          <div class="form-group">
            <label class="form-label">Group</label>
            <input v-model="editConn.group" type="text" class="form-input" placeholder="Production" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Host</label>
            <input v-model="editConn.host" type="text" class="form-input" placeholder="192.168.1.10" />
          </div>
          <div class="form-group">
            <label class="form-label">Port</label>
            <input v-model="editConn.port" type="number" class="form-input" min="1" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input v-model="editConn.username" type="text" class="form-input" placeholder="admin" />
          </div>
          <div class="form-group">
            <label class="form-label">Auth Type</label>
            <select v-model="editConn.authType" class="form-input">
              <option value="key">SSH Key</option>
              <option value="password">Password</option>
              <option value="agent">Agent</option>
            </select>
          </div>
        </div>

        <div v-if="editConn.authType === 'password'" class="form-group">
          <label class="form-label">Password</label>
          <div class="secret-field">
            <input
              v-model="editConn.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="Enter password"
              autocomplete="off"
            />
            <button type="button" class="btn btn-small toggle-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="editConn.hasCredential" class="form-hint">A password is stored. Leave blank to keep the existing one.</span>
          <span v-else class="form-hint">Stored in the local config file. Encryption is planned for Phase 2.</span>
        </div>

        <div v-if="editConn.authType === 'key'" class="form-group">
          <label class="form-label">Private Key</label>
          <div class="secret-field">
            <textarea
              v-model="editConn.privateKey"
              :type="showKey ? 'text' : 'password'"
              class="form-input form-textarea"
              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
              rows="3"
            />
            <button type="button" class="btn btn-small toggle-btn" @click="showKey = !showKey">
              {{ showKey ? 'Hide' : 'Show' }}
            </button>
          </div>
          <span v-if="editConn.hasCredential" class="form-hint">A private key is stored. Leave blank to keep the existing one.</span>
          <span v-else class="form-hint">Paste the private key content here.</span>
        </div>
        <div class="form-actions">
          <button class="btn btn-small btn-secondary" @click="cancelEdit">Cancel</button>
          <button class="btn btn-small btn-primary" @click="saveConn">Save Connection</button>
        </div>
      </div>

      <div v-else class="conns-list">
        <div v-if="!getConfig().connections || getConfig().connections.length === 0" class="empty-hint">
          No connections yet. Click "Add Connection" to create one.
        </div>
        <div v-for="(conn, index) in (getConfig().connections || [])" :key="index" class="conn-item">
          <div class="conn-info">
            <span class="conn-name">{{ conn.name }}</span>
            <span class="conn-detail">{{ conn.username }}@{{ conn.host }}:{{ conn.port }}</span>
          </div>
          <span v-if="conn.group" class="conn-group">{{ conn.group }}</span>
          <div class="conn-actions">
            <button class="btn btn-small" @click="editConnItem(index)">Edit</button>
            <button class="btn btn-small btn-danger" @click="deleteConn(index)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ssh-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-muted); }
.form-input {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;
  &:focus { outline: none; border-color: var(--color-primary); }
}
.conns-section { border-top: 1px solid var(--color-border); padding-top: 1rem; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.section-label { font-weight: 600; font-size: 0.875rem; color: var(--color-text); }
.conn-editor {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px; padding: 1rem;
  display: flex; flex-direction: column; gap: 0.75rem;
}
.form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.conns-list { display: flex; flex-direction: column; gap: 0.5rem; }
.empty-hint {
  padding: 1.5rem; text-align: center;
  color: var(--color-text-muted); font-size: 0.875rem;
  border: 2px dashed var(--color-border); border-radius: 8px;
}
.conn-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border); border-radius: 6px;
}
.conn-info { flex: 1; display: flex; flex-direction: column; }
.conn-name { font-weight: 500; font-size: 0.875rem; color: var(--color-text); }
.conn-detail { font-size: 0.75rem; color: var(--color-text-dim); }
.conn-group {
  font-size: 0.75rem; padding: 0.125rem 0.5rem;
  background-color: var(--color-primary-dim); border-radius: 12px; color: var(--color-text);
}
.conn-actions { display: flex; gap: 0.25rem; }
.btn {
  padding: 0.375rem 0.875rem; border: 1px solid var(--color-border);
  border-radius: 6px; font-size: 0.8125rem;
  background-color: var(--color-surface); color: var(--color-text); cursor: pointer;
  &:hover { background-color: var(--color-bg-hover); }
}
.btn-small { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
.btn-primary {
  background-color: var(--color-primary); color: white; border-color: var(--color-primary);
  &:hover { background-color: var(--color-primary-hover); }
}
.btn-secondary { background-color: var(--color-surface); color: var(--color-text); }
.btn-danger {
  color: var(--color-danger); border-color: var(--color-border);
  &:hover { background-color: var(--color-danger); color: white; }
}

.secret-field {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
}

.form-textarea {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  resize: vertical;
  min-height: 3rem;
}

.toggle-btn {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  margin-top: 0.25rem;
}
</style>