import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  generateSalt,
  makePasswordHash,
  verifyPassword,
  PBKDF2_ITERATIONS,
  PBKDF2_KEYLEN,
  PBKDF2_DIGEST,
} from './cryptoUtils.mjs';

describe('cryptoUtils - makePasswordHash', () => {
  it('应生成正确格式的哈希字符串', () => {
    const hash = makePasswordHash('mypassword123');
    const parts = hash.split('$');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe(`pbkdf2_${PBKDF2_DIGEST}`);
    expect(parseInt(parts[1])).toBe(PBKDF2_ITERATIONS);
    expect(parts[2]).toHaveLength(32); // 16 bytes hex = 32 chars
    expect(parts[3]).toHaveLength(64); // 32 bytes hex = 64 chars
  });

  it('相同密码两次哈希结果不同（不同盐值）', () => {
    const h1 = makePasswordHash('samepass');
    const h2 = makePasswordHash('samepass');
    expect(h1).not.toBe(h2);
  });

  it('不同密码生成不同哈希', () => {
    const h1 = makePasswordHash('passwordA');
    const h2 = makePasswordHash('passwordB');
    expect(h1).not.toBe(h2);
  });
});

describe('cryptoUtils - verifyPassword', () => {
  it('正确密码验证通过', () => {
    const password = 'mySecret123';
    const hash = makePasswordHash(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it('错误密码验证失败', () => {
    const password = 'correctPass';
    const wrongPassword = 'wrongPass';
    const hash = makePasswordHash(password);
    expect(verifyPassword(wrongPassword, hash)).toBe(false);
  });

  it('空密码验证失败', () => {
    const hash = makePasswordHash('somepassword');
    expect(verifyPassword('', hash)).toBe(false);
  });

  it('只有大小写不同的密码验证失败', () => {
    const hash = makePasswordHash('MyPassword');
    expect(verifyPassword('mypassword', hash)).toBe(false);
  });

  it('带特殊字符的密码正常工作', () => {
    const password = 'p@$$w0rd!测试中文';
    const hash = makePasswordHash(password);
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('存在的真实存储哈希格式正确验证', () => {
    // 用已知密码生成哈希，再验证
    const password = 'realknownpass';
    const hash = makePasswordHash(password);

    // 验证哈希格式能被正确解析
    const parts = hash.split('$');
    expect(parts).toHaveLength(4);
    expect(parts[1]).toBe(String(PBKDF2_ITERATIONS));

    // 验证能正确通过
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it('处理损坏的哈希字符串', () => {
    expect(verifyPassword('any', 'broken')).toBe(false);
    expect(verifyPassword('any', 'a$b')).toBe(false);
    expect(verifyPassword('any', 'a$b$c')).toBe(false);
    expect(verifyPassword('any', '')).toBe(false);
  });

  it('迭代次数正确传递给 pbkdf2', () => {
    const password = 'iterTest';
    const hash = makePasswordHash(password);

    // 解析存储的迭代次数
    const parts = hash.split('$');
    const storedIterations = parseInt(parts[1]);
    expect(storedIterations).toBe(PBKDF2_ITERATIONS);

    // 确认验证通过
    expect(verifyPassword(password, hash)).toBe(true);
  });
});

describe('cryptoUtils - hashPassword', () => {
  it('相同密码和盐值产生相同哈希', () => {
    const salt = generateSalt();
    const h1 = hashPassword('test', salt);
    const h2 = hashPassword('test', salt);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // 32 bytes hex
  });

  it('不同盐值产生不同哈希', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const h1 = hashPassword('test', salt1);
    const h2 = hashPassword('test', salt2);
    expect(h1).not.toBe(h2);
  });
});

describe('cryptoUtils - generateSalt', () => {
  it('生成 32 字符 hex 字符串（16 字节）', () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/i.test(salt)).toBe(true);
  });

  it('每次生成不同的盐值', () => {
    const salts = new Set<string>();
    for (let i = 0; i < 100; i++) {
      salts.add(generateSalt());
    }
    expect(salts.size).toBe(100);
  });
});

describe('cryptoUtils - 常量值', () => {
  it('PBKDF2_ITERATIONS 为 100000', () => {
    expect(PBKDF2_ITERATIONS).toBe(100000);
  });

  it('PBKDF2_KEYLEN 为 32', () => {
    expect(PBKDF2_KEYLEN).toBe(32);
  });

  it('PBKDF2_DIGEST 为 sha256', () => {
    expect(PBKDF2_DIGEST).toBe('sha256');
  });
});
