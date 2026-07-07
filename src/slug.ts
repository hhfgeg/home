/**
 * 空间标识（slug）规则集中管理。
 *
 * 前端创建空间、服务端校验空间创建共用同一套规则，避免逻辑散落各处。
 * 规则：小写字母、数字、连字符，长度 2-32。
 */

export const SLUG_PATTERN = /^[a-z0-9-]{2,32}$/
export const SLUG_MAX_LEN = 32

/** 校验 slug 是否合法（已是规范化后的小写形式也可直接校验） */
export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

/**
 * 将任意用户输入规范化为合法 slug：
 * 转小写、移除非 [a-z0-9-] 字符、截断到最大长度。
 * 规范化后若仍不满足长度下限则返回空串。
 */
export function normalizeSlug(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, SLUG_MAX_LEN)
  return cleaned.length >= 2 ? cleaned : ''
}

/**
 * 校验 slug 并返回错误信息（合法时返回 null）。
 * 用于表单提交前的友好提示，文案与服务端保持一致。
 */
export function validateSlug(slug: string): string | null {
  if (!slug) return '请输入空间标识'
  if (!isValidSlug(slug)) {
    return '仅支持小写字母、数字和连字符，2-32个字符'
  }
  return null
}
