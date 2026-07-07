import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WORK_SEED } from './src/spaceSeed.mjs';
import { makePasswordHash, verifyPassword } from './src/cryptoUtils.mjs';

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
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
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

/** 检查指定空间是否已设置密码 */
function isSpaceConfigured(slug) {
  const data = readSpaceData(slug);
  return !!(data && data.passwordHash);
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

// ---- 新空间模板 --------------------------------------------------
function makeSpaceTemplate(slug, name) {
  return {
    slug,
    name: name || '',
    brand: slug,
    subtitle: '作品空间',
    studio: 'CREATIVE STUDIO',
    title: `${slug} // 作品空间`,
    description: `${slug} 的作品空间 — 科技感与未来感兼具的 3D 互动创作廊`,
    passwordHash: '',
    theme: { primary: '#22e3ff', secondary: '#ff3df0' },
    items: [
      {
        kind: 'about', id: 'about',
        title: 'About // 关于', subtitle: '背景与创作探索', accent: '#22e3ff',
        name: slug, role: 'Creator', location: '远程创作',
        bio: ['在这里写下你的自我介绍…'],
        stats: [{ k: '作品', v: '0' }, { k: '年限', v: '1Y' }, { k: '领域', v: '—' }, { k: '联系', v: '—' }],
        contacts: [{ label: 'Email', value: 'hello@example.com', href: 'mailto:hello@example.com' }],
      },
      // 占位作品卡片：让新空间不至于太空荡，登录后可替换为真实作品
      ...WORK_SEED,
      {
        kind: 'signature', id: 'signature',
        title: 'Signature Wall', subtitle: '签名墙 · 留下印记', accent: '#ff3df0',
      },
    ],
    signatures: [],
  }
}

// POST /api/space/new —— 创建新空间（可一并设置管理密码）
async function handleCreateSpace(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return void res.end(); }
  try {
    const body = await readBody(req);
    const { slug, name, password } = JSON.parse(body);
    if (!slug || !/^[a-z0-9-]{2,32}$/.test(slug)) {
      return jsonResponse(res, { error: '标识仅支持小写字母、数字和连字符，2-32字符' }, 400);
    }
    if (password !== undefined && password !== null && password !== '' && password.length < 4) {
      return jsonResponse(res, { error: '密码至少需要 4 个字符' }, 400);
    }
    // 检查是否已存在
    if (readSpaceData(slug)) {
      return jsonResponse(res, { error: `空间 "${slug}" 已存在` }, 409);
    }
    const data = makeSpaceTemplate(slug, name);
    // 创建时顺带设置密码（选填）
    if (password) {
      data.passwordHash = makePasswordHash(password);
    }
    await writeSpaceData(slug, data);

    // 若设置了密码，直接签发 token 完成自动登录；否则返回未配置标记
    const token = data.passwordHash ? generateToken(slug) : null;
    return jsonResponse(res, { success: true, space: data, token, configured: !!data.passwordHash });
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500);
  }
}

// PATCH /api/space/:slug —— 更新空间元数据（名称、文案、主题等，需认证）
const SPACE_META_FIELDS = ['name', 'brand', 'subtitle', 'studio', 'title', 'description']
async function handleUpdateSpaceMeta(req, res, slug) {
  const safeSlug = slug || DATA_FALLBACK_SLUG
  const username = authenticate(req)
  if (!username) return jsonResponse(res, { error: '未授权访问' }, 401)
  try {
    const body = await readBody(req)
    const patch = JSON.parse(body)
    const data = readSpaceData(safeSlug)
    if (!data) return jsonResponse(res, { error: '空间不存在' }, 404)

    // 顶层可变文案字段
    for (const f of SPACE_META_FIELDS) {
      if (patch[f] !== undefined) data[f] = patch[f]
    }
    // 主题色
    if (patch.theme) {
      data.theme = {
        primary: patch.theme.primary ?? data.theme?.primary,
        secondary: patch.theme.secondary ?? data.theme?.secondary,
      }
    }
    await writeSpaceData(safeSlug, data)
    return jsonResponse(res, { success: true, space: data })
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500)
  }
}

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

// POST /api/auth/setup —— 首次设置空间密码
async function handleAuthSetup(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return void res.end(); }
  try {
    const body = await readBody(req);
    const { slug, password } = JSON.parse(body);
    if (!slug || !password || password.length < 4) {
      return jsonResponse(res, { error: '密码至少需要 4 个字符' }, 400);
    }
    if (isSpaceConfigured(slug)) {
      return jsonResponse(res, { error: '该空间已设置密码，请直接登录' }, 409);
    }
    const data = readSpaceData(slug);
    if (!data) return jsonResponse(res, { error: '空间不存在' }, 404);
    data['passwordHash'] = makePasswordHash(password);
    await writeSpaceData(slug, data);

    const token = generateToken(slug);
    return jsonResponse(res, { success: true, token, username: slug });
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500);
  }
}

// POST /api/auth/login —— 空间管理员登录
async function handleAuthLogin(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return void res.end(); }
  try {
    const body = await readBody(req);
    const { username, password } = JSON.parse(body);
    if (!username || !password) {
      return jsonResponse(res, { error: '请输入用户名和密码' }, 400);
    }
    const data = readSpaceData(username);
    if (!data || !data.passwordHash || !verifyPassword(password, data.passwordHash)) {
      return jsonResponse(res, { error: '用户名或密码错误' }, 401);
    }
    const token = generateToken(username);
    return jsonResponse(res, { success: true, token, username });
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500);
  }
}

// GET /api/auth/status —— 检查指定空间是否已配置密码 + 当前登录状态
function handleAuthStatus(req, res) {
  const { slug } = (() => {
    const url = new URL(req.url, 'http://localhost');
    return { slug: url.searchParams.get('slug') || '' };
  })();
  const configured = slug ? isSpaceConfigured(slug) : false;
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

    const data = readSpaceData(safeSlug);
    if (!data) return jsonResponse(res, { error: '空间不存在' }, 404);

    const items = data.items || [];
    const idx = items.findIndex((c) => c.id === item.id);

    if (idx >= 0) {
      // 更新已有卡片（系统卡片 about/signature 也允许更新字段）
      items[idx] = { ...items[idx], ...item };
    } else {
      // 新增卡片：不允许新增受保护的系统卡片
      if (PROTECTED_IDS.has(item.id)) {
        return jsonResponse(res, { error: `不允许新增系统卡片：${item.id}` }, 403);
      }
      items.push(item);
    }
    data['items'] = items;
    await writeSpaceData(safeSlug, data);
    return jsonResponse(res, { success: true, items });
  } catch (e) {
    return jsonResponse(res, { error: String(e) }, 500);
  }
}

// DELETE /api/admin/cards/:slug/:id —— 删除卡片（系统卡片不可删除）
async function handleAdminCardsDelete(req, res, slug, id) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const username = authenticate(req);
  if (!username) return jsonResponse(res, { error: '未授权访问' }, 401);
  if (PROTECTED_IDS.has(id)) return jsonResponse(res, { error: `不允许删除系统卡片：${id}` }, 403);

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
//  签名管理 API（需认证）
// ================================================================

// GET /api/admin/signatures/:slug —— 列出所有签名
function handleAdminSignaturesGet(req, res, slug) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const username = authenticate(req);
  if (!username) return jsonResponse(res, { error: '未授权访问' }, 401);

  const data = readSpaceData(safeSlug);
  if (!data) return jsonResponse(res, { error: '空间不存在' }, 404);
  return jsonResponse(res, getSignatures(data));
}

// DELETE /api/admin/signatures/:slug/:id —— 删除签名
async function handleAdminSignaturesDelete(req, res, slug, id) {
  const safeSlug = slug || DATA_FALLBACK_SLUG;
  const username = authenticate(req);
  if (!username) return jsonResponse(res, { error: '未授权访问' }, 401);

  const data = readSpaceData(safeSlug);
  if (!data) return jsonResponse(res, { error: '空间不存在' }, 404);

  const sigs = getSignatures(data);
  const idx = sigs.findIndex((s) => s.id === id);
  if (idx < 0) return jsonResponse(res, { error: '签名不存在' }, 404);

  sigs.splice(idx, 1);
  data['signatures'] = sigs;
  await writeSpaceData(safeSlug, data);
  return jsonResponse(res, { success: true, signatures: sigs });
}

// ================================================================
//  请求路由
// ================================================================
const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // ---- 空间创建 ----
  if (url === '/api/space/new' && method === 'POST') return void handleCreateSpace(req, res);

  // ---- 认证（每个空间=独立用户，密码存在空间JSON的passwordHash字段） ----
  if (url === '/api/auth/setup' && method === 'POST') return void handleAuthSetup(req, res);
  if (url === '/api/auth/login' && method === 'POST') return void handleAuthLogin(req, res);
  if (url.startsWith('/api/auth/status') && method === 'GET') return void handleAuthStatus(req, res);

  // ---- 卡片管理（需认证） ----
  const adminCardsDel = url.match(/^\/api\/admin\/cards\/([^/?]+)\/([^/?]+)/);
  if (adminCardsDel && method === 'DELETE') return void handleAdminCardsDelete(req, res, adminCardsDel[1], adminCardsDel[2]);

  const adminCards = url.match(/^\/api\/admin\/cards\/([^/?]+)/);
  if (adminCards) {
    if (method === 'GET') return void handleAdminCardsGet(req, res, adminCards[1]);
    if (method === 'POST') return void handleAdminCardsPost(req, res, adminCards[1]);
  }

  // ---- 签名管理（需认证） ----
  const adminSigDel = url.match(/^\/api\/admin\/signatures\/([^/?]+)\/([^/?]+)/);
  if (adminSigDel && method === 'DELETE') return void handleAdminSignaturesDelete(req, res, adminSigDel[1], adminSigDel[2]);

  const adminSig = url.match(/^\/api\/admin\/signatures\/([^/?]+)/);
  if (adminSig && method === 'GET') return void handleAdminSignaturesGet(req, res, adminSig[1]);

  // ---- 空间数据 ----
  if (url === '/api/spaces' && method === 'GET') return void handleListSpaces(res);

  const spaceMatch = url.match(/^\/api\/space\/([^/?]+)/);
  if (spaceMatch && method === 'GET') return void handleSpaceData(res, spaceMatch[1]);
  if (spaceMatch && method === 'PATCH') return void handleUpdateSpaceMeta(req, res, spaceMatch[1]);

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
