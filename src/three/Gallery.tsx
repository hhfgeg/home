import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Glow } from './effects'
import DetailView from './DetailView'
import { useStore } from '../store'
import { CARD_W, CARD_H, type Card } from '../data'

const CW = 1024
const CH = 576

function hexA(hex: string, a: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

function drawFace(ctx: CanvasRenderingContext2D, item: Card, img?: HTMLImageElement) {
  const accent = item.accent

  if (img) {
    const s = Math.max(CW / img.width, CH / img.height)
    const w = img.width * s
    const h = img.height * s
    ctx.drawImage(img, (CW - w) / 2, (CH - h) / 2, w, h)
  } else {
    const g = ctx.createLinearGradient(0, 0, CW, CH)
    g.addColorStop(0, '#070a16')
    g.addColorStop(0.5, hexA(accent, 0.18))
    g.addColorStop(1, '#02030a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, CW, CH)
    ctx.fillStyle = hexA(accent, 0.2)
    ctx.font = '420px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.kind === 'about' ? '✦' : '✎', CW / 2, CH / 2 - 30)
  }

  // vignette
  const vg = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.3, CW / 2, CH / 2, CW * 0.62)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, CW, CH)

  // bottom shade
  const bg = ctx.createLinearGradient(0, CH * 0.4, 0, CH)
  bg.addColorStop(0, 'rgba(4,6,12,0)')
  bg.addColorStop(1, 'rgba(4,6,12,0.94)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CW, CH)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // top-left tag
  ctx.font = '600 22px "JetBrains Mono", monospace'
  ctx.fillStyle = accent
  ctx.shadowColor = accent
  ctx.shadowBlur = 10
  const tag =
    item.kind === 'work'
      ? item.tags.slice(0, 2).join('  ·  ')
      : item.kind === 'about'
      ? 'PROFILE'
      : 'INTERACTIVE'
  ctx.fillText(tag, 44, 58)
  ctx.shadowBlur = 0

  // top-right label
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(220,239,255,0.7)'
  ctx.font = '500 22px "JetBrains Mono", monospace'
  ctx.fillText(item.kind === 'work' ? item.year : 'SPECIAL', CW - 44, 58)

  // accent line
  ctx.textAlign = 'left'
  ctx.strokeStyle = accent
  ctx.lineWidth = 5
  ctx.shadowColor = accent
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.moveTo(44, CH - 98)
  ctx.lineTo(150, CH - 98)
  ctx.stroke()
  ctx.shadowBlur = 0

  // title
  ctx.fillStyle = '#eafcff'
  ctx.font = '800 62px "Orbitron", system-ui, sans-serif'
  ctx.shadowColor = accent
  ctx.shadowBlur = 18
  ctx.fillText(item.title.toUpperCase(), 44, CH - 48)
  ctx.shadowBlur = 0

  // subtitle
  ctx.fillStyle = accent
  ctx.font = '500 26px "JetBrains Mono", monospace'
  ctx.fillText(item.subtitle, 46, CH - 16)

  // play badge
  if (item.kind === 'work' && item.video) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.beginPath()
    ctx.arc(CW / 2, CH / 2, 72, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(8,12,26,0.6)'
    ctx.fill()
    ctx.strokeStyle = accent
    ctx.lineWidth = 3
    ctx.shadowColor = accent
    ctx.shadowBlur = 22
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = accent
    ctx.font = '900 56px sans-serif'
    ctx.fillText('▶', CW / 2 + 6, CH / 2 + 2)
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function makeTexture(item: Card) {
  const c = document.createElement('canvas')
  c.width = CW
  c.height = CH
  const ctx = c.getContext('2d')!
  drawFace(ctx, item)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function useCardFace(item: Card) {
  const [tex, setTex] = useState(() => makeTexture(item))
  useEffect(() => {
    let cancelled = false
    const build = (img?: HTMLImageElement) => {
      const c = document.createElement('canvas')
      c.width = CW
      c.height = CH
      const ctx = c.getContext('2d')!
      drawFace(ctx, item, img)
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      if (!cancelled) setTex(t)
    }
    if (item.kind === 'work') {
      const im = new Image()
      im.crossOrigin = 'anonymous'
      im.onload = () => build(im)
      im.onerror = () => build()
      im.src = item.poster
    } else {
      build()
    }
    return () => {
      cancelled = true
    }
  }, [item])
  return tex
}

const tmp = new THREE.Vector3()

function GalleryCard({ item, index }: { item: Card; index: number }) {
  const focusedId = useStore((s) => s.focusedId)
  const setFocused = useStore((s) => s.setFocused)
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const tex = useCardFace(item)
  const accent = item.accent
  const dim = !!focusedId && focusedId !== item.id

  useFrame((state, dt) => {
    const g = ref.current
    if (!g) return
    const isFoc = focusedId === item.id
    const target = isFoc ? 1.55 : hovered ? 1.07 : 1
    const f = 1 - Math.exp(-8 * dt)
    g.scale.lerp(tmp.setScalar(target), f)
    g.position.y = Math.sin(state.clock.elapsedTime * 0.8 + index * 0.9) * 0.13
    g.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.02
  })

  return (
    <group>
      <Glow size={3.6} color={accent} opacity={dim ? 0.12 : 0.4} position={[0, 0, -0.06]} />
      <group ref={ref}>
        <RoundedBox args={[CARD_W + 0.14, CARD_H + 0.14, 0.12]} radius={0.06} smoothness={4}>
          <meshBasicMaterial color={accent} toneMapped={false} transparent opacity={dim ? 0.4 : 1} />
        </RoundedBox>
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial map={tex} toneMapped={false} transparent opacity={dim ? 0.45 : 1} />
        </mesh>
        <mesh
          position={[0, 0, 0.085]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            setFocused(item.id)
          }}
        >
          <planeGeometry args={[CARD_W + 0.16, CARD_H + 0.16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {focusedId === item.id && <DetailView item={item} />}
      </group>
    </group>
  )
}

function dampAngle(cur: number, target: number, lambda: number, dt: number) {
  let t = (target - cur) % (Math.PI * 2)
  if (t > Math.PI) t -= Math.PI * 2
  if (t < -Math.PI) t += Math.PI * 2
  return cur + t * (1 - Math.exp(-lambda * dt))
}

export default function Gallery({ items }: { items: Card[] }) {
  const group = useRef<THREE.Group>(null)
  const focusedId = useStore((s) => s.focusedId)
  const N = items.length
  const R = 6.8

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    if (focusedId) {
      const idx = items.findIndex((i) => i.id === focusedId)
      const ang = idx >= 0 ? (idx / N) * Math.PI * 2 : 0
      g.rotation.y = dampAngle(g.rotation.y, -ang, 4, dt)
    } else {
      g.rotation.y += dt * 0.1
    }
  })

  return (
    <group ref={group}>
      {items.map((it, i) => {
        const ang = (i / N) * Math.PI * 2
        return (
          <group key={it.id} position={[R * Math.sin(ang), 0, R * Math.cos(ang)]} rotation-y={ang}>
            <GalleryCard item={it} index={i} />
          </group>
        )
      })}
    </group>
  )
}
