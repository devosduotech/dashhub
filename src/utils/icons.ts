import { ICONS, type IconName } from '@/utils/iconPaths'

export const iconNames = Object.keys(ICONS) as IconName[]

export function isImageIcon(icon?: string): boolean {
  if (!icon) return false
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.startsWith('data:')
}

export function safeIconName(icon?: string): IconName {
  if (icon && (ICONS as Record<string, unknown>)[icon]) {
    return icon as IconName
  }
  return 'dashboard'
}
