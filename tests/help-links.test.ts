import { describe, it, expect } from 'vitest'
import { rewriteLinks } from '@/help/useHelpDocs'

describe('help docs link rewriting', () => {
  it('routes in-app chapter links to /help routes', () => {
    const out = rewriteLinks('<a href="backup-restore.md">x</a>')
    expect(out).toBe('<a href="/help/backup-restore">x</a>')
  })

  it('keeps hash anchors for chapter links', () => {
    const out = rewriteLinks('<a href="faq.md#host-keys">x</a>')
    expect(out).toBe('<a href="/help/faq#host-keys">x</a>')
  })

  it('routes external .md docs (deployment guide) to GitHub in a new tab', () => {
    const out = rewriteLinks('<a href="../deployment/README.md">x</a>')
    expect(out).toContain('https://github.com/devosduotech/dashhub/blob/v1.0.19/docs/deployment/README.md')
    expect(out).toContain('target="_blank"')
  })

  it('routes SECURITY.md (with different relative depth) to GitHub', () => {
    const out = rewriteLinks('<a href="../../docs/project/SECURITY.md">x</a>')
    expect(out).toContain('https://github.com/devosduotech/dashhub/blob/v1.0.19/docs/project/SECURITY.md')
    expect(out).toContain('target="_blank"')
  })

  it('does not treat the deployment README as the in-app README chapter', () => {
    const out = rewriteLinks('<a href="../deployment/README.md">x</a>')
    expect(out).not.toContain('/help/README')
  })
})
