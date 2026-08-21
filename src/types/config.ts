export type WidgetType =
  | 'quick-links'
  | 'glances'
  | 'ssh'
  | 'youtube'
  | 'rss'
  | 'iframe'
  | 'clock'
  | 'public-ip'
  | 'github-trending'

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
  displayMode?: 'grid' | 'list'
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

export interface GithubTrendingWidgetConfig extends WidgetConfig {
  since?: 'daily' | 'weekly' | 'monthly'
  language?: string
  stars?: number
  limit?: number
}

export interface IframeWidgetConfig extends WidgetConfig {
  url: string
  height?: number
  width?: string | number
  fullWidth?: boolean
  allowFullscreen?: boolean
  refreshInterval?: number
}
