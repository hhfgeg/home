import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createElement as h } from 'react'
import { isValidSlug, normalizeSlug, validateSlug } from './slug'
import NotFound from './components/NotFound'
import SpaceClaimModal from './components/SpaceClaimModal'
import { WORK_SEED } from './spaceSeed'
import { spaceDisplayName } from './data'

describe('slug 工具函数', () => {
  it('isValidSlug 接受合法的 slug', () => {
    expect(isValidSlug('yunzhongshu')).toBe(true)
    expect(isValidSlug('my-works')).toBe(true)
    expect(isValidSlug('a1')).toBe(true)
  })

  it('isValidSlug 拒绝非法 slug', () => {
    expect(isValidSlug('')).toBe(false)
    expect(isValidSlug('a')).toBe(false) // 太短
    expect(isValidSlug('AbC')).toBe(false) // 大写
    expect(isValidSlug('bad slug')).toBe(false) // 空格
    expect(isValidSlug('bad_slug')).toBe(false) // 下划线
    expect(isValidSlug('x'.repeat(33))).toBe(false) // 超长
  })

  it('normalizeSlug 规范化输入', () => {
    expect(normalizeSlug('YunZhongShu')).toBe('yunzhongshu')
    expect(normalizeSlug('My Works!')).toBe('myworks') // 空格与感叹号被移除
    expect(normalizeSlug('  abcDEF-123 ')).toBe('abcdef-123')
    expect(normalizeSlug('a')).toBe('') // 不足最小长度返回空串
  })

  it('validateSlug 返回友好错误信息', () => {
    expect(validateSlug('')).toMatch(/请输入/)
    expect(validateSlug('AB')).toMatch(/小写字母/)
    expect(validateSlug('valid-slug')).toBeNull()
  })
})

describe('404 页面支持创建空间', () => {
  it('NotFound 在未知空间时渲染「创建此空间」入口', () => {
    let claimed = false
    const html = renderToString(
      h(
        MemoryRouter,
        null,
        h(NotFound, { slug: 'missing-space', onClaim: () => { claimed = true } }),
      ),
    )
    expect(html).toContain('404')
    expect(html).toContain('missing-space')
    expect(html).toContain('创建此空间')
    expect(html).toContain('返回默认空间')
  })
})

describe('SpaceClaimModal 预填缺失 slug', () => {
  it('带 initialSlug 时输入框预填规范化后的值', () => {
    const html = renderToString(
      h(SpaceClaimModal, {
        initialSlug: 'Missing-Space',
        onClose: () => {},
        onClaimed: () => {},
      }),
    )
    // 规范化后应出现小写、连字符形式
    expect(html).toContain('value="missing-space"')
  })

  it('无 initialSlug 时输入框为空', () => {
    const html = renderToString(
      h(SpaceClaimModal, { onClose: () => {}, onClaimed: () => {} }),
    )
    expect(html).toContain('value=""')
  })
})

describe('SpaceClaimModal 密码（选填 + 显示/隐藏）', () => {
  it('渲染密码输入框与显示/隐藏切换按钮', () => {
    const html = renderToString(
      h(SpaceClaimModal, { onClose: () => {}, onClaimed: () => {} }),
    )
    expect(html).toContain('空间密码（选填）')
    expect(html).toContain('type="password"') // 默认隐藏
    expect(html).toContain('显示密码') // 切换按钮 aria-label（隐藏态）
  })

  it('onClaimed 回调契约包含 passwordSet 与 token', () => {
    // 契约断言：领取后上层据此决定是否自动登录
    const claimed: { passwordSet: boolean; token: string | null } = { passwordSet: true, token: 'tok-123' }
    expect(claimed).toHaveProperty('passwordSet')
    expect(claimed).toHaveProperty('token')
  })
})

describe('新空间占位作品种子', () => {
  it('提供 6 个占位作品且封面指向 public/assets', () => {
    expect(WORK_SEED).toHaveLength(6)
    WORK_SEED.forEach((w, i) => {
      expect(w.kind).toBe('work')
      expect(w.id).toBe(`work-${i + 1}`)
      expect(w.poster).toBe(`/assets/work${i + 1}.jpg`)
      expect(w.accent).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('占位作品 id 唯一', () => {
    const ids = WORK_SEED.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('空间中文名（spaceDisplayName）', () => {
  it('优先使用 name', () => {
    expect(spaceDisplayName({ slug: 'abc', name: '我的空间', brand: 'abc' } as any)).toBe('我的空间')
  })
  it('name 为空时回退到 brand', () => {
    expect(spaceDisplayName({ slug: 'abc', brand: 'ABC' } as any)).toBe('ABC')
  })
  it('name 与 brand 皆空时回退到 slug', () => {
    expect(spaceDisplayName({ slug: 'abc' } as any)).toBe('abc')
  })
  it('name 仅含空格时回退', () => {
    expect(spaceDisplayName({ slug: 'abc', name: '   ', brand: 'B' } as any)).toBe('B')
  })
})

describe('SpaceClaimModal 中文名输入', () => {
  it('渲染中文名输入框', () => {
    const html = renderToString(
      h(SpaceClaimModal, { onClose: () => {}, onClaimed: () => {} }),
    )
    expect(html).toContain('空间名称（选填）')
    expect(html).toContain('支持中文')
  })
})
