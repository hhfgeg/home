export type Contact = { label: string; value: string; href: string }
export type Stat = { k: string; v: string }

export type Card =
  | {
      kind: 'work'
      id: string
      title: string
      subtitle: string
      year: string
      tags: string[]
      accent: string
      poster: string
      intro: string
      concept: string
      link: string
      video?: string
    }
  | {
      kind: 'about'
      id: 'about'
      title: string
      subtitle: string
      accent: string
      poster?: string
      name: string
      role: string
      location: string
      bio: string[]
      stats: Stat[]
      contacts: Contact[]
    }
  | {
      kind: 'signature'
      id: 'signature'
      title: string
      subtitle: string
      accent: string
    }

export const CARD_W = 3.9
export const CARD_H = 2.19375 // 16:9

/**
 * 根据卡片数量计算展示圆半径，避免作品增多时卡片折叠拥挤。
 * 保证相邻卡片弧长至少为卡片宽度的 factor 倍（含间隙）。
 */
export function galleryRadius(count: number): number {
  const min = 6.8
  const factor = 1.8
  return Math.max(min, (CARD_W * factor * count) / (2 * Math.PI))
}

export type SpaceTheme = {
  primary: string
  secondary: string
}

export type SpaceData = {
  slug: string
  /** 中文/展示名称（选填）。留空时回退到 brand/slug */
  name?: string
  brand: string
  subtitle: string
  studio: string
  title: string
  description: string
  theme: SpaceTheme
  items: Card[]
}

/**
 * 空间对外展示名称：优先使用中文名 name，其次 brand，最后 slug。
 * 领取空间时若未填中文名，将回退到 slug，保证始终有可读标题。
 */
export function spaceDisplayName(space: SpaceData): string {
  return (space.name?.trim() || space.brand?.trim() || space.slug).trim()
}

/** 默认空间标识（根路径重定向目标） */
export const DEFAULT_SLUG = 'yunzhongshu'

/**
 * 构建时聚合 data/*.json 下的所有空间数据文件。
 * 每个文件形如 `data/<slug>.json`，其 slug 即为 URL 路径参数。
 * 新增空间只需在 data 目录放入对应 JSON，无需改动代码。
 */
const modules = import.meta.glob('../data/*.json', { eager: true }) as Record<
  string,
  { default: SpaceData }
>

const spaces: Record<string, SpaceData> = {}
for (const [path, mod] of Object.entries(modules)) {
  const slug = path.match(/\/([^/]+)\.json$/)?.[1]
  if (slug && mod.default && !slug.includes('.')) {
    spaces[slug] = mod.default
  }
}

/** 列出所有可用空间 slug */
export function listSpaces(): string[] {
  return Object.keys(spaces)
}

/** 按 slug 加载空间数据，不存在时返回 null */
export function loadSpace(slug: string): SpaceData | null {
  return spaces[slug] ?? null
}
