<template>
  <div class="github-trending-settings-form">
    <div class="form-group">
      <label for="since">Time Period</label>
      <select id="since" v-model="since">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>

    <div class="form-group">
      <label for="language">Language</label>
      <select id="language" v-model="language">
        <option value="">All Languages</option>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="rust">Rust</option>
        <option value="go">Go</option>
        <option value="typescript">TypeScript</option>
      </select>
    </div>

    <div class="form-group">
      <label for="stars">Max Stars</label>
      <input type="number" id="stars" v-model.number="stars" min="0" max="100000" />
    </div>

    <div class="form-group">
      <label for="limit">Max Repos</label>
      <input type="number" id="limit" v-model.number="limit" min="1" max="50" value="5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{
  'update:config': [config: Record<string, unknown>]
}>()

const props = defineProps<{
  config: Record<string, unknown>
}>()

// Emit updated config
function updateConfig(newConfig: Record<string, unknown>) {
  emit('update:config', { ...props.config, ...newConfig })
}

// Computed from config
const since = computed({
  get: () => props.config?.['since'] as 'daily' | 'weekly' | 'monthly' || 'daily',
  set: (val: 'daily' | 'weekly' | 'monthly') => updateConfig({ since: val })
})

const language = computed({
  get: () => props.config?.['language'] as string || '',
  set: (val: string) => updateConfig({ language: val })
})

const stars = computed({
  get: () => props.config?.['stars'] as number || 0,
  set: (val: number) => updateConfig({ stars: val })
})

const limit = computed({
  get: () => props.config?.['limit'] as number || 5,
  set: (val: number) => updateConfig({ limit: val })
})
</script>

<style scoped>
.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--widget-text-color-secondary, var(--text-color));
}

select {
  padding: 4px 8px;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 4px;
  background-color: var(--input-bg-color, #fff);
  color: var(--input-text-color, var(--text-color));
}

input {
  padding: 4px 8px;
  border: 1px solid var(--border-color, #ccc);
  border-radius: 4px;
  background-color: var(--input-bg-color, #fff);
  color: var(--input-text-color, var(--text-color));
}
</style>