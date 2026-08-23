import type { Component } from 'vue'
import type { WidgetType } from '@/types/config'
import type { IconName } from '@/utils/iconPaths'

export type WidgetCategory = 'infrastructure' | 'productivity' | 'network' | 'content' | 'general'

export interface WidgetDefinition {
  type: WidgetType
  label: string
  icon: IconName
  description: string
  category: WidgetCategory
  component: () => Promise<Component>
  settingsForm: () => Promise<Component>
  defaultConfig: () => Record<string, unknown>
}

export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  'quick-links': {
    type: 'quick-links',
    label: 'Quick Links',
    icon: 'link',
    description: 'Web bookmark shortcuts',
    category: 'general',
    component: () => import('@/components/widgets/QuickLinksWidget.vue'),
    settingsForm: () => import('@/components/widgets/QuickLinksSettingsForm.vue'),
    defaultConfig: () => ({ columns: 3, displayMode: 'grid', links: [] })
  },
  glances: {
    type: 'glances',
    label: 'Glances Server',
    icon: 'activity',
    description: 'Server monitoring via Glances iframe',
    category: 'infrastructure',
    component: () => import('@/components/widgets/GlancesWidget.vue'),
    settingsForm: () => import('@/components/widgets/GlancesSettingsForm.vue'),
    defaultConfig: () => ({ url: '', displayMode: 'embedded', height: 400, width: '100%', fullWidth: true, refreshInterval: 30 })
  },
  ssh: {
    type: 'ssh',
    label: 'SSH Terminal',
    icon: 'terminal',
    description: 'Web-based SSH terminal',
    category: 'infrastructure',
    component: () => import('@/components/widgets/SshWidget.vue'),
    settingsForm: () => import('@/components/widgets/SshSettingsForm.vue'),
    defaultConfig: () => ({ defaultShell: '/bin/bash', theme: 'monokai', fontSize: 14, connections: [] })
  },
  youtube: {
    type: 'youtube',
    label: 'YouTube',
    icon: 'youtube',
    description: 'Latest videos from YouTube channels',
    category: 'content',
    component: () => import('@/components/widgets/YouTubeWidget.vue'),
    settingsForm: () => import('@/components/widgets/YouTubeSettingsForm.vue'),
    defaultConfig: () => ({ channels: [], videosPerChannel: 3, displayMode: 'grid', thumbnailSize: 'medium', cacheTime: 60 })
  },
  rss: {
    type: 'rss',
    label: 'RSS Feed',
    icon: 'rss',
    description: 'News and article aggregation',
    category: 'content',
    component: () => import('@/components/widgets/RssWidget.vue'),
    settingsForm: () => import('@/components/widgets/RssSettingsForm.vue'),
    defaultConfig: () => ({ feeds: [], itemsPerFeed: 5, showThumbnails: true, cacheTime: 15 })
  },
  iframe: {
    type: 'iframe',
    label: 'IFrame',
    icon: 'iframe',
    description: 'Embed any web content',
    category: 'content',
    component: () => import('@/components/widgets/IframeWidget.vue'),
    settingsForm: () => import('@/components/widgets/IframeSettingsForm.vue'),
    defaultConfig: () => ({ url: '', height: 400, width: '100%', fullWidth: true, allowFullscreen: true, refreshInterval: 0 })
  },
  'latest-versions': {
    type: 'latest-versions',
    label: 'Latest Versions',
    icon: 'latest-versions',
    description: 'Track latest package versions',
    category: 'infrastructure',
    component: () => import('@/components/widgets/VersionsWidget.vue'),
    settingsForm: () => import('@/components/widgets/VersionsSettingsForm.vue'),
    defaultConfig: () => ({ items: [] })
  },
  clock: {
    type: 'clock',
    label: 'Clock',
    icon: 'clock',
    description: 'Live-updating time and date',
    category: 'general',
    component: () => import('@/components/widgets/Clock.vue'),
    settingsForm: () => import('@/components/widgets/ClockSettingsForm.vue'),
    defaultConfig: () => ({ timeZone: '', format: '', hideDate: false, hideSeconds: false, use12Hour: false })
  },
  'public-ip': {
    type: 'public-ip',
    label: 'Public IP',
    icon: 'public-ip',
    description: 'Public IP address and location',
    category: 'network',
    component: () => import('@/components/widgets/PublicIpWidget.vue'),
    settingsForm: () => import('@/components/widgets/PublicIpSettingsForm.vue'),
    defaultConfig: () => ({ provider: 'ipinfo', useProxy: false, hideLocation: false })
  },
  notes: {
    type: 'notes',
    label: 'Notes',
    icon: 'notes',
    description: 'Personal text notes',
    category: 'productivity',
    component: () => import('@/components/widgets/NotesWidget.vue'),
    settingsForm: () => import('@/components/widgets/NotesSettingsForm.vue'),
    defaultConfig: () => ({ items: [], sortBy: 'created' })
  },
  reminders: {
    type: 'reminders',
    label: 'Reminders',
    icon: 'check-circle',
    description: 'Task reminders with checkboxes',
    category: 'productivity',
    component: () => import('@/components/widgets/RemindersWidget.vue'),
    settingsForm: () => import('@/components/widgets/RemindersSettingsForm.vue'),
    defaultConfig: () => ({ items: [], showCompleted: true, sortBy: 'created' })
  },
  'status-indicators': {
    type: 'status-indicators',
    label: 'Status Indicators',
    icon: 'status-indicators',
    description: 'Monitor endpoint health status',
    category: 'network',
    component: () => import('@/components/widgets/StatusIndicatorsWidget.vue'),
    settingsForm: () => import('@/components/widgets/StatusIndicatorsSettingsForm.vue'),
    defaultConfig: () => ({ endpoints: [], showLatency: false, showStatusCode: false, refreshInterval: 1800 })
  },
  speedtest: {
    type: 'speedtest',
    label: 'Speedtest',
    icon: 'bolt',
    description: 'Network speed test (ping, download, upload)',
    category: 'network',
    component: () => import('@/components/widgets/SpeedtestWidget.vue'),
    settingsForm: () => import('@/components/widgets/SpeedtestSettingsForm.vue'),
    defaultConfig: () => ({ server: 'cloudflare', customBaseUrl: '', testDuration: 10, parallelStreams: 4 })
  },
  weather: {
    type: 'weather',
    label: 'Weather',
    icon: 'cloud',
    description: 'Current conditions and 5-day forecast',
    category: 'general',
    component: () => import('@/components/widgets/WeatherWidget.vue'),
    settingsForm: () => import('@/components/widgets/WeatherSettingsForm.vue'),
    defaultConfig: () => ({ location: '', latitude: 0, longitude: 0, tempUnit: 'celsius', windUnit: 'kmh' })
  },
  uptime: {
    type: 'uptime',
    label: 'Server Uptime',
    icon: 'activity',
    description: 'Monitor endpoint availability',
    category: 'network',
    component: () => import('@/components/widgets/UptimeWidget.vue'),
    settingsForm: () => import('@/components/widgets/UptimeSettingsForm.vue'),
    defaultConfig: () => ({ endpoints: [], checkInterval: 300 })
  },
  calendar: {
    type: 'calendar',
    label: 'Calendar',
    icon: 'calendar',
    description: 'CalDAV calendar events',
    category: 'productivity',
    component: () => import('@/components/widgets/CalendarWidget.vue'),
    settingsForm: () => import('@/components/widgets/CalendarSettingsForm.vue'),
    defaultConfig: () => ({ serverUrl: '', username: '', password: '', calendarUrl: '', displayName: '', displayMode: 'upcoming', eventCount: 10, refreshInterval: 15 })
  },
  'process-list': {
    type: 'process-list',
    label: 'Process List',
    icon: 'cpu',
    description: 'Monitor server processes via SSH',
    category: 'infrastructure',
    component: () => import('@/components/widgets/ProcessListWidget.vue'),
    settingsForm: () => import('@/components/widgets/ProcessListSettingsForm.vue'),
    defaultConfig: () => ({ connectionId: '', refreshInterval: 10, sortBy: 'cpu', sortOrder: 'desc', maxProcesses: 25, filterText: '', viewMode: 'all', selectedProcesses: [] })
  },
  'system-info': {
    type: 'system-info',
    label: 'System Info',
    icon: 'server',
    description: 'CPU, RAM, Disk, Network overview via SSH',
    category: 'infrastructure',
    component: () => import('@/components/widgets/SystemInfoWidget.vue'),
    settingsForm: () => import('@/components/widgets/SystemInfoSettingsForm.vue'),
    defaultConfig: () => ({ connectionId: '', refreshInterval: 30, showCpu: true, showMemory: true, showDisk: true, showNetwork: true })
  },
  'service-status': {
    type: 'service-status',
    label: 'Service Status',
    icon: 'power',
    description: 'Monitor systemd services via SSH',
    category: 'infrastructure',
    component: () => import('@/components/widgets/ServiceStatusWidget.vue'),
    settingsForm: () => import('@/components/widgets/ServiceStatusSettingsForm.vue'),
    defaultConfig: () => ({ connectionId: '', services: [], refreshInterval: 30 })
  },
  'system-logs': {
    type: 'system-logs',
    label: 'System Logs',
    icon: 'file',
    description: 'View journalctl logs via SSH',
    category: 'infrastructure',
    component: () => import('@/components/widgets/SystemLogsWidget.vue'),
    settingsForm: () => import('@/components/widgets/SystemLogsSettingsForm.vue'),
    defaultConfig: () => ({ connectionId: '', service: '', priority: 'info', lines: 100, refreshInterval: 30 })
  },
  'database-monitor': {
    type: 'database-monitor',
    label: 'Database Monitor',
    icon: 'database',
    description: 'Monitor MySQL/MariaDB via SSH',
    category: 'infrastructure',
    component: () => import('@/components/widgets/DatabaseMonitorWidget.vue'),
    settingsForm: () => import('@/components/widgets/DatabaseMonitorSettingsForm.vue'),
    defaultConfig: () => ({ connectionId: '', dbHost: '127.0.0.1', dbPort: 3306, dbUser: '', dbPassword: '', refreshInterval: 30 })
  },
}

export const widgetList = Object.values(widgetRegistry)
  .sort((a, b) => a.label.localeCompare(b.label))
