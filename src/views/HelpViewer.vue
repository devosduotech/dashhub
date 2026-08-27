<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getChapters, renderMarkdown } from '@/help/useHelpDocs'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/utils/iconPaths'

const router = useRouter()
const route = useRoute()
const chapters = getChapters()
const sidebarOpen = ref(false)

const currentId = computed(() => {
  const param = route.params.chapter as string
  return param || chapters[0]?.id || ''
})

const currentIndex = computed(() =>
  chapters.findIndex((c) => c.id === currentId.value)
)

const currentChapter = computed(() => chapters[currentIndex.value])

const renderedHtml = computed(() =>
  currentChapter.value ? renderMarkdown(currentChapter.value.raw) : ''
)

const prevChapter = computed(() =>
  currentIndex.value > 0 ? chapters[currentIndex.value - 1] : null
)

const nextChapter = computed(() =>
  currentIndex.value < chapters.length - 1 ? chapters[currentIndex.value + 1] : null
)

function navigateTo(id: string) {
  router.push(`/help/${id}`)
  sidebarOpen.value = false
}

function goBack() {
  router.push('/')
}

watch(currentId, () => {
  window.scrollTo(0, 0)
})

onMounted(() => {
  if (!currentId.value && chapters.length) {
    navigateTo(chapters[0].id)
  }
})
</script>

<template>
  <div class="help-viewer">
    <div class="help-header">
      <button class="help-back" @click="goBack" title="Back to Dashboard">
        <AppIcon name="close" :size="18" />
      </button>
      <span class="help-header-title">DashHub Documentation</span>
      <button class="help-menu-toggle" @click="sidebarOpen = !sidebarOpen">
        <AppIcon name="more-h" :size="18" />
      </button>
    </div>

    <div class="help-body" :class="{ 'sidebar-open': sidebarOpen }">
      <nav class="help-sidebar">
        <div class="sidebar-header">Chapters</div>
        <button
          v-for="chapter in chapters"
          :key="chapter.id"
          class="sidebar-link"
          :class="{ active: chapter.id === currentId }"
          @click="navigateTo(chapter.id)"
        >
          <AppIcon :name="chapter.icon as IconName" :size="15" />
          <span>{{ chapter.title }}</span>
        </button>
      </nav>

      <main class="help-content">
        <article class="markdown-body" v-html="renderedHtml" />

        <nav class="help-nav">
          <button v-if="prevChapter" class="nav-btn nav-prev" @click="navigateTo(prevChapter.id)">
            <AppIcon name="chevron-right" :size="14" />
            {{ prevChapter.title }}
          </button>
          <span v-else />
          <button v-if="nextChapter" class="nav-btn nav-next" @click="navigateTo(nextChapter.id)">
            {{ nextChapter.title }}
            <AppIcon name="chevron-right" :size="14" />
          </button>
        </nav>

        <div class="help-version">DashHub v1.0.21 — User Manual</div>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.help-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.help-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: var(--color-bg-elevated, var(--color-bg));
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.help-back,
.help-menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
}

.help-menu-toggle {
  @media (max-width: 768px) {
    display: flex;
  }
}

.help-header-title {
  font-weight: 700;
  font-size: 0.9375rem;
}

.help-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.help-sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: 0.75rem 0;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    background: var(--color-bg);
    transform: translateX(-100%);
    transition: transform 200ms ease;

    .sidebar-open & {
      transform: translateX(0);
    }
  }
}

.sidebar-header {
  padding: 0.25rem 1rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4375rem 1rem;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  text-align: left;
  cursor: pointer;
  transition: background 100ms, color 100ms;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &.active {
    background: var(--color-primary-dim);
    color: var(--color-primary);
    font-weight: 600;
  }
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 3rem 4rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem 3rem;
  }
}

.help-nav {
  display: flex;
  justify-content: space-between;
  padding-top: 2rem;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8125rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 100ms;

  &:hover {
    background: var(--color-bg-hover);
    border-color: var(--color-border-hover, var(--color-border));
  }
}

.nav-next {
  flex-direction: row-reverse;
}

.help-version {
  text-align: center;
  padding: 1.5rem 0 0.5rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

:deep(.markdown-body) {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--color-text);

  h1 { font-size: 1.625rem; margin: 0 0 1rem; font-weight: 700; }
  h2 { font-size: 1.25rem; margin: 2rem 0 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid var(--color-border); font-weight: 700; }
  h3 { font-size: 1.0625rem; margin: 1.5rem 0 0.5rem; font-weight: 600; }
  h4 { font-size: 0.9375rem; margin: 1.25rem 0 0.5rem; font-weight: 600; }

  p { margin: 0 0 1rem; }

  a {
    color: var(--color-primary);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  ul, ol { margin: 0 0 1rem; padding-left: 1.5rem; }
  li { margin-bottom: 0.25rem; }

  code {
    background: var(--color-bg-elevated, rgba(0,0,0,0.06));
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.85em;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  pre {
    background: var(--color-bg-elevated, #1a1a2e);
    color: #e0e0e0;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0 0 1rem;

    code { background: none; padding: 0; color: inherit; font-size: 0.8125rem; }
  }

  blockquote {
    border-left: 3px solid var(--color-primary);
    margin: 0 0 1rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary-dim);
    border-radius: 0 6px 6px 0;
    color: var(--color-text);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 1rem;
    font-size: 0.875rem;

    th, td {
      border: 1px solid var(--color-border);
      padding: 0.5rem 0.75rem;
      text-align: left;
    }

    th {
      background: var(--color-bg-elevated, rgba(0,0,0,0.04));
      font-weight: 600;
    }
  }

  hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 1.5rem 0;
  }

  img {
    max-width: 100%;
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }
}
</style>
