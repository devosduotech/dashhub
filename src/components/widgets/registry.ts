import type { Component } from 'vue'
import type { WidgetType } from '@/types/config'

export interface WidgetDefinition {
  type: WidgetType
  label: string
  icon: string
  description: string
  component: () => Promise<Component>
  settingsForm: () => Promise<Component>
  defaultConfig: () => Record<string, unknown>
}

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  'quick-links': {
    type: 'quick-links',
    label: 'Quick Links',
    icon: '🔗',
    description: 'Web bookmark shortcuts',
    component: () => import('@/components/widgets/QuickLinksWidget.vue'),
    settingsForm: () => import('@/components/widgets/QuickLinksSettingsForm.vue'),
    defaultConfig: () => ({ columns: 3, displayMode: 'grid', links: [] })
  },
  glances: {
    type: 'glances',
    label: 'Glances Server',
    icon: '🖥️',
    description: 'Server monitoring via Glances iframe',
    component: () => import('@/components/widgets/GlancesWidget.vue'),
    settingsForm: () => import('@/components/widgets/GlancesSettingsForm.vue'),
    defaultConfig: () => ({ url: '', displayMode: 'embedded', height: 400, width: '100%', fullWidth: true, refreshInterval: 30 })
  },
  ssh: {
    type: 'ssh',
    label: 'SSH Terminal',
    icon: '💻',
    description: 'Web-based SSH terminal',
    component: () => import('@/components/widgets/SshWidget.vue'),
    settingsForm: () => import('@/components/widgets/SshSettingsForm.vue'),
    defaultConfig: () => ({ defaultShell: '/bin/bash', theme: 'monokai', fontSize: 14, connections: [] })
  },
  youtube: {
    type: 'youtube',
    label: 'YouTube',
    icon: '📺',
    description: 'Latest videos from YouTube channels',
    component: () => import('@/components/widgets/YouTubeWidget.vue'),
    settingsForm: () => import('@/components/widgets/YouTubeSettingsForm.vue'),
    defaultConfig: () => ({ channels: [], videosPerChannel: 3, displayMode: 'grid', thumbnailSize: 'medium', cacheTime: 60 })
  },
  rss: {
    type: 'rss',
    label: 'RSS Feed',
    icon: '📡',
    description: 'News and article aggregation',
    component: () => import('@/components/widgets/RssWidget.vue'),
    settingsForm: () => import('@/components/widgets/RssSettingsForm.vue'),
    defaultConfig: () => ({ feeds: [], itemsPerFeed: 5, showThumbnails: true, cacheTime: 15 })
  },
  iframe: {
    type: 'iframe',
    label: 'IFrame',
    icon: '🖼️',
    description: 'Embed any web content',
    component: () => import('@/components/widgets/IframeWidget.vue'),
    settingsForm: () => import('@/components/widgets/IframeSettingsForm.vue'),
    defaultConfig: () => ({ url: '', height: 400, width: '100%', fullWidth: true, allowFullscreen: true, refreshInterval: 0 })
  },
}

export const widgetList = Object.values(widgetRegistry)
