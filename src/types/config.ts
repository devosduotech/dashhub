export type WidgetType =
  | 'quick-links'
  | 'glances'
  | 'ssh'
  | 'youtube'
  | 'rss'
  | 'iframe'
  | 'clock'
  | 'public-ip'
  | 'latest-versions'
  | 'notes'
  | 'reminders'
  | 'status-indicators'
  | 'speedtest'
  | 'weather'
  | 'uptime'
  | 'calendar'
  | 'process-list'
  | 'system-info'
  | 'service-status'
  | 'system-logs'
  | 'database-monitor'

export type SpeedtestServer =
  | 'cloudflare'
  | 'dashhub'
  | 'custom'

export type DisplayMode = 'embedded' | 'link' | 'compact'
export type OpenTarget = 'newtab' | 'sametab' | 'modal'
export type AuthType = 'key' | 'password' | 'agent'

export interface AppSettings {
  title: string
  theme: string
  language: string
  iconSet: string
  defaultPage: number
  fontSize?: number
  footerText?: string
  showFooter?: boolean
  logoUrl?: string
  showLogo?: boolean
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface PageItem {
  id: string
  type: WidgetType
  title: string
  position?: Position
  size?: Size
  column?: number
  config: WidgetConfig
}

export interface Page {
  id: string
  name: string
  icon: string
  columnCount?: number
  items: PageItem[]
}

export interface AppConfig {
  appConfig: AppSettings
  pages: Page[]
}

export interface WidgetConfig {
  [key: string]: unknown
}

export interface QuickLink {
  title: string
  url: string
  icon?: string
  description?: string
  target?: OpenTarget
  category?: string
}

export interface SshConnection {
  id?: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  password?: string
  privateKey?: string
  passphrase?: string
  hasCredential?: boolean
  group?: string
  tags?: string[]
}

export interface YouTubeChannel {
  id: string
  name: string
}

export interface RssFeed {
  url: string
  title: string
  icon?: string
  group?: string
}

export interface GlancesSshConfig {
  enabled: boolean
  host: string
  port?: number
  username: string
}

export interface GlancesWidgetConfig extends WidgetConfig {
  url: string
  displayMode?: DisplayMode
  height?: number
  width?: string | number
  fullWidth?: boolean
  refreshInterval?: number
  ssh?: GlancesSshConfig
}

export interface QuickLinksWidgetConfig extends WidgetConfig {
  columns?: number
  displayMode?: 'grid' | 'list' | 'bar'
  links: QuickLink[]
}

export interface SshWidgetConfig extends WidgetConfig {
  defaultShell?: string
  theme?: string
  fontSize?: number
  connections: SshConnection[]
}

export interface YouTubeWidgetConfig extends WidgetConfig {
  channels: YouTubeChannel[]
  videosPerChannel?: number
  displayMode?: 'grid' | 'list'
  thumbnailSize?: 'small' | 'medium' | 'large'
  cacheTime?: number
}

export interface RssWidgetConfig extends WidgetConfig {
  feeds: RssFeed[]
  itemsPerFeed?: number
  showThumbnails?: boolean
  cacheTime?: number
}

export interface ClockWidgetConfig extends WidgetConfig {
  timeZone?: string
  format?: string
  hideDate?: boolean
  hideSeconds?: boolean
  use12Hour?: boolean
}

export interface PublicIpWidgetConfig extends WidgetConfig {
  provider?: 'ipinfo' | 'freeipapi' | 'ipquery' | 'ip-api' | 'ipgeolocation'
  useProxy?: boolean
  hideLocation?: boolean
}

export interface LatestVersionsWidgetConfig extends WidgetConfig {
  items?: Array<{ name: string; source: 'npm' | 'github' | 'pypi'; identifier: string }>
}

export interface IframeWidgetConfig extends WidgetConfig {
  url: string
  height?: number
  width?: string | number
  fullWidth?: boolean
  allowFullscreen?: boolean
  refreshInterval?: number
}

export interface NoteItem {
  id: string
  text: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
}

export interface NotesWidgetConfig extends WidgetConfig {
  items: NoteItem[]
  sortBy?: 'created' | 'priority'
}

export interface RemindersWidgetConfig extends WidgetConfig {
  items: NoteItem[]
  showCompleted?: boolean
  sortBy?: 'created' | 'priority'
}

export interface StatusEndpoint {
  name: string
  url: string
  method?: 'GET' | 'HEAD' | 'OPTIONS'
  expectedStatus?: number
  timeout?: number
  category?: string
}

export interface StatusIndicatorsWidgetConfig extends WidgetConfig {
  endpoints: StatusEndpoint[]
  showLatency?: boolean
  showStatusCode?: boolean
  refreshInterval?: number
}

export interface SpeedtestWidgetConfig extends WidgetConfig {
  server?: SpeedtestServer
  customBaseUrl?: string
  testDuration?: number
  parallelStreams?: number
}

export interface WeatherWidgetConfig extends WidgetConfig {
  location: string
  latitude: number
  longitude: number
  tempUnit: 'celsius' | 'fahrenheit'
  windUnit: 'kmh' | 'mph'
}

export interface UptimeEndpoint {
  id: string
  name: string
  url: string
}

export interface UptimeWidgetConfig extends WidgetConfig {
  endpoints: UptimeEndpoint[]
  checkInterval: 60 | 300 | 900 | 1800
}

export interface CalendarWidgetConfig extends WidgetConfig {
  serverUrl: string
  username: string
  password: string
  calendarUrl: string
  displayName: string
  displayMode: 'upcoming' | 'month'
  eventCount: number
  refreshInterval: number
}

export interface ProcessListWidgetConfig extends WidgetConfig {
  connectionId: string
  refreshInterval: number
  sortBy: 'cpu' | 'mem' | 'pid'
  sortOrder: 'desc' | 'asc'
  maxProcesses: number
  filterText: string
}

export interface SystemInfoWidgetConfig extends WidgetConfig {
  connectionId: string
  refreshInterval: number
  showCpu: boolean
  showMemory: boolean
  showDisk: boolean
  showNetwork: boolean
}

export interface ServiceStatusWidgetConfig extends WidgetConfig {
  connectionId: string
  services: Array<{ name: string; label?: string }>
  refreshInterval: number
}

export interface SystemLogsWidgetConfig extends WidgetConfig {
  connectionId: string
  service: string
  priority: string
  lines: number
  refreshInterval: number
}

export interface DatabaseMonitorWidgetConfig extends WidgetConfig {
  connectionId: string
  dbHost: string
  dbPort: number
  dbUser: string
  dbPassword: string
  refreshInterval: number
}
