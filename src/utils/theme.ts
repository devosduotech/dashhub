export type ThemeName = 'dark' | 'light'

const THEMES: readonly ThemeName[] = ['dark', 'light']

let currentTheme: string | undefined
let mediaQuery: MediaQueryList | null = null

function resolveTheme(theme: string): ThemeName {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return (THEMES as readonly string[]).includes(theme) ? (theme as ThemeName) : 'dark'
}

function onPrefChange() {
  applyTheme(currentTheme)
}

export function applyTheme(theme: string | undefined): void {
  currentTheme = theme ?? 'dark'
  document.documentElement.setAttribute('data-theme', resolveTheme(currentTheme))

  if (currentTheme === 'auto') {
    if (!mediaQuery) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
      mediaQuery.addEventListener('change', onPrefChange)
    }
  } else if (mediaQuery) {
    mediaQuery.removeEventListener('change', onPrefChange)
    mediaQuery = null
  }
}
