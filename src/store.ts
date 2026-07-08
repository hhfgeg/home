import { create } from 'zustand'
import { apiUrl } from './api'

export type Signature = {
  id: string
  x: number // percent 0..100
  y: number // percent 0..100
  rot: number // degrees
  img: string // dataURL of the handwritten signature
  name: string
  comment: string
  color: string
  ts: number
}

/** Build a cursive-style SVG signature dataURL (used for seed entries without inline img). */
export function sigSvg(name: string, color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='84' viewBox='0 0 260 84'><text x='8' y='56' font-family='cursive, serif' font-size='46' font-style='italic' fill='${color}' style='font-style:italic;font-weight:600'>${name}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** 为缺少 img 的种子签名生成 SVG dataURL */
function withImg(s: Signature): Signature {
  if (!s.img && s.name) return { ...s, img: sigSvg(s.name, s.color) }
  return s
}

// ================================================================
//  签名墙状态
// ================================================================
type SpaceState = {
  focusedId: string | null
  setFocused: (id: string | null) => void
  signatures: Signature[]
  loading: boolean
  loadSignatures: (slug: string) => Promise<void>
  addSignature: (slug: string, s: Omit<Signature, 'id' | 'ts'>) => Promise<void>
}

// ================================================================
//  认证状态（用户文件存于 data/<id>.json，含 PBKDF2 加盐哈希）
// ================================================================
type AuthState = {
  isLoggedIn: boolean
  token: string | null
  username: string | null // 即 space slug
  isConfigured: boolean | null // null = 加载中
  modalOpen: boolean
  showLoginModal: boolean
  showAdminPanel: boolean
  adminSlug: string
  setModalOpen: (open: boolean) => void
  openLoginModal: (slug: string) => void
  closeLoginModal: () => void
  openAdminPanel: (slug: string) => void
  closeAdminPanel: () => void
  showClaimGuide: boolean
  setClaimGuide: (show: boolean) => void
  checkAuthStatus: (slug: string) => Promise<void>
  completeClaim: (slug: string, opts: { token?: string | null; passwordSet: boolean }) => void
  setupPassword: (slug: string, password: string) => Promise<void>
  login: (slug: string, password: string) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'yunzhongshu_auth'

function persistAuth(token: string, username: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, username }))
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

function loadPersistedAuth(): { token: string; username: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.token && data.username) return data
    return null
  } catch {
    return null
  }
}

// ---- 合并 Zustand store ----
type State = SpaceState & AuthState

export const useStore = create<State>((set) => ({
  // Space state
  focusedId: null,
  setFocused: (id) => set({ focusedId: id }),
  signatures: [],
  loading: false,
  loadSignatures: async (slug) => {
    set({ loading: true })
    try {
      const res = await fetch(apiUrl(`/api/signatures/${slug}`))
      const arr: Signature[] = await res.json()
      set({ signatures: arr.map(withImg), loading: false })
    } catch {
      set({ loading: false })
    }
  },
  addSignature: async (slug, s) => {
    try {
      const res = await fetch(apiUrl(`/api/signatures/${slug}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      const arr: Signature[] = await res.json()
      set({ signatures: arr.map(withImg) })
    } catch {
      set((st) => ({
        signatures: [
          ...st.signatures,
          withImg({ ...s, id: `sig-${Date.now()}`, ts: Date.now() }),
        ],
      }))
    }
  },

  // Auth state
  isLoggedIn: false,
  token: null,
  username: null,
  isConfigured: null,
  modalOpen: false,
  showLoginModal: false,
  showAdminPanel: false,
  adminSlug: '',
  setModalOpen: (open) => set({ modalOpen: open }),
  openLoginModal: (slug) => set({ showLoginModal: true, adminSlug: slug, modalOpen: true }),
  closeLoginModal: () => set({ showLoginModal: false, modalOpen: false }),
  openAdminPanel: (slug) => set({ showAdminPanel: true, adminSlug: slug, modalOpen: true }),
  closeAdminPanel: () => set({ showAdminPanel: false, adminSlug: '', modalOpen: false }),
  // 注册引导
  showClaimGuide: false,
  setClaimGuide: (show: boolean) => set({ showClaimGuide: show }),

  checkAuthStatus: async (slug) => {
    try {
      const res = await fetch(apiUrl(`/api/auth/status?slug=${encodeURIComponent(slug)}`))
      const data = await res.json()
      const persisted = loadPersistedAuth()

      if (persisted && data.configured) {
        const verifyRes = await fetch(apiUrl(`/api/auth/status?slug=${encodeURIComponent(slug)}`), {
          headers: { Authorization: `Bearer ${persisted.token}` },
        })
        const verifyData = await verifyRes.json()
        if (verifyData.loggedIn) {
          set({ isLoggedIn: true, token: persisted.token, username: verifyData.username, isConfigured: true })
          return
        }
      }

      clearAuth()
      set({ isLoggedIn: false, token: null, username: null, isConfigured: data.configured })
    } catch {
      const persisted = loadPersistedAuth()
      set({
        isLoggedIn: !!persisted,
        token: persisted?.token || null,
        username: persisted?.username || null,
        isConfigured: false,
      })
    }
  },

  setupPassword: async (slug, password) => {
    const res = await fetch(apiUrl('/api/auth/setup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '设置失败')
    }
    const data = await res.json()
    persistAuth(data.token, data.username)
    set({ isLoggedIn: true, token: data.token, username: data.username, isConfigured: true })
  },

  /**
   * 领取空间后收尾：若创建时已设置密码，服务端会直接返回 token，
   * 这里用它完成自动登录，省去再次输入密码。
   */
  completeClaim: (slug: string, opts: { token?: string | null; passwordSet: boolean }) => {
    if (opts.token) {
      persistAuth(opts.token, slug)
      set({ isLoggedIn: true, token: opts.token, username: slug, isConfigured: true })
    } else {
      set({ isConfigured: false })
    }
  },

  login: async (username, password) => {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '登录失败')
    }
    const data = await res.json()
    persistAuth(data.token, data.username)
    set({ isLoggedIn: true, token: data.token, username: data.username, isConfigured: true })
  },

  logout: () => {
    clearAuth()
    set({ isLoggedIn: false, token: null, username: null })
  },
}))


