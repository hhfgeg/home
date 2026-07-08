import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { WORK_SEED } from './src/spaceSeed.mjs'
import { makePasswordHash, verifyPassword } from './src/cryptoUtils.mjs'

// ================================================================
//  开发环境 API 中间件
// ================================================================

function devApi() {
  // 开发环境 Token 密钥（固定值，仅用于开发）
  const TOKEN_SECRET = 'dev-token-secret'
  const TOKEN_TTL = 24 * 60 * 60 * 1000
  const PROTECTED_IDS = new Set(['about', 'signature'])

  // 复用 cryptoUtils.mjs 中的 makePasswordHash / verifyPassword
  // (已通过顶层 import 引入)

  const generateToken = (username: string) => {
    const expires = Date.now() + TOKEN_TTL
    const payload = `${username}:${expires}`
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex')
    return Buffer.from(`${payload}:${hmac}`).toString('base64url')
  }

  const verifyToken = (token: string): string | null => {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8')
      const idx1 = decoded.indexOf(':')
      const idx2 = decoded.lastIndexOf(':')
      if (idx1 < 0 || idx2 <= idx1) return null
      const username = decoded.slice(0, idx1)
      const expires = parseInt(decoded.slice(idx1 + 1, idx2), 10)
      const hmac = decoded.slice(idx2 + 1)
      if (isNaN(expires) || Date.now() > expires) return null
      const payload = `${username}:${expires}`
      const recomputed = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex')
      if (!crypto.timingSafeEqual(Buffer.from(recomputed), Buffer.from(hmac))) return null
      return username
    } catch { return null }
  }

  const extractToken = (req: any): string | null => {
    const auth = req.headers['authorization'] || ''
    const m = auth.match(/^Bearer\s+(.+)/i)
    return m ? m[1] : null
  }

  const authenticate = (req: any): string | null => {
    const token = extractToken(req)
    if (!token) return null
    return verifyToken(token)
  }

  return {
    name: 'dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url: string = req.url || ''
        const method = req.method || 'GET'
        const dataDir = path.resolve(process.cwd(), 'data')

        const slugFromUrl = (pattern: RegExp) => {
          const m = url.match(pattern)
          return m ? m[1] : 'yunzhongshu'
        }

        const readSpace = async (slug: string): Promise<Record<string, any>> => {
          try {
            const raw = await fs.promises.readFile(path.join(dataDir, `${slug}.json`), 'utf-8')
            return JSON.parse(raw)
          } catch { return {} }
        }

        const writeSpace = async (slug: string, data: Record<string, any>) => {
          await fs.promises.mkdir(dataDir, { recursive: true })
          await fs.promises.writeFile(path.join(dataDir, `${slug}.json`), JSON.stringify(data, null, 2))
        }

        const readBody = (): Promise<string> =>
          new Promise((resolve) => {
            let body = ''
            req.on('data', (c: Buffer) => (body += c.toString()))
            req.on('end', () => resolve(body))
          })

        const jsonRes = (data: any, status = 200) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }

        // ---- 空间创建（可一并设置管理密码） ----
        if (url === '/api/space/new' && method === 'POST') {
          const body = JSON.parse(await readBody())
          const slug: string = (body.slug || '').toLowerCase()
          const name: string | undefined = body.name || undefined
          const password: string | undefined = body.password || undefined
          if (!slug || !/^[a-z0-9-]{2,32}$/.test(slug)) return jsonRes({ error: '标识仅支持字母数字和连字符，2-32字符' }, 400)
          if (password && password.length < 4) return jsonRes({ error: '密码至少需要 4 个字符' }, 400)
          const existing = await readSpace(slug)
          if (existing && Object.keys(existing).length > 0 && existing.slug) return jsonRes({ error: `空间 "${slug}" 已存在` }, 409)
          const data: Record<string, any> = {
            slug, name: name || '', brand: slug, subtitle: '作品空间', studio: 'CREATIVE STUDIO',
            title: `${slug} // 作品空间`, description: `${slug} 的作品空间 — 3D 互动创作廊`,
            passwordHash: '',
            theme: { primary: '#22e3ff', secondary: '#ff3df0' },
            items: [
              {
                kind: 'about', id: 'about', title: 'About // 关于', subtitle: '背景与创作探索', accent: '#22e3ff',
                name: slug, role: 'Creator', location: '远程创作',
                bio: ['在这里写下你的自我介绍…'],
                stats: [{ k: '作品', v: '0' }, { k: '年限', v: '1Y' }, { k: '领域', v: '—' }, { k: '联系', v: '—' }],
                contacts: [{ label: 'Email', value: 'hello@example.com', href: 'mailto:hello@example.com' }],
              },
              // 占位作品卡片：让新空间不至于太空荡，登录后可替换为真实作品
              ...WORK_SEED,
              { kind: 'signature', id: 'signature', title: 'Signature Wall', subtitle: '签名墙 · 留下印记', accent: '#ff3df0' },
            ],
            signatures: [],
          }
          if (password) data.passwordHash = makePasswordHash(password)
          await writeSpace(slug, data)
          const token = data.passwordHash ? generateToken(slug) : null
          return jsonRes({ success: true, space: data, token, configured: !!data.passwordHash })
        }

        // ---- 认证 API（每个空间=独立用户，密码存于空间JSON的passwordHash） ----
        if (url === '/api/auth/setup' && method === 'POST') {
          const body = JSON.parse(await readBody())
          if (!body.slug || !body.password || body.password.length < 4) return jsonRes({ error: '密码至少需要 4 个字符' }, 400)
          const data = await readSpace(body.slug)
          if (!data || Object.keys(data).length === 0) return jsonRes({ error: '空间不存在' }, 404)
          if (data.passwordHash) return jsonRes({ error: '该空间已设置密码' }, 409)
          data['passwordHash'] = makePasswordHash(body.password)
          await writeSpace(body.slug, data)
          return jsonRes({ success: true, token: generateToken(body.slug), username: body.slug })
        }

        if (url === '/api/auth/login' && method === 'POST') {
          const body = JSON.parse(await readBody())
          if (!body.username || !body.password) return jsonRes({ error: '请输入用户名和密码' }, 400)
          const data = await readSpace(body.username)
          if (!data || !data.passwordHash || !verifyPassword(body.password, data.passwordHash)) return jsonRes({ error: '用户名或密码错误' }, 401)
          return jsonRes({ success: true, token: generateToken(body.username), username: body.username })
        }

        if (url.startsWith('/api/auth/status') && method === 'GET') {
          const slugParam = new URL(url, 'http://localhost').searchParams.get('slug') || ''
          const data = slugParam ? await readSpace(slugParam) : null
          const configured = !!(data && data.passwordHash)
          return jsonRes({ configured, loggedIn: !!authenticate(req), username: authenticate(req) || null })
        }

        // ---- 卡片管理 API（需认证） ----
        if (url.startsWith('/api/admin/cards/')) {
          const user = authenticate(req)
          if (!user) return jsonRes({ error: '未授权访问' }, 401)

          // DELETE /api/admin/cards/:slug/:id
          const delMatch = url.match(/^\/api\/admin\/cards\/([^/?]+)\/([^/?]+)/)
          if (delMatch && method === 'DELETE') {
            const [, slug, id] = delMatch
            if (PROTECTED_IDS.has(id)) return jsonRes({ error: '不允许删除系统卡片' }, 403)
            const data = await readSpace(slug)
            const items = data.items || []
            const idx = items.findIndex((c: any) => c.id === id)
            if (idx < 0) return jsonRes({ error: '卡片不存在' }, 404)
            items.splice(idx, 1)
            data['items'] = items
            await writeSpace(slug, data)
            return jsonRes({ success: true, items })
          }

          // GET /api/admin/cards/:slug
          const getMatch = url.match(/^\/api\/admin\/cards\/([^/?]+)(?:\/([^/?]+))?$/)
          if (getMatch) {
            const slug = getMatch[1]
            const data = await readSpace(slug)
            if (method === 'GET') return jsonRes({ items: data.items || [] })

            // POST /api/admin/cards/:slug
            if (method === 'POST') {
              const item = JSON.parse(await readBody())
              if (!item.id || !item.kind) return jsonRes({ error: '卡片必须包含 id 和 kind 字段' }, 400)
              const items = data.items || []
              const idx = items.findIndex((c: any) => c.id === item.id)
              if (idx >= 0) {
                // 更新已有卡片（系统卡片也允许更新字段）
                items[idx] = { ...items[idx], ...item }
              } else {
                // 新增：不允许新增系统卡片
                if (PROTECTED_IDS.has(item.id)) return jsonRes({ error: '不允许新增系统卡片' }, 403)
                items.push(item)
              }
              data['items'] = items
              await writeSpace(slug, data)
              return jsonRes({ success: true, items })
            }
          }
        }

        // ---- 签名管理 API（需认证） ----
        if (url.startsWith('/api/admin/signatures/')) {
          const user = authenticate(req)
          if (!user) return jsonRes({ error: '未授权访问' }, 401)

          // DELETE /api/admin/signatures/:slug/:id
          const sigDel = url.match(/^\/api\/admin\/signatures\/([^/?]+)\/([^/?]+)/)
          if (sigDel && method === 'DELETE') {
            const [, slug, id] = sigDel
            const data = await readSpace(slug)
            const sigs = Array.isArray(data['signatures']) ? data['signatures'] : []
            const idx = sigs.findIndex((s: any) => s.id === id)
            if (idx < 0) return jsonRes({ error: '签名不存在' }, 404)
            sigs.splice(idx, 1)
            data['signatures'] = sigs
            await writeSpace(slug, data)
            return jsonRes({ success: true, signatures: sigs })
          }

          // GET /api/admin/signatures/:slug
          const sigMatch = url.match(/^\/api\/admin\/signatures\/([^/?]+)/)
          if (sigMatch && method === 'GET') {
            const data = await readSpace(sigMatch[1])
            return jsonRes(Array.isArray(data['signatures']) ? data['signatures'] : [])
          }
        }

        // ---- 空间元数据更新（需认证） ----
        if (url.startsWith('/api/space/') && method === 'PATCH') {
          const user = authenticate(req)
          if (!user) return jsonRes({ error: '未授权访问' }, 401)
          const m = url.match(/^\/api\/space\/([^/?]+)/)
          const slug = m ? m[1] : 'yunzhongshu'
          const patch = JSON.parse(await readBody())
          const data = await readSpace(slug)
          if (!data || Object.keys(data).length === 0) return jsonRes({ error: '空间不存在' }, 404)
          const META = ['name', 'brand', 'subtitle', 'studio', 'title', 'description']
          for (const f of META) if (patch[f] !== undefined) data[f] = patch[f]
          if (patch.theme) {
            data.theme = { primary: patch.theme.primary ?? data.theme?.primary, secondary: patch.theme.secondary ?? data.theme?.secondary }
          }
          await writeSpace(slug, data)
          return jsonRes({ success: true, space: data })
        }

        // ---- 签名墙 API ----
        if (url.startsWith('/api/signatures/')) {
          const m = url.match(/^\/api\/signatures\/([^/?]+)/)
          const slug = m ? m[1] : 'yunzhongshu'

          if (method === 'GET') {
            const data = await readSpace(slug)
            return jsonRes(Array.isArray(data['signatures']) ? data['signatures'] : [])
          }
          if (method === 'POST') {
            const body = await readBody()
            const incoming = JSON.parse(body)
            const data = await readSpace(slug)
            const sigs = Array.isArray(data['signatures']) ? data['signatures'] : []
            sigs.push({ ...incoming, id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ts: Date.now() })
            data['signatures'] = sigs
            await writeSpace(slug, data)
            return jsonRes(sigs)
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  base: process.env.APP_BASE_URL || '/',
  plugins: [react(), devApi()],
  build: { target: 'esnext', chunkSizeWarningLimit: 1600 },
})
