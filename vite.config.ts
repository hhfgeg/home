import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// ================================================================
//  开发环境 API 中间件
// ================================================================

function devApi() {
  // 复用服务端相同的密码学参数
  const PBKDF2_ITERATIONS = 100000
  const PBKDF2_KEYLEN = 32
  const PBKDF2_DIGEST = 'sha256'
  const TOKEN_SECRET = 'dev-token-secret'
  const TOKEN_TTL = 24 * 60 * 60 * 1000
  const PROTECTED_IDS = new Set(['about', 'signature'])

  const hashPassword = (password: string, salt: string) =>
    crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex')

  const makePasswordHash = (password: string) => {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = hashPassword(password, salt)
    return `pbkdf2_${PBKDF2_DIGEST}$${PBKDF2_ITERATIONS}$$${salt}$${hash}`
  }

  const verifyPassword = (password: string, storedHash: string) => {
    try {
      const parts = storedHash.split('$')
      if (parts.length < 4) return false
      const [, , iterations, salt, hash] = parts
      const computed = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), parseInt(iterations), PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex')
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
    } catch { return false }
  }

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

        // 用户文件读写（data/<id>.json）
        const readUserFile = async (username: string): Promise<Record<string, any> | null> => {
          try {
            const raw = await fs.promises.readFile(path.join(dataDir, `${username}.json`), 'utf-8')
            return JSON.parse(raw)
          } catch { return null }
        }

        const writeUserFile = async (username: string, data: Record<string, any>) => {
          await fs.promises.mkdir(dataDir, { recursive: true })
          await fs.promises.writeFile(path.join(dataDir, `${username}.json`), JSON.stringify(data, null, 2))
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

        // ---- 认证 API（跨空间全局，用户存为 data/<id>.json） ----
        if (url === '/api/auth/setup' && method === 'POST') {
          const body = JSON.parse(await readBody())
          if (!body.password || body.password.length < 4) return jsonRes({ error: '密码至少需要 4 个字符' }, 400)
          const existing = await readUserFile('admin')
          if (existing && existing.passwordHash) return jsonRes({ error: '管理员密码已设置' }, 409)
          await writeUserFile('admin', { id: 'admin', passwordHash: makePasswordHash(body.password) })
          return jsonRes({ success: true, token: generateToken('admin'), username: 'admin' })
        }

        if (url === '/api/auth/login' && method === 'POST') {
          const body = JSON.parse(await readBody())
          if (!body.username || !body.password) return jsonRes({ error: '请输入用户名和密码' }, 400)
          const user = await readUserFile(body.username)
          if (!user || !user.passwordHash || !verifyPassword(body.password, user.passwordHash)) return jsonRes({ error: '用户名或密码错误' }, 401)
          return jsonRes({ success: true, token: generateToken(body.username), username: user.id || body.username })
        }

        if (url === '/api/auth/status' && method === 'GET') {
          const user = await readUserFile('admin')
          const configured = !!(user && user.passwordHash)
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
            if (PROTECTED_IDS.has(id)) return jsonRes({ error: '不允许删除受保护的卡片' }, 403)
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
              if (PROTECTED_IDS.has(item.id)) return jsonRes({ error: '不允许修改受保护的卡片' }, 403)
              const items = data.items || []
              const idx = items.findIndex((c: any) => c.id === item.id)
              if (idx >= 0) items[idx] = { ...items[idx], ...item }
              else items.push(item)
              data['items'] = items
              await writeSpace(slug, data)
              return jsonRes({ success: true, items })
            }
          }
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
  plugins: [react(), devApi()],
  build: { target: 'esnext', chunkSizeWarningLimit: 1600 },
})
