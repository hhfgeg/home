import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

/**
 * Dev middleware：签名墙数据的读写接口。
 *   GET  /api/signatures/:slug  -> 读取 data/<slug>.json 的 signatures 字段
 *   POST /api/signatures/:slug  -> 追加一条签名到 data/<slug>.json 并写回
 * 签名数据与空间数据共同存储在同一 JSON 文件中。
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
        const dataDir = path.resolve(process.cwd(), 'data')
        const jsonFile = path.join(dataDir, `${slug}.json`)

        const readSpace = async (): Promise<Record<string, any>> => {
          try {
            const raw = await fs.promises.readFile(jsonFile, 'utf-8')
            return JSON.parse(raw)
          } catch {
            return {}
          }
        }

        const getSignatures = (data: Record<string, any>): any[] =>
          Array.isArray(data['signatures']) ? data['signatures'] : []

        if (req.method === 'GET') {
          const data = await readSpace()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(getSignatures(data)))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (c: Buffer) => (body += c.toString()))
          req.on('end', async () => {
            try {
              const incoming = JSON.parse(body)
              const data = await readSpace()
              const sigs = getSignatures(data)
              sigs.push({
                ...incoming,
                id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                ts: Date.now(),
              })
              data['signatures'] = sigs
              await fs.promises.mkdir(dataDir, { recursive: true })
              await fs.promises.writeFile(jsonFile, JSON.stringify(data, null, 2))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(sigs))
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
