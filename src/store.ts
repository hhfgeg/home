import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

/** Build a cursive-style SVG signature dataURL (used for seed entries). */
export function sigSvg(name: string, color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='84' viewBox='0 0 260 84'><text x='8' y='56' font-family='cursive, serif' font-size='46' font-style='italic' fill='${color}' style='font-style:italic;font-weight:600'>${name}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const seed: Signature[] = [
  {
    id: 'seed-aria',
    x: 17,
    y: 28,
    rot: -6,
    img: sigSvg('Aria', '#22e3ff'),
    name: 'Aria',
    comment: '这趟 AI 旅程太惊艳了，潜空间的画面让人窒息！',
    color: '#22e3ff',
    ts: Date.now() - 90000,
  },
  {
    id: 'seed-kai',
    x: 60,
    y: 20,
    rot: 4,
    img: sigSvg('Kai', '#ff3df0'),
    name: 'Kai',
    comment: '「让模型从回答者进化为行动者」——这句话我记下了。',
    color: '#ff3df0',
    ts: Date.now() - 60000,
  },
  {
    id: 'seed-mira',
    x: 41,
    y: 66,
    rot: -2,
    img: sigSvg('Mira', '#9dff3d'),
    name: 'Mira',
    comment: '期待量子-神经混合的下一步，会持续关注 👀',
    color: '#9dff3d',
    ts: Date.now() - 30000,
  },
]

type State = {
  focusedId: string | null
  setFocused: (id: string | null) => void
  signatures: Signature[]
  addSignature: (s: Omit<Signature, 'id' | 'ts'>) => void
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      focusedId: null,
      setFocused: (id) => set({ focusedId: id }),
      signatures: seed,
      addSignature: (s) =>
        set((st) => ({
          signatures: [
            ...st.signatures,
            { ...s, id: `sig-${Math.random().toString(36).slice(2)}`, ts: Date.now() },
          ],
        })),
    }),
    {
      name: 'yunzhongshu-signature-wall',
      partialize: (s) => ({ signatures: s.signatures }),
    }
  )
)
