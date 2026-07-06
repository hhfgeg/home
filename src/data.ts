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

export const CARD_W = 2.6
export const CARD_H = 1.4625 // 16:9

export type SpaceTheme = {
  primary: string
  secondary: string
}

export type SpaceData = {
  slug: string
  brand: string
  subtitle: string
  studio: string
  title: string
  description: string
  theme: SpaceTheme
  items: Card[]
}

/** 默认空间标识（根路径重定向目标） */
export const DEFAULT_SLUG = 'yunzhongshu'

/**
 * 构建时聚合 data/*.json 下的所有空间数据文件。
 * 每个文件形如 `data/<slug>.json`，其 slug 即为 URL 路径参数。
 * 新增空间只需在 data 目录放入对应 JSON，无需改动代码。
 */
const modules = import.meta.glob('/data/*.json', { eager: true }) as Record<
  string,
  { default: SpaceData }
>

const spaces: Record<string, SpaceData> = {}
for (const [path, mod] of Object.entries(modules)) {
  const slug = path.match(/\/([^/]+)\.json$/)?.[1]
  if (slug && mod.default) {
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
