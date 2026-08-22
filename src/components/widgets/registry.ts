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
  'latest-versions': {
    type: 'latest-versions',
    label: 'Latest Versions',
    icon: '📦',
    description: 'Track latest package versions',
    component: () => import('@/components/widgets/VersionsWidget.vue'),
    settingsForm: () => import('@/components/widgets/VersionsSettingsForm.vue'),
    defaultConfig: () => ({ items: [] })
  },
  clock: {
    type: 'clock',
    label: 'Clock',
    icon: '⏰',
    description: 'Live-updating time and date',
    component: () => import('@/components/widgets/Clock.vue'),
    settingsForm: () => import('@/components/widgets/ClockSettingsForm.vue'),
    defaultConfig: () => ({ timeZone: '', format: '', hideDate: false, hideSeconds: false, use12Hour: false })
  },
  'public-ip': {
    type: 'public-ip',
    label: 'Public IP',
    icon: '🌐',
    description: 'Public IP address and location',
    component: () => import('@/components/widgets/PublicIpWidget.vue'),
    settingsForm: () => import('@/components/widgets/PublicIpSettingsForm.vue'),
    defaultConfig: () => ({ provider: 'ipinfo', useProxy: false, hideLocation: false })
  },
  notes: {
    type: 'notes',
    label: 'Notes',
    icon: '📝',
    description: 'Personal text notes',
    component: () => import('@/components/widgets/NotesWidget.vue'),
    settingsForm: () => import('@/components/widgets/NotesSettingsForm.vue'),
    defaultConfig: () => ({ items: [], sortBy: 'created' })
  },
  reminders: {
    type: 'reminders',
    label: 'Reminders',
    icon: '✅',
    description: 'Task reminders with checkboxes',
    component: () => import('@/components/widgets/RemindersWidget.vue'),
    settingsForm: () => import('@/components/widgets/RemindersSettingsForm.vue'),
    defaultConfig: () => ({ items: [], showCompleted: true, sortBy: 'created' })
  },
  'status-indicators': {
    type: 'status-indicators',
    label: 'Status Indicators',
    icon: '🟢',
    description: 'Monitor endpoint health status',
    component: () => import('@/components/widgets/StatusIndicatorsWidget.vue'),
    settingsForm: () => import('@/components/widgets/StatusIndicatorsSettingsForm.vue'),
    defaultConfig: () => ({ endpoints: [], showLatency: false, showStatusCode: false, refreshInterval: 1800 })
  },
  speedtest: {
    type: 'speedtest',
    label: 'Speedtest',
    icon: '⚡',
    description: 'Network speed test (ping, download, upload)',
    component: () => import('@/components/widgets/SpeedtestWidget.vue'),
    settingsForm: () => import('@/components/widgets/SpeedtestSettingsForm.vue'),
    defaultConfig: () => ({ server: 'cloudflare', customBaseUrl: '', testDuration: 10, parallelStreams: 4 })
  },
  weather: {
    type: 'weather',
    label: 'Weather',
    icon: '🌤️',
    description: 'Current conditions and 5-day forecast',
    component: () => import('@/components/widgets/WeatherWidget.vue'),
    settingsForm: () => import('@/components/widgets/WeatherSettingsForm.vue'),
    defaultConfig: () => ({ location: '', latitude: 0, longitude: 0, tempUnit: 'celsius', windUnit: 'kmh' })
  },
  uptime: {
    type: 'uptime',
    label: 'Server Uptime',
    icon: '🟢',
    description: 'Monitor endpoint availability',
    component: () => import('@/components/widgets/UptimeWidget.vue'),
    settingsForm: () => import('@/components/widgets/UptimeSettingsForm.vue'),
    defaultConfig: () => ({ endpoints: [], checkInterval: 300 })
  },
  calendar: {
    type: 'calendar',
    label: 'Calendar',
    icon: '📅',
    description: 'CalDAV calendar events',
    component: () => import('@/components/widgets/CalendarWidget.vue'),
    settingsForm: () => import('@/components/widgets/CalendarSettingsForm.vue'),
    defaultConfig: () => ({ serverUrl: '', username: '', password: '', calendarUrl: '', displayName: '', displayMode: 'upcoming', eventCount: 10, refreshInterval: 15 })
  },
  'process-list': {
    type: 'process-list',
    label: 'Process List',
    icon: '📊',
    description: 'Monitor server processes via SSH',
    component: () => import('@/components/widgets/ProcessListWidget.vue'),
    settingsForm: () => import('@/components/widgets/ProcessListSettingsForm.vue'),
    defaultConfig: () => ({ connectionId: '', refreshInterval: 10, sortBy: 'cpu', sortOrder: 'desc', maxProcesses: 25, filterText: '' })
  },
}

export const widgetList = Object.values(widgetRegistry)
  .sort((a, b) => a.label.localeCompare(b.label))
