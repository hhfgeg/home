import { create } from 'zustand'

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

type State = {
  focusedId: string | null
  setFocused: (id: string | null) => void
  signatures: Signature[]
  loading: boolean
  /** 按 slug 从 data/<slug>.signatures.json 加载签名 */
  loadSignatures: (slug: string) => Promise<void>
  /** 追加签名并写回 data/<slug>.signatures.json */
  addSignature: (slug: string, s: Omit<Signature, 'id' | 'ts'>) => Promise<void>
}

export const useStore = create<State>((set) => ({
  focusedId: null,
  setFocused: (id) => set({ focusedId: id }),
  signatures: [],
  loading: false,
  loadSignatures: async (slug) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/signatures/${slug}`)
      const arr: Signature[] = await res.json()
      set({ signatures: arr.map(withImg), loading: false })
    } catch {
      set({ loading: false })
    }
  },
  addSignature: async (slug, s) => {
    try {
      const res = await fetch(`/api/signatures/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      const arr: Signature[] = await res.json()
      set({ signatures: arr.map(withImg) })
    } catch {
      // 接口失败时本地兜底，保证可用性
      set((st) => ({
        signatures: [
          ...st.signatures,
          withImg({ ...s, id: `sig-${Date.now()}`, ts: Date.now() }),
        ],
      }))
    }
  },
}))
