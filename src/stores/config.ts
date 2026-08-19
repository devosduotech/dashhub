import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { AppConfig, Page, PageItem, WidgetType } from '@/types/config'
import * as configApi from '@/services/configManager'
import { applyTheme } from '@/utils/theme'

const DEFAULT_CONFIG: AppConfig = {
  appConfig: {
    title: 'OSDuo DashHub',
    theme: 'dark-navy',
    language: 'en',
    iconSet: 'material',
    defaultPage: 0
  },
  pages: []
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export const useConfigStore = defineStore('config', () => {
  const config = reactive<AppConfig>(JSON.parse(JSON.stringify(DEFAULT_CONFIG)))
  const activePageIndex = ref(0)
  const editMode = ref(false)
  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const pages = computed(() => config.pages)
  const activePage = computed(() => config.pages?.[activePageIndex.value] ?? null)
  const appConfig = computed(() => config.appConfig)
  const pageCount = computed(() => config.pages.length)

  function applyLoaded(data: AppConfig) {
    config.appConfig = data.appConfig
    config.pages = data.pages
    assignColumns()
    const defaultIdx = data.appConfig.defaultPage ?? 0
    activePageIndex.value = Math.min(defaultIdx, config.pages.length - 1)
    if (activePageIndex.value < 0) activePageIndex.value = 0
  }

  async function loadConfig() {
    loading.value = true
    error.value = null
    let lastError: unknown
    const attempts = 4
    try {
      for (let i = 0; i < attempts; i++) {
        try {
          const data = await configApi.fetchConfig()
          applyLoaded(data)
          return
        } catch (e: unknown) {
          lastError = e
          if (i < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }
      throw lastError instanceof Error ? lastError : new Error('Failed to load config')
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load config'
      config.appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG.appConfig))
      config.pages = []
    } finally {
      loading.value = false
      applyTheme(config.appConfig.theme)
    }
  }

  function assignColumns() {
    for (const page of config.pages) {
      const colCount = Math.max(1, Math.min(page.columnCount ?? 3, 6))
      page.items.forEach((item, i) => {
        if (typeof item.column !== 'number') {
          item.column = i % colCount
        }
      })
    }
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void saveConfig(), 1000)
  }

  async function saveConfig() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    saving.value = true
    error.value = null
    try {
      const configToSave: AppConfig = {
        appConfig: {
          title: config.appConfig.title,
          theme: config.appConfig.theme,
          language: config.appConfig.language,
          iconSet: config.appConfig.iconSet,
          defaultPage: config.appConfig.defaultPage,
          fontSize: config.appConfig.fontSize,
          footerText: config.appConfig.footerText,
          showFooter: config.appConfig.showFooter,
          logoUrl: config.appConfig.logoUrl,
          showLogo: config.appConfig.showLogo
        },
        pages: config.pages.map(page => ({
          id: page.id,
          name: page.name,
          icon: page.icon,
          columnCount: page.columnCount,
          items: page.items.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            column: item.column,
            config: { ...item.config } as Record<string, unknown>
          }))
        }))
      }
      await configApi.saveConfig(configToSave)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to save config'
      console.error('Save error:', e)
    } finally {
      saving.value = false
    }
  }

  function updateAppConfig(updates: Partial<typeof config.appConfig>) {
    config.appConfig = { ...config.appConfig, ...updates }
    if (updates.theme !== undefined) applyTheme(updates.theme)
    debouncedSave()
  }

  function setActivePage(index: number) {
    if (index >= 0 && index < pages.value.length) {
      activePageIndex.value = index
    }
  }

  function addPage(name: string, icon = 'dashboard') {
    const page: Page = {
      id: crypto.randomUUID(),
      name,
      icon,
      items: []
    }
    pages.value.push(page)
    activePageIndex.value = pages.value.length - 1
    debouncedSave()
    return page
  }

  function renamePage(index: number, name: string) {
    if (index >= 0 && index < pages.value.length) {
      pages.value[index].name = name
      debouncedSave()
    }
  }

  function updatePage(index: number, updates: Partial<Page>) {
    if (index >= 0 && index < pages.value.length) {
      pages.value[index] = { ...pages.value[index], ...updates }
      debouncedSave()
    }
  }

  function deletePage(index: number) {
    if (index < 0 || index >= pages.value.length) return
    pages.value.splice(index, 1)
    if (activePageIndex.value >= pages.value.length) {
      activePageIndex.value = Math.max(0, pages.value.length - 1)
    }
    debouncedSave()
  }

  function reorderPages(from: number, to: number) {
    if (from < 0 || from >= pages.value.length) return
    if (to < 0 || to >= pages.value.length) return
    const temp = pages.value[from]
    pages.value[from] = pages.value[to]
    pages.value[to] = temp
    debouncedSave()
  }

  function addWidget(pageIndex: number, type: WidgetType, title: string, widgetConfig: PageItem['config']) {
    if (pageIndex < 0 || pageIndex >= pages.value.length) return
    const item: PageItem = {
      id: crypto.randomUUID(),
      type,
      title,
      config: widgetConfig
    }
    pages.value[pageIndex].items.push(item)
    debouncedSave()
    return item
  }

  function removeWidget(pageIndex: number, itemId: string) {
    if (pageIndex < 0 || pageIndex >= pages.value.length) return
    const items = pages.value[pageIndex].items
    const idx = items.findIndex(i => i.id === itemId)
    if (idx >= 0) {
      items.splice(idx, 1)
      debouncedSave()
    }
  }

  function moveWidget(pageIndex: number, fromIdx: number, toIdx: number) {
    if (pageIndex < 0 || pageIndex >= pages.value.length) return
    if (fromIdx < 0 || fromIdx >= pages.value[pageIndex].items.length) return
    if (toIdx < 0 || toIdx >= pages.value[pageIndex].items.length) return
    const items = pages.value[pageIndex].items
    const temp = items[fromIdx]
    items.splice(fromIdx, 1)
    items.splice(toIdx, 0, temp)
    debouncedSave()
  }

  function moveWidgetToColumn(pageIndex: number, itemId: string, toColumn: number, toIndex: number) {
    if (pageIndex < 0 || pageIndex >= pages.value.length) return
    const items = pages.value[pageIndex].items
    const from = items.findIndex(i => i.id === itemId)
    if (from < 0) return
    const colCount = Math.max(1, Math.min(pages.value[pageIndex].columnCount ?? 3, 6))
    const col = Math.max(0, Math.min(toColumn, colCount - 1))
    const item = items[from]
    items.splice(from, 1)
    item.column = col
    let insertIdx = items.length
    let seen = 0
    for (let i = 0; i < items.length; i++) {
      const c = items[i].column ?? 0
      if (c === col) {
        if (seen >= toIndex) {
          insertIdx = i
          break
        }
        seen++
      }
    }
    items.splice(insertIdx, 0, item)
    debouncedSave()
  }

  function updateWidget(pageIndex: number, itemId: string, updates: Partial<PageItem>) {
    if (pageIndex < 0 || pageIndex >= pages.value.length) return
    const item = pages.value[pageIndex].items.find(i => i.id === itemId)
    if (item) {
      Object.assign(item, updates)
      debouncedSave()
    }
  }

  function toggleEditMode() {
    editMode.value = !editMode.value
  }

  return {
    config,
    activePageIndex,
    editMode,
    loading,
    saving,
    error,
    pages,
    activePage,
    appConfig,
    pageCount,
    loadConfig,
    saveConfig,
    updateAppConfig,
    setActivePage,
    addPage,
    renamePage,
    updatePage,
    deletePage,
    reorderPages,
    addWidget,
    removeWidget,
    moveWidget,
    moveWidgetToColumn,
    updateWidget,
    toggleEditMode
  }
})
