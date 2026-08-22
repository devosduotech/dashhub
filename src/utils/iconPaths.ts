// Icon path registry for the reusable <AppIcon /> component.
// Path data follows the Lucide icon set (ISC license) - stroke-based, 24x24 viewBox.
// Each icon is an array of primitive parts; the component renders them as SVG elements.

export type IconPart =
  | { t: 'path'; d: string; fill?: boolean }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
  | { t: 'poly'; points: string; fill?: boolean }

export type IconName =
  | 'dashboard'
  | 'server'
  | 'terminal'
  | 'activity'
  | 'monitor'
  | 'youtube'
  | 'rss'
  | 'iframe'
  | 'link'
  | 'settings'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'refresh'
  | 'close'
  | 'check'
  | 'warning'
  | 'alert-circle'
  | 'shield'
  | 'shield-check'
  | 'key'
  | 'lock'
  | 'bot'
  | 'external-link'
  | 'grip'
  | 'chevron-down'
  | 'chevron-right'
  | 'info'
  | 'search'
  | 'image'
  | 'save'
  | 'upload'
  | 'folder'
  | 'globe'
  | 'home'
  | 'cpu'
  | 'database'
  | 'clock'
  | 'bell'
  | 'users'
  | 'power'
  | 'more-h'
  | 'window'
  | 'bookmark'
  | 'wifi'
  | 'file'
  | 'cloud'
  | 'star'
  | 'arrow-up-right'
  | 'package'
  | 'spinner'
  | 'building'
  | 'code'
  | 'container'
  | 'chart'
  | 'router'
  | 'video'
  | 'play'
  | 'rocket'
  | 'phone'
  | 'tablet'
  | 'map'
  | 'compass'
  | 'pin'
  | 'target'
  | 'gift'
  | 'camera'
  | 'music'
  | 'book'
  | 'heart'
  | 'fire'
  | 'bolt'
  | 'wrench'
  | 'hammer'
  | 'robot'
  | 'moon'
  | 'sun'
  | 'sparkles'
  | 'tree'
  | 'flower'
  | 'cart'
  | 'money'
  | 'car'
  | 'plane'
  | 'calendar'
  | 'mail'
  | 'user'
  | 'storage'
  | 'palette'
  | 'game'
  | 'network'
  | 'flag'
  | 'tag'
  | 'public-ip'
  | 'latest-versions'
  | 'notes'
  | 'reminders'
  | 'check-circle'
  | 'status-indicators'

export const ICONS: Record<IconName, IconPart[]> = {
  dashboard: [
    { t: 'rect', x: 3, y: 3, w: 7, h: 9, rx: 1 },
    { t: 'rect', x: 14, y: 3, w: 7, h: 5, rx: 1 },
    { t: 'rect', x: 14, y: 12, w: 7, h: 9, rx: 1 },
    { t: 'rect', x: 3, y: 16, w: 7, h: 5, rx: 1 }
  ],
  server: [
    { t: 'rect', x: 2, y: 2, w: 20, h: 8, rx: 2 },
    { t: 'rect', x: 2, y: 14, w: 20, h: 8, rx: 2 },
    { t: 'line', x1: 6, y1: 6, x2: 6.01, y2: 6 },
    { t: 'line', x1: 6, y1: 18, x2: 6.01, y2: 18 }
  ],
  terminal: [
    { t: 'path', d: 'm7 11 2-2-2-2' },
    { t: 'path', d: 'M11 13h4' },
    { t: 'rect', x: 3, y: 3, w: 18, h: 18, rx: 2 }
  ],
  activity: [{ t: 'poly', points: '22 12 18 12 15 21 9 3 6 12 2 12' }],
  monitor: [
    { t: 'rect', x: 2, y: 3, w: 20, h: 14, rx: 2 },
    { t: 'line', x1: 8, y1: 21, x2: 16, y2: 21 },
    { t: 'line', x1: 12, y1: 17, x2: 12, y2: 21 }
  ],
  youtube: [
    { t: 'path', d: 'm22 8-6 4 6 4V8Z' },
    { t: 'rect', x: 2, y: 6, w: 14, h: 12, rx: 2 }
  ],
  rss: [
    { t: 'path', d: 'M4 11a9 9 0 0 1 9 9' },
    { t: 'path', d: 'M4 4a16 16 0 0 1 16 16' },
    { t: 'circle', cx: 5, cy: 19, r: 1 }
  ],
  iframe: [
    { t: 'rect', x: 3, y: 3, w: 18, h: 18, rx: 2 },
    { t: 'path', d: 'M3 9h18' },
    { t: 'path', d: 'M9 21V9' }
  ],
  link: [
    { t: 'path', d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
    { t: 'path', d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }
  ],
  settings: [
    {
      t: 'path',
      d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'
    },
    { t: 'circle', cx: 12, cy: 12, r: 3 }
  ],
  plus: [
    { t: 'path', d: 'M5 12h14' },
    { t: 'path', d: 'M12 5v14' }
  ],
  edit: [
    { t: 'path', d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' },
    { t: 'path', d: 'm15 5 4 4' }
  ],
  trash: [
    { t: 'path', d: 'M3 6h18' },
    { t: 'path', d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' },
    { t: 'path', d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' },
    { t: 'line', x1: 10, y1: 11, x2: 10, y2: 17 },
    { t: 'line', x1: 14, y1: 11, x2: 14, y2: 17 }
  ],
  refresh: [
    { t: 'path', d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8' },
    { t: 'path', d: 'M21 3v5h-5' }
  ],
  close: [
    { t: 'path', d: 'M18 6 6 18' },
    { t: 'path', d: 'm6 6 12 12' }
  ],
  check: [{ t: 'path', d: 'M20 6 9 17l-5-5' }],
  warning: [
    { t: 'path', d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' },
    { t: 'path', d: 'M12 9v4' },
    { t: 'path', d: 'M12 17h.01' }
  ],
  'alert-circle': [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'line', x1: 12, y1: 8, x2: 12, y2: 12 },
    { t: 'line', x1: 12, y1: 16, x2: 12.01, y2: 16 }
  ],
  shield: [{ t: 'path', d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }],
  'shield-check': [
    { t: 'path', d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' },
    { t: 'path', d: 'm9 12 2 2 4-4' }
  ],
  key: [
    { t: 'path', d: 'm15.5 7.5 3 3L22 7l-3-3' },
    { t: 'path', d: 'm21 2-9.6 9.6' },
    { t: 'circle', cx: 7.5, cy: 15.5, r: 5.5 }
  ],
  lock: [
    { t: 'rect', x: 3, y: 11, w: 18, h: 11, rx: 2 },
    { t: 'path', d: 'M7 11V7a5 5 0 0 1 10 0v4' }
  ],
  bot: [
    { t: 'path', d: 'M12 8V4H8' },
    { t: 'rect', x: 4, y: 8, w: 16, h: 12, rx: 2 },
    { t: 'path', d: 'M2 14h2' },
    { t: 'path', d: 'M20 14h2' },
    { t: 'path', d: 'M15 13v2' },
    { t: 'path', d: 'M9 13v2' }
  ],
  'external-link': [
    { t: 'path', d: 'M15 3h6v6' },
    { t: 'path', d: 'M10 14 21 3' },
    { t: 'path', d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }
  ],
  grip: [
    { t: 'circle', cx: 9, cy: 12, r: 1 },
    { t: 'circle', cx: 9, cy: 5, r: 1 },
    { t: 'circle', cx: 9, cy: 19, r: 1 },
    { t: 'circle', cx: 15, cy: 12, r: 1 },
    { t: 'circle', cx: 15, cy: 5, r: 1 },
    { t: 'circle', cx: 15, cy: 19, r: 1 }
  ],
  'chevron-down': [{ t: 'path', d: 'm6 9 6 6 6-6' }],
  'chevron-right': [{ t: 'path', d: 'm9 18 6-6-6-6' }],
  info: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'path', d: 'M12 16v-4' },
    { t: 'path', d: 'M12 8h.01' }
  ],
  search: [
    { t: 'circle', cx: 11, cy: 11, r: 8 },
    { t: 'path', d: 'm21 21-4.3-4.3' }
  ],
  image: [
    { t: 'rect', x: 3, y: 3, w: 18, h: 18, rx: 2 },
    { t: 'circle', cx: 9, cy: 9, r: 2 },
    { t: 'path', d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }
  ],
  save: [
    { t: 'path', d: 'M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' },
    { t: 'path', d: 'M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7' },
    { t: 'path', d: 'M7 3v4a1 1 0 0 0 1 1h7' }
  ],
  upload: [
    { t: 'path', d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
    { t: 'poly', points: '17 8 12 3 7 8' },
    { t: 'line', x1: 12, y1: 3, x2: 12, y2: 15 }
  ],
  folder: [{ t: 'path', d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' }],
  globe: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'path', d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' },
    { t: 'path', d: 'M2 12h20' }
  ],
  home: [
    { t: 'path', d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { t: 'poly', points: '9 22 9 12 15 12 15 22' }
  ],
  cpu: [
    { t: 'rect', x: 4, y: 4, w: 16, h: 16, rx: 2 },
    { t: 'rect', x: 9, y: 9, w: 6, h: 6 },
    { t: 'path', d: 'M15 2v2' },
    { t: 'path', d: 'M15 20v2' },
    { t: 'path', d: 'M2 15h2' },
    { t: 'path', d: 'M2 9h2' },
    { t: 'path', d: 'M20 15h2' },
    { t: 'path', d: 'M20 9h2' },
    { t: 'path', d: 'M9 2v2' },
    { t: 'path', d: 'M9 20v2' }
  ],
  database: [
    { t: 'ellipse', cx: 12, cy: 5, rx: 9, ry: 3 },
    { t: 'path', d: 'M3 5V19A9 3 0 0 0 21 19V5' },
    { t: 'path', d: 'M3 12A9 3 0 0 0 21 12' }
  ],
  clock: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'poly', points: '12 6 12 12 16 14' }
  ],
  bell: [
    { t: 'path', d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' },
    { t: 'path', d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }
  ],
  users: [
    { t: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
    { t: 'circle', cx: 9, cy: 7, r: 4 },
    { t: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
    { t: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' }
  ],
  power: [
    { t: 'path', d: 'M12 2v10' },
    { t: 'path', d: 'M18.4 6.6a9 9 0 1 1-12.77.04' }
  ],
  'more-h': [
    { t: 'circle', cx: 12, cy: 12, r: 1 },
    { t: 'circle', cx: 19, cy: 12, r: 1 },
    { t: 'circle', cx: 5, cy: 12, r: 1 }
  ],
  window: [
    { t: 'rect', x: 5, y: 2, w: 14, h: 20, rx: 2 },
    { t: 'path', d: 'M12 18v.01' }
  ],
  bookmark: [{ t: 'path', d: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' }],
  wifi: [
    { t: 'path', d: 'M12 20h.01' },
    { t: 'path', d: 'M2 8.82a15 15 0 0 1 20 0' },
    { t: 'path', d: 'M5 12.859a10 10 0 0 1 14 0' },
    { t: 'path', d: 'M8.5 16.429a5 5 0 0 1 7 0' }
  ],
  file: [
    { t: 'path', d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' },
    { t: 'path', d: 'M14 2v4a2 2 0 0 0 2 2h4' }
  ],
  cloud: [{ t: 'path', d: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' }],
  star: [{ t: 'path', d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z' }],
  'arrow-up-right': [
    { t: 'path', d: 'M7 7h10v10' },
    { t: 'path', d: 'M7 17 17 7' }
  ],
  package: [
    { t: 'path', d: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z' },
    { t: 'path', d: 'm3.3 7 8.7 5 8.7-5' },
    { t: 'path', d: 'M12 22V12' }
  ],
  spinner: [{ t: 'path', d: 'M21 12a9 9 0 1 1-6.219-8.56' }],
  building: [
    { t: 'rect', x: 4, y: 2, w: 16, h: 20, rx: 2 },
    { t: 'path', d: 'M9 22v-4h6v4' },
    { t: 'line', x1: 8, y1: 6, x2: 8.01, y2: 6 },
    { t: 'line', x1: 16, y1: 6, x2: 16.01, y2: 6 },
    { t: 'line', x1: 12, y1: 6, x2: 12.01, y2: 6 },
    { t: 'line', x1: 12, y1: 10, x2: 12.01, y2: 10 },
    { t: 'line', x1: 12, y1: 14, x2: 12.01, y2: 14 },
    { t: 'line', x1: 16, y1: 10, x2: 16.01, y2: 10 },
    { t: 'line', x1: 16, y1: 14, x2: 16.01, y2: 14 },
    { t: 'line', x1: 8, y1: 10, x2: 8.01, y2: 10 },
    { t: 'line', x1: 8, y1: 14, x2: 8.01, y2: 14 }
  ],
  code: [
    { t: 'path', d: 'm16 18 6-6-6-6' },
    { t: 'path', d: 'm8 6-6 6 6 6' }
  ],
  container: [
    { t: 'rect', x: 14, y: 3, w: 7, h: 18, rx: 1 },
    { t: 'rect', x: 3, y: 3, w: 7, h: 18, rx: 1 },
    { t: 'path', d: 'M14 8h3' },
    { t: 'path', d: 'M14 12h3' },
    { t: 'path', d: 'M14 16h3' },
    { t: 'path', d: 'M3 8h3' },
    { t: 'path', d: 'M3 12h3' },
    { t: 'path', d: 'M3 16h3' }
  ],
  chart: [
    { t: 'path', d: 'M3 3v18h18' },
    { t: 'path', d: 'M18 17V9' },
    { t: 'path', d: 'M13 17V5' },
    { t: 'path', d: 'M8 17v-3' }
  ],
  router: [
    { t: 'rect', x: 2, y: 14, w: 20, h: 8, rx: 2 },
    { t: 'line', x1: 6.01, y1: 18, x2: 6, y2: 18 },
    { t: 'line', x1: 10.01, y1: 18, x2: 10, y2: 18 },
    { t: 'path', d: 'M15 10v4' },
    { t: 'path', d: 'M17.84 7.17a4 4 0 0 0-5.66 0' },
    { t: 'path', d: 'M20.66 4.34a8 8 0 0 0-11.31 0' }
  ],
  video: [
    { t: 'path', d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5' },
    { t: 'rect', x: 2, y: 6, w: 14, h: 12, rx: 2 }
  ],
  play: [{ t: 'poly', points: '6 3 20 12 6 21 6 3' }],
  rocket: [
    { t: 'path', d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z' },
    { t: 'path', d: 'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z' },
    { t: 'path', d: 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0' },
    { t: 'path', d: 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' }
  ],
  phone: [
    { t: 'path', d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' }
  ],
  tablet: [
    { t: 'rect', x: 5, y: 2, w: 14, h: 20, rx: 2 },
    { t: 'line', x1: 12, y1: 18, x2: 12.01, y2: 18 }
  ],
  map: [
    { t: 'poly', points: '16 3 21 5 21 21 16 18 8 21 3 19 3 3 8 5 16 3' },
    { t: 'line', x1: 8, y1: 5, x2: 8, y2: 21 },
    { t: 'line', x1: 16, y1: 3, x2: 16, y2: 18 }
  ],
  compass: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'poly', points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' }
  ],
  pin: [
    { t: 'path', d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' },
    { t: 'circle', cx: 12, cy: 10, r: 3 }
  ],
  target: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'circle', cx: 12, cy: 12, r: 6 },
    { t: 'circle', cx: 12, cy: 12, r: 2 }
  ],
  gift: [
    { t: 'rect', x: 3, y: 8, w: 18, h: 4, rx: 1 },
    { t: 'path', d: 'M12 8v13' },
    { t: 'path', d: 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7' },
    { t: 'path', d: 'M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5' }
  ],
  camera: [
    { t: 'path', d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z' },
    { t: 'circle', cx: 12, cy: 13, r: 3 }
  ],
  music: [
    { t: 'path', d: 'M9 18V5l12-2v13' },
    { t: 'circle', cx: 6, cy: 18, r: 3 },
    { t: 'circle', cx: 18, cy: 16, r: 3 }
  ],
  book: [
    { t: 'path', d: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20' }
  ],
  heart: [{ t: 'path', d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' }],
  fire: [
    { t: 'path', d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' }
  ],
  bolt: [{ t: 'poly', points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' }],
  wrench: [
    { t: 'path', d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' }
  ],
  hammer: [
    { t: 'path', d: 'm15 12-8.373 8.373a1 1 0 1 1-3-3L12 9' },
    { t: 'path', d: 'm18 15 4-4' },
    { t: 'path', d: 'm21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5' }
  ],
  robot: [
    { t: 'path', d: 'M12 8V4H8' },
    { t: 'rect', x: 4, y: 8, w: 16, h: 12, rx: 2 },
    { t: 'path', d: 'M2 14h2' },
    { t: 'path', d: 'M20 14h2' },
    { t: 'path', d: 'M15 13v2' },
    { t: 'path', d: 'M9 13v2' }
  ],
  moon: [{ t: 'path', d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }],
  sun: [
    { t: 'circle', cx: 12, cy: 12, r: 4 },
    { t: 'path', d: 'M12 2v2' },
    { t: 'path', d: 'M12 20v2' },
    { t: 'path', d: 'm4.93 4.93 1.41 1.41' },
    { t: 'path', d: 'm17.66 17.66 1.41 1.41' },
    { t: 'path', d: 'M2 12h2' },
    { t: 'path', d: 'M20 12h2' },
    { t: 'path', d: 'm6.34 17.66-1.41 1.41' },
    { t: 'path', d: 'm19.07 4.93-1.41 1.41' }
  ],
  sparkles: [
    { t: 'path', d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z' },
    { t: 'path', d: 'M20 3v4' },
    { t: 'path', d: 'M22 5h-4' },
    { t: 'path', d: 'M4 17v2' },
    { t: 'path', d: 'M5 18H3' }
  ],
  tree: [
    { t: 'path', d: 'm17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z' },
    { t: 'path', d: 'M12 22v-3' }
  ],
  flower: [
    { t: 'circle', cx: 12, cy: 12, r: 3 },
    { t: 'path', d: 'M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5' },
    { t: 'path', d: 'M12 7.5V9' },
    { t: 'path', d: 'M7.5 12H9' },
    { t: 'path', d: 'M16.5 12H15' },
    { t: 'path', d: 'M12 16.5V15' }
  ],
  cart: [
    { t: 'circle', cx: 8, cy: 21, r: 1 },
    { t: 'circle', cx: 19, cy: 21, r: 1 },
    { t: 'path', d: 'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12' }
  ],
  money: [
    { t: 'rect', x: 2, y: 6, w: 20, h: 12, rx: 2 },
    { t: 'circle', cx: 12, cy: 12, r: 2 },
    { t: 'line', x1: 6, y1: 12, x2: 6.01, y2: 12 },
    { t: 'line', x1: 18, y1: 12, x2: 18.01, y2: 12 }
  ],
  car: [
    { t: 'path', d: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2' },
    { t: 'circle', cx: 7, cy: 17, r: 2 },
    { t: 'path', d: 'M9 17h6' },
    { t: 'circle', cx: 17, cy: 17, r: 2 }
  ],
  plane: [
    { t: 'path', d: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z' }
  ],
  calendar: [
    { t: 'rect', x: 3, y: 4, w: 18, h: 18, rx: 2 },
    { t: 'path', d: 'M16 2v4' },
    { t: 'path', d: 'M8 2v4' },
    { t: 'path', d: 'M3 10h18' }
  ],
  mail: [
    { t: 'rect', x: 2, y: 4, w: 20, h: 16, rx: 2 },
    { t: 'path', d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' }
  ],
  user: [
    { t: 'path', d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' },
    { t: 'circle', cx: 12, cy: 7, r: 4 }
  ],
  storage: [
    { t: 'line', x1: 22, y1: 12, x2: 2, y2: 12 },
    { t: 'path', d: 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' },
    { t: 'line', x1: 6, y1: 16, x2: 6.01, y2: 16 },
    { t: 'line', x1: 10, y1: 16, x2: 10.01, y2: 16 }
  ],
  palette: [
    { t: 'circle', cx: 13.5, cy: 6.5, r: 0.5, fill: true },
    { t: 'circle', cx: 17.5, cy: 10.5, r: 0.5, fill: true },
    { t: 'circle', cx: 8.5, cy: 7.5, r: 0.5, fill: true },
    { t: 'circle', cx: 6.5, cy: 12.5, r: 0.5, fill: true },
    { t: 'path', d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z' }
  ],
  game: [
    { t: 'line', x1: 6, y1: 11, x2: 10, y2: 11 },
    { t: 'line', x1: 8, y1: 9, x2: 8, y2: 13 },
    { t: 'line', x1: 15, y1: 12, x2: 15.01, y2: 12 },
    { t: 'line', x1: 18, y1: 10, x2: 18.01, y2: 10 },
    { t: 'path', d: 'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z' }
  ],
  network: [
    { t: 'rect', x: 9, y: 2, w: 6, h: 6, rx: 1 },
    { t: 'rect', x: 16, y: 16, w: 6, h: 6, rx: 1 },
    { t: 'rect', x: 2, y: 16, w: 6, h: 6, rx: 1 },
    { t: 'path', d: 'M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3' },
    { t: 'path', d: 'M12 12V8' }
  ],
  flag: [
    { t: 'path', d: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' },
    { t: 'line', x1: 4, y1: 22, x2: 4, y2: 15 }
  ],
  tag: [
    { t: 'path', d: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z' },
    { t: 'circle', cx: 7.5, cy: 7.5, r: 0.5, fill: true }
  ],
  'public-ip': [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'path', d: 'M2 12h20' },
    { t: 'path', d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' }
  ],
  'latest-versions': [
    { t: 'rect', x: 2, y: 7, w: 20, h: 14, rx: 2 },
    { t: 'path', d: 'M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3' },
    { t: 'path', d: 'M12 12v4' },
    { t: 'path', d: 'M10 16h4' }
  ],
  notes: [
    { t: 'path', d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' },
    { t: 'rect', x: 8, y: 2, w: 8, h: 4, rx: 1 },
    { t: 'path', d: 'M9 12h6' },
    { t: 'path', d: 'M9 16h6' }
  ],
  'check-circle': [
    { t: 'path', d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' },
    { t: 'path', d: 'm9 11 3 3L22 4' }
  ],
  reminders: [
    { t: 'path', d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' },
    { t: 'path', d: 'm9 11 3 3L22 4' }
  ],
  'status-indicators': [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'circle', cx: 12, cy: 12, r: 4 }
  ]
}

export const WIDGET_ICONS: Record<string, IconName> = {
  'quick-links': 'link',
  glances: 'activity',
  ssh: 'terminal',
  youtube: 'youtube',
  rss: 'rss',
  iframe: 'iframe',
  clock: 'clock',
  'public-ip': 'public-ip',
  'latest-versions': 'latest-versions',
  notes: 'notes',
  reminders: 'check-circle',
  'status-indicators': 'status-indicators',
  speedtest: 'bolt',
  weather: 'cloud',
  uptime: 'activity',
  calendar: 'calendar',
  'process-list': 'cpu'
}