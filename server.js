import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || '80', 10);
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FALLBACK_SLUG = 'yunzhongshu';

// ---- MIME 映射 --------------------------------------------------
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

// ---- 工具函数 ----------------------------------------------------
function readJSON(filePath: string): unknown[] {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => (body += chunk.toString()));
    req.on('end', () => resolve(body));
  });
}

function jsonResponse(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function streamFile(res: http.ServerResponse, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  // 静态资源长期缓存（路径含 hash）
  const cacheControl = filePath.includes('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': cacheControl,
  });
  fs.createReadStream(filePath).pipe(res);
}

// ---- API：签名墙 -------------------------------------------------
async function handleSignatures(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  slug: string,
) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const file = path.join(DATA_DIR, `${safeSlug}.signatures.json`);

  // 确保 data 目录存在
  await fs.promises.mkdir(DATA_DIR, { recursive: true });

  if (req.method === 'GET') {
    const arr = readJSON(file);
    return jsonResponse(res, arr);
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      const incoming = JSON.parse(body);
      const arr = readJSON(file);
      arr.push({
        ...incoming,
        id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
      });
      await fs.promises.writeFile(file, JSON.stringify(arr, null, 2));
      return jsonResponse(res, arr);
    } catch (e) {
      return jsonResponse(res, { error: String(e) }, 500);
    }
  }

  res.writeHead(405);
  res.end();
}

// ---- 请求路由 ----------------------------------------------------
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // ---------- API 路由 ----------
  const apiMatch = url.match(/^\/api\/signatures\/([^/?]+)/);
  if (apiMatch) {
    return void handleSignatures(req, res, apiMatch[1]);
  }

  // ---------- 静态文件 ----------
  if (method === 'GET') {
    const normalized = url.split('?')[0];
    const filePath = path.join(DIST_DIR, normalized === '/' ? 'index.html' : normalized);

    // 安全检查：防止目录穿越
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      return void res.end('Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return void streamFile(res, filePath);
    }

    // SPA 回退
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return void streamFile(res, indexPath);
    }

    res.writeHead(404);
    return void res.end('Not Found');
  }

  res.writeHead(405);
  res.end();
});

// ---- 启动 --------------------------------------------------------
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`   Static:  ${DIST_DIR}`);
  console.log(`   API:     /api/signatures/:slug`);
});
