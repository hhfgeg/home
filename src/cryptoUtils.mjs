import crypto from 'node:crypto';

// ================================================================
//  密码学工具函数（PBKDF2 加盐哈希 — 不可反推）
//  供 server.mjs 和 vite.config.ts 共享使用
// ================================================================

export const PBKDF2_ITERATIONS = 100000;
export const PBKDF2_KEYLEN = 32;
export const PBKDF2_DIGEST = 'sha256';

/** 对明文密码执行 PBKDF2 哈希 */
export function hashPassword(password, salt) {
  const buf = typeof salt === 'string' ? Buffer.from(salt, 'hex') : salt;
  return crypto.pbkdf2Sync(password, buf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
}

/** 生成随机盐值 */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 生成密码哈希字符串，格式：pbkdf2_sha256$iterations$salt$hash
 * 这种自包含格式让验证时无需额外查表。
 */
export function makePasswordHash(password) {
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  return `pbkdf2_${PBKDF2_DIGEST}$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

/** 验证密码：从存储的 hash 字符串中提取参数，重新计算并比对 */
export function verifyPassword(password, storedHash) {
  try {
    const parts = storedHash.split('$');
    if (parts.length < 4) return false;
    const [, iterations, salt, hash] = parts;
    const computed = crypto.pbkdf2Sync(
      password,
      Buffer.from(salt, 'hex'),
      parseInt(iterations),
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST
    ).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}
