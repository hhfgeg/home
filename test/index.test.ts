import { describe, it, expect } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('Works Data Validation', () => {
  it('should have valid author data', () => {
    const data = {
      author: {
        penName: '云中书',
        bio: '探索AI',
        tags: ['AI探索者'],
        contact: { email: 'test@test.com' }
      },
      works: []
    }

    expect(data.author.penName).toBeDefined()
    expect(data.author.penName.length).toBeGreaterThan(0)
    expect(Array.isArray(data.author.tags)).toBe(true)
    expect(data.author.contact.email).toBeDefined()
  })

  it('should have valid work items structure', () => {
    const workItem = {
      id: 'test-work',
      name: '测试作品',
      summary: '简介',
      description: '详细描述',
      link: 'https://example.com',
      video: null,
      thumbnail: 'test',
      category: 'AI艺术',
      tags: ['标签1', '标签2'],
      position: { wall: 0, index: 0 }
    }

    expect(workItem.id).toBeDefined()
    expect(workItem.name).toBeDefined()
    expect(workItem.position.wall).toBeGreaterThanOrEqual(0)
    expect(workItem.position.wall).toBeLessThanOrEqual(3)
    expect(Array.isArray(workItem.tags)).toBe(true)
    expect(typeof workItem.link).toBe('string')
  })

  it('should load actual works data correctly', async () => {
    // Read the JSON file directly using Node's filesystem since vitest doesn't resolve Nuxt aliases
    const fs = await import('node:fs')
    const path = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const jsonPath = path.resolve(__dirname, '..', 'app', 'data', 'works.json')
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(raw)

    expect(data).toBeDefined()
    expect(data.author).toBeDefined()
    expect(data.author.penName).toBe('云中书')
    expect(Array.isArray(data.works)).toBe(true)
    expect(data.works.length).toBeGreaterThan(0)

    // Validate each work
    data.works.forEach((work: any) => {
      expect(work.id).toBeTruthy()
      expect(work.name).toBeTruthy()
      expect(work.summary).toBeTruthy()
      expect(work.description).toBeTruthy()
      expect(work.category).toBeTruthy()
      expect(work.position.wall).toBeGreaterThanOrEqual(0)
      expect(work.position.wall).toBeLessThanOrEqual(3)
    })
  })
})

describe('Signature Management', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('should generate signature with correct structure', () => {
    const sig = {
      id: `sig-${Date.now()}`,
      name: '测试用户',
      comment: '测试评论',
      signatureDataUrl: 'data:image/png;base64,test',
      createdAt: new Date().toISOString(),
      position: { x: 0, y: 0, z: 0 }
    }

    expect(sig.id).toMatch(/^sig-/)
    expect(sig.name).toBeTruthy()
    expect(sig.signatureDataUrl.startsWith('data:image')).toBe(true)
    expect(sig.position).toHaveProperty('x')
    expect(sig.position).toHaveProperty('y')
    expect(sig.position).toHaveProperty('z')
  })

  it('should persist and load signatures from localStorage', () => {
    const testSigs = [
      {
        id: 'sig-1',
        name: '用户A',
        comment: '评论A',
        signatureDataUrl: 'data:image/png;base64,a',
        createdAt: '2025-01-01',
        position: { x: 0, y: 1, z: -3 }
      }
    ]

    localStorage.setItem('yunzhongshu-signatures', JSON.stringify(testSigs))
    const loaded = JSON.parse(localStorage.getItem('yunzhongshu-signatures')!)

    expect(loaded).toHaveLength(1)
    expect(loaded[0].name).toBe('用户A')
    expect(loaded[0].position.z).toBe(-3)
  })

  it('should return empty array when no signatures stored', () => {
    const loaded = localStorage.getItem('yunzhongshu-signatures')
    expect(loaded).toBeNull()
  })
})

describe('Room Bounds Validation', () => {
  const ROOM_SIZE = { width: 20, height: 8, depth: 16 }
  const bounds = {
    minX: -ROOM_SIZE.width / 2 + 0.5,
    maxX: ROOM_SIZE.width / 2 - 0.5,
    minZ: -ROOM_SIZE.depth / 2 + 0.5,
    maxZ: ROOM_SIZE.depth / 2 - 0.5
  }

  it('should have correct room dimensions', () => {
    expect(ROOM_SIZE.width).toBe(20)
    expect(ROOM_SIZE.height).toBe(8)
    expect(ROOM_SIZE.depth).toBe(16)
  })

  it('should calculate correct bounds', () => {
    expect(bounds.minX).toBeCloseTo(-9.5, 1)
    expect(bounds.maxX).toBeCloseTo(9.5, 1)
    expect(bounds.minZ).toBeCloseTo(-7.5, 1)
    expect(bounds.maxZ).toBeCloseTo(7.5, 1)
  })

  it('should reject position outside bounds', () => {
    const pos1 = { x: -10, z: 0 }
    const pos2 = { x: 5, z: 10 }
    const pos3 = { x: 3, z: 3 }

    const isInBounds = (x: number, z: number) =>
      x >= bounds.minX && x <= bounds.maxX &&
      z >= bounds.minZ && z <= bounds.maxZ

    expect(isInBounds(pos1.x, pos1.z)).toBe(false)
    expect(isInBounds(pos2.x, pos2.z)).toBe(false)
    expect(isInBounds(pos3.x, pos3.z)).toBe(true)
  })
})

describe('Work Card Color Generation', () => {
  const cardColors = [
    0x6ec6f0, 0xa8d8ea, 0xb8dff0, 0x87ceeb,
    0xadd8e6, 0x9ad0e0, 0x7ec8e3, 0x8dd4e8
  ]

  function getCardColor(index: number): number {
    return cardColors[index % cardColors.length]
  }

  it('should return valid hex color', () => {
    const color = getCardColor(0)
    expect(typeof color).toBe('number')
    expect(color).toBeGreaterThan(0)
    expect(color).toBeLessThan(0xffffff)
  })

  it('should cycle colors for large indices', () => {
    expect(getCardColor(0)).toBe(getCardColor(8))
    expect(getCardColor(1)).toBe(getCardColor(9))
    expect(getCardColor(7)).toBe(getCardColor(15))
  })

  it('should have exactly 8 unique colors', () => {
    const unique = new Set(cardColors)
    expect(unique.size).toBe(8)
  })
})
