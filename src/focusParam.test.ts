import { describe, it, expect } from 'vitest'
import { resolveFocusItem, type Card } from './data'

// ---- 构建测试用卡片 ----
function makeWork(id: string, title = 'Work'): Card {
  return {
    kind: 'work',
    id,
    title,
    subtitle: 'sub',
    year: '2025',
    tags: ['tag'],
    accent: '#ff0000',
    poster: '/img.jpg',
    intro: 'intro',
    concept: 'concept',
    link: 'https://example.com',
  }
}

function makeAbout(): Card {
  return {
    kind: 'about',
    id: 'about',
    title: 'ABOUT',
    subtitle: 'sub',
    accent: '#00ff00',
    name: 'Name',
    role: 'Role',
    location: 'Location',
    bio: ['bio'],
    stats: [{ k: 'projects', v: '10' }],
    contacts: [{ label: 'email', value: 'a@b.com', href: 'mailto:a@b.com' }],
  }
}

function makeSignature(): Card {
  return {
    kind: 'signature',
    id: 'signature',
    title: '签名墙',
    subtitle: '留下你的印记',
    accent: '#0000ff',
  }
}

// ---- tests ----
describe('resolveFocusItem', () => {
  const items: Card[] = [makeWork('work-1'), makeWork('deep-blue'), makeAbout(), makeSignature()]

  it('param 为 null 时返回 null', () => {
    expect(resolveFocusItem(items, null)).toBeNull()
  })

  it('param 为空字符串时返回 null', () => {
    expect(resolveFocusItem(items, '')).toBeNull()
  })

  it('param 匹配存在的 work 卡片时返回该 id', () => {
    expect(resolveFocusItem(items, 'work-1')).toBe('work-1')
    expect(resolveFocusItem(items, 'deep-blue')).toBe('deep-blue')
  })

  it('param 匹配 about 卡片时返回 about', () => {
    expect(resolveFocusItem(items, 'about')).toBe('about')
  })

  it('param 匹配 signature 卡片时返回 signature', () => {
    expect(resolveFocusItem(items, 'signature')).toBe('signature')
  })

  it('param 不匹配任何卡片时返回 null', () => {
    expect(resolveFocusItem(items, 'nonexistent')).toBeNull()
    expect(resolveFocusItem(items, 'work-99')).toBeNull()
  })

  it('items 为空数组时始终返回 null', () => {
    expect(resolveFocusItem([], 'work-1')).toBeNull()
    expect(resolveFocusItem([], 'about')).toBeNull()
  })

  it('param 为空白字符时不匹配（严格比对）', () => {
    expect(resolveFocusItem(items, ' about ')).toBeNull()
    expect(resolveFocusItem(items, '  ')).toBeNull()
  })
})

describe('resolveFocusItem 与 URL 参数场景', () => {
  const items: Card[] = [makeWork('project-alpha'), makeWork('project-beta'), makeAbout(), makeSignature()]

  it('分享链接：?focus=project-alpha 直达特定作品', () => {
    // 模拟 URLSearchParams.get('focus') 的返回值
    const param = 'project-alpha'
    expect(resolveFocusItem(items, param)).toBe('project-alpha')
  })

  it('分享链接：?focus=about 直达关于页面', () => {
    expect(resolveFocusItem(items, 'about')).toBe('about')
  })

  it('分享链接：?focus=signature 直达签名墙', () => {
    expect(resolveFocusItem(items, 'signature')).toBe('signature')
  })

  it('恶意参数：?focus=invalid 忽略', () => {
    expect(resolveFocusItem(items, 'invalid')).toBeNull()
  })

  it('不带参数：画廊默认旋转态', () => {
    expect(resolveFocusItem(items, null)).toBeNull()
  })
})
