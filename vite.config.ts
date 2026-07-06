import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

/**
 * Dev middleware：签名墙数据的读写接口。
 *   GET  /api/signatures/:slug  -> 读取 data/<slug>.signatures.json
 *   POST /api/signatures/:slug  -> 追加一条签名并写回文件
 * 新增签名会持久化到 data 目录，与空间数据共同作为数据源。
 */
function signaturesApi() {
  return {
    name: 'signatures-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url: string = req.url || ''
        if (!url.startsWith('/api/signatures')) return next()

        const m = url.match(/^\/api\/signatures\/([^/?]+)/)
        const slug = m ? m[1] : 'yunzhongshu'
        const file = path.resolve(process.cwd(), 'data', `${slug}.signatures.json`)

        const readAll = async (): Promise<any[]> => {
          try {
            const data = await fs.promises.readFile(file, 'utf-8')
            return JSON.parse(data)
          } catch {
            return []
          }
        }

        if (req.method === 'GET') {
          const arr = await readAll()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(arr))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', async () => {
            try {
              const incoming = JSON.parse(body)
              const arr = await readAll()
              arr.push({
                ...incoming,
                id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                ts: Date.now(),
              })
              await fs.promises.mkdir(path.dirname(file), { recursive: true })
              await fs.promises.writeFile(file, JSON.stringify(arr, null, 2))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(arr))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(e) }))
            }
          })
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), signaturesApi()],
  build: { target: 'esnext', chunkSizeWarningLimit: 1600 },
})
