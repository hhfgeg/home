import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || '80', 10);
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FALLBACK_SLUG = 'yunzhongshu';

// ---- Token 签名密钥（生产环境可通过环境变量覆盖） ----
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 小时

// ---- 不可删除/修改的受保护卡片 ID ----
const PROTECTED_IDS = new Set(['about', 'signature']);

// ---- MIME 映射 --------------------------------------------------
const MIME = {
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

// ================================================================
//  密码学工具函数（PBKDF2 加盐哈希 — 不可反推）
// ================================================================
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';

/** 对明文密码执行 PBKDF2 哈希 */
function hashPassword(password, salt) {
  const buf = typeof salt === 'string' ? Buffer.from(salt, 'hex') : salt;
  return crypto.pbkdf2Sync(password, buf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
}

/** 生成随机盐值 */
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 生成密码哈希字符串，格式：pbkdf2_sha256$iterations$salt$hash
 * 这种自包含格式让验证时无需额外查表。
 */
function makePasswordHash(password) {
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  return `pbkdf2_${PBKDF2_DIGEST}$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

/** 验证密码：从存储的 hash 字符串中提取参数，重新计算并比对 */
function verifyPassword(password, storedHash) {
  try {
    const parts = storedHash.split('$');
    if (parts.length < 4) return false;
    const [, , iterations, salt, hash] = parts;
    const computed = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), parseInt(iterations), PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

// ================================================================
//  Token 工具函数（HMAC-SHA256 签名，防止伪造）
// ================================================================

/** 生成登录令牌 */
function generateToken(username) {
  const expires = Date.now() + TOKEN_TTL;
  const payload = `${username}:${expires}`;
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

/** 验证令牌，返回用户名或 null */
function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const idx1 = decoded.indexOf(':');
    const idx2 = decoded.lastIndexOf(':');
    if (idx1 < 0 || idx2 <= idx1) return null;
    const username = decoded.slice(0, idx1);
    const expires = parseInt(decoded.slice(idx1 + 1, idx2), 10);
    const hmac = decoded.slice(idx2 + 1);
    if (isNaN(expires) || Date.now() > expires) return null;
    const payload = `${username}:${expires}`;
    const recomputed = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(recomputed), Buffer.from(hmac))) return null;
    return username;
  } catch {
    return null;
  }
}

/** 从请求头中提取 Bearer token */
function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)/i);
  return m ? m[1] : null;
}

/** 验证请求是否携带有效 token，返回用户名或 null */
function authenticate(req) {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}

// ================================================================
//  数据读写工具
// ================================================================
function readSpaceData(slug) {
  const filePath = path.join(DATA_DIR, `${slug}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeSpaceData(slug, data) {
  const filePath = path.join(DATA_DIR, `${slug}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

function getSignatures(data) {
  const sigs = data['signatures'];
  return Array.isArray(sigs) ? sigs : [];
}

/** 读取用户文件 data/<username>.json，不存在返回 null */
function readUserFile(username) {
  const filePath = path.join(DATA_DIR, `${username}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 写入用户文件 data/<username>.json */
async function writeUserFile(username, data) {
  const filePath = path.join(DATA_DIR, `${username}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

/** 检查管理员是否已配置（admin.json 是否存在且有 passwordHash） */
function isAdminConfigured() {
  const user = readUserFile('admin');
  return !!(user && user.passwordHash);
}

async function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => resolve(body));
  });
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function streamFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  const cacheControl = filePath.includes('/assets/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cacheControl });
  fs.createReadStream(filePath).pipe(res);
}

// ================================================================
//  API Handlers
// ================================================================

// GET /api/spaces
function handleListSpaces(res) {
  try {
    const files = fs.readdirSync(DATA_DIR);
    const slugs = files
      .filter((f) => f.endsWith('.json') && !f.includes('.tmp'))
      .map((f) => f.replace(/\.json$/, ''));
    return jsonResponse(res, { slugs, default: DATA_FALLBACK_SLUG });
  } catch {
    return jsonResponse(res, { slugs: [DATA_FALLBACK_SLUG], default: DATA_FALLBACK_SLUG });
  }
}

// GET /api/space/:slug
function handleSpaceData(res, slug) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const data = readSpaceData(safeSlug);
  if (!data) return jsonResponse(res, { error: `空间不存在：${safeSlug}` }, 404);
  return jsonResponse(res, data);
}

// GET/POST /api/signatures/:slug
async function handleSignatures(req, res, slug) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  await fs.promises.mkdir(DATA_DIR, { recursive: true });

  if (req.method === 'GET') {
    const data = readSpaceData(safeSlug);
    const sigs = data ? getSignatures(data) : [];
    return jsonResponse(res, sigs);
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      const incoming = JSON.parse(body);
      const data = readSpaceData(safeSlug) || {};
      const sigs = getSignatures(data);
      sigs.push({ ...incoming, id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ts: Date.now() });
      data['signatures'] = sigs;
      await writeSpaceData(safeSlug, data);
      return jsonResponse(res, sigs);
    } catch (e) {
      return jsonResponse(res, { error: String(e) }, 500);
    }
  }

  res.writeHead(405); res.end();
}

// ================================================================
//  认证 API
// ================================================================

// POST /api/auth/setup —— 首次设置管理员密码
async function handleAuthSetup(req, res, slug) {
  if (req.method !== 'POST') { res.writeHead(405); return void res.end(); }

  try {
    const body = await readBody(req);
    const { password } = JSON.parse(body);
    if (!password || password.length < 4) {
      return jsonResponse(res, { error: '密码至少需要 4 个字符' }, 400);
    }

    // 检查是否已配置过管理员（data/admin.json 是否存在）
    if (isAdminConfigured()) {
      return jsonResponse(res, { error: '管理员密码已设置，请直接登录' }, 409);
    }

    // 创建用户文件 data/admin.json（PBKDF2 加盐哈希）
    const passwordHash = makePasswordHash(password);
    await writeUserFile('admin', { id: 'admin', passwordHash });

    // 设置成功后直接返回 token
    const token = generateToken('admin');
    return jsonResponse(res, { success: true, token, username: 'admin' });
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500);
  }
}

// POST /api/auth/login —— 管理员登录
async function handleAuthLogin(req, res, slug) {
  if (req.method !== 'POST') { res.writeHead(405); return void res.end(); }

  try {
    const body = await readBody(req);
    const { username, password } = JSON.parse(body);
    if (!username || !password) {
      return jsonResponse(res, { error: '请输入用户名和密码' }, 400);
    }

    const user = readUserFile(username);
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return jsonResponse(res, { error: '用户名或密码错误' }, 401);
    }

    const token = generateToken(username);
    return jsonResponse(res, { success: true, token, username: user.id || username });
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500);
  }
}

// GET /api/auth/status —— 检查管理员是否已配置 + 当前登录状态
function handleAuthStatus(req, res, slug) {
  const configured = isAdminConfigured();
  const username = authenticate(req);
  return jsonResponse(res, { configured, loggedIn: !!username, username: username || null });
}

// ================================================================
//  卡片管理 API（需要认证）
// ================================================================

// GET /api/admin/cards/:slug —— 列出所有卡片
function handleAdminCardsGet(req, res, slug) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const username = authenticate(req);
  if (!username) return jsonResponse(res, { error: '未授权访问' }, 401);

  const data = readSpaceData(safeSlug);
  if (!data) return jsonResponse(res, { error: '空间不存在' }, 404);
  return jsonResponse(res, { items: data.items || [] });
}

// POST /api/admin/cards/:slug —— 创建或更新卡片
async function handleAdminCardsPost(req, res, slug) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const username = authenticate(req);
  if (!username) return jsonResponse(res, { error: '未授权访问' }, 401);

  try {
    const body = await readBody(req);
    const item = JSON.parse(body);
    if (!item.id || !item.kind) {
      return jsonResponse(res, { error: '卡片必须包含 id 和 kind 字段' }, 400);
    }
    if (PROTECTED_IDS.has(item.id) && item.kind !== 'about' && item.kind !== 'signature') {
      return jsonResponse(res, { error: `不允许修改受保护的卡片：${item.id}` }, 403);
    }

    const data = readSpaceData(safeSlug);
    if (!data) return jsonResponse(res, { error: '空间不存在' }, 404);

    const items = data.items || [];
    const idx = items.findIndex((c) => c.id === item.id);
    if (idx >= 0) {
      // 更新已有卡片
      if (PROTECTED_IDS.has(item.id)) {
        return jsonResponse(res, { error: `不允许修改受保护的卡片：${item.id}` }, 403);
      }
      items[idx] = { ...items[idx], ...item };
    } else {
      // 新增卡片
      items.push(item);
    }
    data['items'] = items;
    await writeSpaceData(safeSlug, data);
    return jsonResponse(res, { success: true, items });
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500);
  }
}

// DELETE /api/admin/cards/:slug/:id —— 删除卡片
async function handleAdminCardsDelete(req, res, slug, id) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const username = authenticate(req);
  if (!username) return jsonResponse(res, { error: '未授权访问' }, 401);
  if (PROTECTED_IDS.has(id)) return jsonResponse(res, { error: `不允许删除受保护的卡片：${id}` }, 403);

  const data = readSpaceData(safeSlug);
  if (!data) return jsonResponse(res, { error: '空间不存在' }, 404);

  const items = data.items || [];
  const idx = items.findIndex((c) => c.id === id);
  if (idx < 0) return jsonResponse(res, { error: '卡片不存在' }, 404);

  items.splice(idx, 1);
  data['items'] = items;
  await writeSpaceData(safeSlug, data);
  return jsonResponse(res, { success: true, items });
}

// ================================================================
//  请求路由
// ================================================================
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // ---- 认证相关（跨空间全局） ----
  // POST /api/auth/setup
  if (url === '/api/auth/setup' && method === 'POST') return void handleAuthSetup(req, res);

  // POST /api/auth/login
  if (url === '/api/auth/login' && method === 'POST') return void handleAuthLogin(req, res);

  // GET /api/auth/status
  if (url === '/api/auth/status' && method === 'GET') return void handleAuthStatus(req, res);

  // ---- 卡片管理（需认证） ----
  const adminCardsDel = url.match(/^\/api\/admin\/cards\/([^/?]+)\/([^/?]+)/);
  if (adminCardsDel && method === 'DELETE') return void handleAdminCardsDelete(req, res, adminCardsDel[1], adminCardsDel[2]);

  const adminCards = url.match(/^\/api\/admin\/cards\/([^/?]+)/);
  if (adminCards) {
    if (method === 'GET') return void handleAdminCardsGet(req, res, adminCards[1]);
    if (method === 'POST') return void handleAdminCardsPost(req, res, adminCards[1]);
  }

  // ---- 空间数据 ----
  if (url === '/api/spaces' && method === 'GET') return void handleListSpaces(res);

  const spaceMatch = url.match(/^\/api\/space\/([^/?]+)/);
  if (spaceMatch && method === 'GET') return void handleSpaceData(res, spaceMatch[1]);

  // ---- 签名墙 ----
  const sigMatch = url.match(/^\/api\/signatures\/([^/?]+)/);
  if (sigMatch) return void handleSignatures(req, res, sigMatch[1]);

  // ---- 静态文件 ----
  if (method === 'GET') {
    const normalized = url.split('?')[0];
    const filePath = path.join(DIST_DIR, normalized === '/' ? 'index.html' : normalized);
    if (!filePath.startsWith(DIST_DIR)) { res.writeHead(403); return void res.end('Forbidden'); }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return void streamFile(res, filePath);

    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) return void streamFile(res, indexPath);
    res.writeHead(404);
    return void res.end('Not Found');
  }

  res.writeHead(405);
  res.end();
});

// ---- 启动 ----
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`   Static:   ${DIST_DIR}`);
  console.log(`   Data:     ${DATA_DIR}`);
  console.log(`   API:`);
  console.log(`     GET  /api/spaces              → 列出所有空间`);
  console.log(`     GET  /api/space/:slug         → 读取空间数据`);
  console.log(`     GET  /api/signatures/:slug    → 读取签名墙`);
  console.log(`     POST /api/signatures/:slug    → 提交签名`);
});
