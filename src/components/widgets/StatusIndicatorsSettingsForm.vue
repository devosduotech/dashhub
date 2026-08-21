<script setup lang="ts">
import { ref } from 'vue'
import type { StatusEndpoint } from '@/types/config'

const props = defineProps<{
  config: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update', config: Record<string, unknown>): void
}>()

function getConfig(): { endpoints: StatusEndpoint[]; showLatency?: boolean; showStatusCode?: boolean; refreshInterval?: number } {
  return props.config as { endpoints: StatusEndpoint[]; showLatency?: boolean; showStatusCode?: boolean; refreshInterval?: number }
}

const editingIndex = ref(-1)
const editEndpoint = ref<StatusEndpoint>({
  name: '',
  url: '',
  method: 'GET',
  expectedStatus: 200,
  timeout: 5,
  category: ''
})

function addEndpoint() {
  editingIndex.value = getConfig().endpoints.length
  editEndpoint.value = { name: '', url: '', method: 'GET', expectedStatus: 200, timeout: 5, category: '' }
}

function editEndpointItem(index: number) {
  editingIndex.value = index
  const ep = getConfig().endpoints[index]
  editEndpoint.value = { ...ep }
}

function saveEndpoint() {
  const cfg = { ...getConfig() }
  const endpoints = [...(cfg.endpoints || [])]
  if (editingIndex.value >= 0 && editingIndex.value < endpoints.length) {
    endpoints[editingIndex.value] = { ...editEndpoint.value }
  } else {
    endpoints.push({ ...editEndpoint.value })
  }
  emit('update', { ...props.config, endpoints })
  editingIndex.value = -1
}

function deleteEndpoint(index: number) {
  const cfg = { ...getConfig() }
  const endpoints = [...(cfg.endpoints || [])]
  endpoints.splice(index, 1)
  emit('update', { ...props.config, endpoints })
}

function cancelEdit() {
  editingIndex.value = -1
}

function updateShowLatency(value: boolean) {
  emit('update', { ...props.config, showLatency: value })
}

function updateShowStatusCode(value: boolean) {
  emit('update', { ...props.config, showStatusCode: value })
}

function updateRefreshInterval(value: number) {
  emit('update', { ...props.config, refreshInterval: value })
}
</script>

<template>
  <div class="status-form">
    <div class="form-row">
      <div class="form-group">
        <label class="form-toggle">
          <input
            type="checkbox"
            :checked="getConfig().showLatency || false"
            @change="updateShowLatency(($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-label">Show latency</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-toggle">
          <input
            type="checkbox"
            :checked="getConfig().showStatusCode || false"
            @change="updateShowStatusCode(($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-label">Show status code</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Auto-refresh interval</label>
      <select :value="getConfig().refreshInterval ?? 1800" class="form-select" @change="updateRefreshInterval(Number(($event.target as HTMLSelectElement).value))">
        <option :value="0">Off</option>
        <option :value="900">15 minutes</option>
        <option :value="1800">30 minutes</option>
        <option :value="3600">1 hour</option>
        <option :value="21600">6 hours</option>
        <option :value="43200">12 hours</option>
        <option :value="86400">24 hours</option>
      </select>
    </div>

    <div class="links-section">
      <div class="section-header">
        <span class="section-label">Endpoints ({{ getConfig().endpoints?.length || 0 }})</span>
        <button class="btn btn-small btn-primary" @click="addEndpoint">+ Add Endpoint</button>
      </div>

      <div v-if="editingIndex >= 0" class="link-editor">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input v-model="editEndpoint.name" type="text" class="form-input" placeholder="My Service" />
          </div>
          <div class="form-group">
            <label class="form-label">URL</label>
            <input v-model="editEndpoint.url" type="text" class="form-input" placeholder="https://example.com" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Method</label>
            <select v-model="editEndpoint.method" class="form-select">
              <option value="GET">GET</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Expected Status</label>
            <input v-model.number="editEndpoint.expectedStatus" type="number" class="form-input" placeholder="200" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Timeout (seconds)</label>
            <input v-model.number="editEndpoint.timeout" type="number" class="form-input" placeholder="5" />
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <input v-model="editEndpoint.category" type="text" class="form-input" placeholder="Hosting" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-small btn-secondary" @click="cancelEdit">Cancel</button>
          <button class="btn btn-small btn-primary" @click="saveEndpoint" :disabled="!editEndpoint.name.trim() || !editEndpoint.url.trim()">Save Endpoint</button>
        </div>
      </div>

      <div v-else class="links-list">
        <div v-if="!getConfig().endpoints || getConfig().endpoints.length === 0" class="empty-hint">
          No endpoints yet. Click "Add Endpoint" to create one.
        </div>
        <div
          v-for="(ep, index) in (getConfig().endpoints || [])"
          :key="index"
          class="link-item"
        >
          <span class="link-info">
            <span class="link-title">{{ ep.name }}</span>
            <span class="link-url">{{ ep.url }}</span>
          </span>
          <span v-if="ep.category" class="link-category">{{ ep.category }}</span>
          <div class="link-actions">
            <button class="btn btn-small" @click="editEndpointItem(index)">Edit</button>
            <button class="btn btn-small btn-danger" @click="deleteEndpoint(index)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.status-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.form-input,
.form-select {
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.form-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);

  input {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-primary);
  }
}

.toggle-label {
  user-select: none;
}

.links-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
}

.link-editor {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.empty-hint {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.link-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.link-title {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-url {
  font-size: 0.75rem;
  color: var(--color-text-dim);
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-category {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background-color: var(--color-primary-dim);
  border-radius: 12px;
  color: var(--color-text);
  flex-shrink: 0;
}

.link-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.8125rem;
  background-color: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-small {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);

  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text);
}

.btn-danger {
  color: var(--color-danger);
  border-color: var(--color-border);

  &:hover {
    background-color: var(--color-danger);
    color: white;
  }
}
</style>
