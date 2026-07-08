/**
 * API 路径工具 — 自动添加 Vite base URL 前缀，
 * 确保开发环境和 Docker 部署下 API 路径与资源配置一致。
 *
 * 示例：
 *   apiUrl('/api/space/yunzhongshu')
 *   // → '/app/home/api/space/yunzhongshu'  或  '/api/space/yunzhongshu'（取决于 base 配置）
 */

const BASE = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/+$/, '')

/** 为相对 API 路径添加 base 前缀 */
export function apiUrl(path: string): string {
  return `${BASE}${path}`
}

/** 带 base 前缀的 fetch 封装 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? apiUrl(input) : input
  return fetch(url, init)
}
