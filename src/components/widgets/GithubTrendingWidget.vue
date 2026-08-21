<template>
  <div class="github-trending-widget">
    <div class="trending-header">
      <span class="header-title">GitHub Trending</span>
      <span class="header-since">Since: {{ since }}</span>
    </div>
    <div v-if="repos.length === 0" class="empty-state">
      No trending repositories found
    </div>
    <ul v-else class="repos-list">
      <li v-for="(repo, index) in repos" :key="index" class="repo-item">
        <div class="repo-info">
          <a :href="repo.html_url" target="_blank" class="repo-name">{{ repo.name }}</a>
          <div class="repo-meta">
            <span class="language" v-if="repo.language">{{ repo.language }}</span>
            <span class="stars">{{ repo.stargazers_count }} ★</span>
            <span class="forks">({{ repo.forks_count }} Forks)</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { fetchGithubTrending, GithubTrendingRepo } from '@/services/github-trending'

const props = defineProps<{
  config: Record<string, unknown>
  editMode?: boolean
}>()

const since = computed(() => props.config?.['since'] as 'daily' | 'weekly' | 'monthly' || 'daily')
const language = computed(() => props.config?.['language'] as string || '')
const stars = computed(() => props.config?.['stars'] as number || 0)
const limit = computed(() => props.config?.['limit'] as number || 5)

const repos = ref<GithubTrendingRepo[]>([])
const loading = ref<boolean>(false)

const fetchTrending = async () => {
  loading.value = true
  try {
    const result = await fetchGithubTrending(since.value, language.value, stars.value, limit.value)
    repos.value = result.items
  } catch (error) {
    console.error('Failed to fetch GitHub trending:', error)
    repos.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchTrending)
</script>

<style scoped>
.github-trending-widget {
  font-family: inherit;
  min-height: 120px;
}

.header-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--widget-text-color, var(--text-color));
  margin-bottom: 4px;
}

.header-since {
  font-size: 11px;
  color: var(--widget-text-color-muted, var(--text-color));
  margin-bottom: 8px;
}

.empty-state {
  text-align: center;
  color: var(--widget-text-color-muted, var(--text-color));
  font-style: italic;
  padding: 20px 0;
}

.repos-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.repo-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.repo-name {
  flex: 1;
  font-size: 12px;
  color: var(--widget-text-color, var(--text-color));
  text-decoration: none;
}

.language {
  margin-right: 4px;
  font-size: 10px;
  color: var(--widget-text-color-muted);
  white-space: nowrap;
}

.stars {
  margin-left: 8px;
  font-size: 11px;
  color: var(--widget-accent-color, var(--primary-color));
}

.forks {
  font-size: 10px;
  color: var(--widget-text-color-muted);
  margin-left: 4px;
}
</style>