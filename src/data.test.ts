import { describe, it, expect } from 'vitest'
import { loadSpace, listSpaces, DEFAULT_SLUG } from './data'

describe('space data loader', () => {
  it('listSpaces 包含默认空间', () => {
    expect(listSpaces()).toContain(DEFAULT_SLUG)
  })

  it('loadSpace 返回默认空间的完整数据', () => {
    const s = loadSpace(DEFAULT_SLUG)
    expect(s).not.toBeNull()
    expect(s!.slug).toBe(DEFAULT_SLUG)
    expect(s!.brand).toBe('云中书')
    expect(s!.items.length).toBeGreaterThan(0)
  })

  it('loadSpace 未知 slug 返回 null', () => {
    expect(loadSpace('this-slug-does-not-exist')).toBeNull()
  })

  it('默认空间包含 work / about / signature 三类卡片', () => {
    const s = loadSpace(DEFAULT_SLUG)!
    const kinds = s.items.map((i) => i.kind)
    expect(kinds).toContain('work')
    expect(kinds).toContain('about')
    expect(kinds).toContain('signature')
  })

  it('work 卡片的 poster 指向 /assets 公共路径', () => {
    const s = loadSpace(DEFAULT_SLUG)!
    const work = s.items.find((i) => i.kind === 'work')
    expect(work).toBeDefined()
    if (work && work.kind === 'work') {
      expect(work.poster).toMatch(/^\/assets\//)
      expect(work.accent).toMatch(/^#/)
    }
  })

  it('about 卡片包含统计与联系方式', () => {
    const s = loadSpace(DEFAULT_SLUG)!
    const about = s.items.find((i) => i.kind === 'about')
    expect(about).toBeDefined()
    if (about && about.kind === 'about') {
      expect(about.stats.length).toBeGreaterThan(0)
      expect(about.contacts.length).toBeGreaterThan(0)
      about.contacts.forEach((c) => {
        expect(c.href).toBeTruthy()
      })
    }
  })
})
