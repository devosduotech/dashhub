import { marked } from 'marked'
import DOMPurify from 'dompurify'

export interface HelpChapter {
  id: string
  title: string
  icon: string
  raw: string
}

interface ImageModule {
  default: string
}

const mdModules = import.meta.glob<{
  default: string
}>('../../docs/user-manual/*.md', { eager: true, query: '?raw' })

const imageModules = import.meta.glob<{ default: string }>(
  '../../docs/images/*.png',
  { eager: true, query: '?url' }
)

const imageMap: Record<string, string> = {}
for (const [path, mod] of Object.entries(imageModules)) {
  const filename = path.split('/').pop()!
  imageMap[`../images/${filename}`] = (mod as ImageModule).default
}

const CHAPTER_META: Array<{ id: string; title: string; icon: string }> = [
  { id: 'README', title: 'Introduction', icon: 'info' },
  { id: 'getting-started', title: 'Getting Started', icon: 'rocket' },
  { id: 'dashboard', title: 'Building Your Dashboard', icon: 'dashboard' },
  { id: 'widgets', title: 'Widgets Overview', icon: 'window' },
  { id: 'ssh', title: 'SSH Management', icon: 'terminal' },
  { id: 'monitoring', title: 'Monitoring Widgets', icon: 'activity' },
  { id: 'productivity', title: 'Productivity Widgets', icon: 'calendar' },
  { id: 'resources', title: 'Information & Resources', icon: 'link' },
  { id: 'network', title: 'Network & Utilities', icon: 'globe' },
  { id: 'backup-restore', title: 'Backup & Restore', icon: 'save' },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: 'alert-circle' },
  { id: 'faq', title: 'FAQ', icon: 'help' }
]

const CHAPTER_IDS = new Set(CHAPTER_META.map((m) => m.id))

const REPO_BASE = 'https://github.com/devosduotech/dashhub/blob/v1.0.21/'

function normalizeRepoPath(rel: string): string {
  const parts = ('docs/user-manual/' + rel).split('/')
  const stack: string[] = []
  for (const part of parts) {
    if (part === '' || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return stack.join('/')
}

marked.setOptions({ breaks: true, gfm: true })

export function getChapters(): HelpChapter[] {
  return CHAPTER_META.map((meta) => {
    const key = Object.keys(mdModules).find((k) => {
      const file = k.split('/').pop()!.replace('.md', '')
      return file === meta.id
    })
    const raw = key ? (mdModules[key] as { default: string }).default : ''
    return { id: meta.id, title: meta.title, icon: meta.icon, raw }
  })
}

export function rewriteLinks(html: string): string {
  return (
    html
      .replace(/\.\.\/images\/([^)"']+)/g, (_, name: string) => {
        return imageMap[`../images/${name}`] || `../images/${name}`
      })
      .replace(/href="([^"]+\.md)(#[^"]*)?"/g, (_, file: string, hash: string) => {
        const clean = file.replace(/^\.\//, '')
        if (!clean.includes('/')) {
          const base = clean.replace('.md', '')
          if (CHAPTER_IDS.has(base)) {
            return `href="/help/${base}${hash || ''}"`
          }
        }
        const repoPath = normalizeRepoPath(clean)
        return `href="${REPO_BASE}${repoPath}${hash || ''}" target="_blank" rel="noopener noreferrer"`
      })
  )
}

export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw) as string
  const safe = DOMPurify.sanitize(html, {
    ADD_TAGS: ['img'],
    ADD_ATTR: ['src', 'alt', 'title', 'target', 'rel']
  })
  return rewriteLinks(safe)
}

export function getChapterById(id: string): HelpChapter | undefined {
  return getChapters().find((c) => c.id === id)
}
