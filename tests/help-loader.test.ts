import { describe, it, expect } from 'vitest'
import { getChapters } from '@/help/useHelpDocs'

describe('help docs loader', () => {
  it('loads non-empty raw markdown for every chapter', () => {
    const chapters = getChapters()
    expect(chapters.length).toBeGreaterThan(5)
    for (const c of chapters) {
      expect(c.raw.length).toBeGreaterThan(50)
    }
  })
})
