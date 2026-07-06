import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import * as THREE from 'three'
import { Glow } from './effects'
import DetailView from './DetailView'
import { useStore, type Signature } from '../store'
import { CARD_W, CARD_H, galleryRadius, type Card } from '../data'

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

/** 按宽度换行绘制文本（支持中文/混合），超过 maxY 截断省略 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxY: number
) {
  let line = ''
  let curY = y
  for (const ch of text) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY)
      line = ch
      curY += lineHeight
      if (curY > maxY) {
        ctx.fillText('…', x, curY - lineHeight)
        return
      }
    } else {
      line = test
    }
  }
  if (line && curY <= maxY) ctx.fillText(line, x, curY)
}

/** 将关于卡片的介绍数据绘制到卡片面，供初始旋转态预览 */
function drawAboutFace(ctx: CanvasRenderingContext2D, item: Extract<Card, { kind: 'about' }>) {
  const accent = item.accent
  const g = ctx.createLinearGradient(0, 0, CW, CH)
  g.addColorStop(0, '#070a16')
  g.addColorStop(0.5, hexA(accent, 0.18))
  g.addColorStop(1, '#02030a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CW, CH)

  // 装饰大符号（淡）
  ctx.fillStyle = hexA(accent, 0.1)
  ctx.font = '360px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✦', CW / 2, CH * 0.42)

  // vignette
  const vg = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.3, CW / 2, CH / 2, CW * 0.62)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, CW, CH)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // 顶部 PROFILE 标签
  ctx.font = '600 22px "JetBrains Mono", monospace'
  ctx.fillStyle = accent
  ctx.shadowColor = accent
  ctx.shadowBlur = 10
  ctx.fillText('PROFILE', 44, 58)
  ctx.shadowBlur = 0

  // 右上 SPECIAL
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(220,239,255,0.7)'
  ctx.font = '500 22px "JetBrains Mono", monospace'
  ctx.fillText('SPECIAL', CW - 44, 58)
  ctx.textAlign = 'left'

  // name
  ctx.fillStyle = '#eafcff'
  ctx.font = '800 64px "Orbitron", system-ui, sans-serif'
  ctx.shadowColor = accent
  ctx.shadowBlur = 18
  ctx.fillText(item.name, 44, 150)
  ctx.shadowBlur = 0

  // role · location
  ctx.fillStyle = accent
  ctx.font = '500 28px "JetBrains Mono", monospace'
  ctx.fillText(`${item.role} · ${item.location}`, 44, 192)

  // stats
  const statY = 250
  const statW = (CW - 88) / Math.max(item.stats.length, 1)
  item.stats.forEach((s, i) => {
    const x = 44 + i * statW
    ctx.fillStyle = accent
    ctx.font = '800 40px "Orbitron", system-ui, sans-serif'
    ctx.shadowColor = accent
    ctx.shadowBlur = 10
    ctx.fillText(s.v, x, statY)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(220,239,255,0.6)'
    ctx.font = '500 18px "JetBrains Mono", monospace'
    ctx.fillText(s.k, x, statY + 26)
  })

  // bio 摘要
  ctx.fillStyle = '#dcefff'
  ctx.font = '400 22px "JetBrains Mono", monospace'
  wrapText(ctx, item.bio[0] || '', 44, 330, CW - 88, 30, CH - 130)

  // 底部渐变遮罩，保证标题可读
  const bg = ctx.createLinearGradient(0, CH * 0.68, 0, CH)
  bg.addColorStop(0, 'rgba(4,6,12,0)')
  bg.addColorStop(1, 'rgba(4,6,12,0.92)')
  ctx.fillStyle = bg
  ctx.fillRect(0, CH * 0.68, CW, CH * 0.32)

  // accent line
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
}

function makeSheenTexture() {
  const c = document.createElement('canvas')
  c.width = CW
  c.height = CH
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, CW, CH)
  g.addColorStop(0, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.22, 'rgba(255,255,255,0.16)')
  g.addColorStop(0.5, 'rgba(255,255,255,0)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CW, CH)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const SHEEN_TEX = makeSheenTexture()

function makeTexture(item: Card) {
  const c = document.createElement('canvas')
  c.width = CW
  c.height = CH
  const ctx = c.getContext('2d')!
  if (item.kind === 'about') drawAboutFace(ctx, item)
  else drawFace(ctx, item)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** 将签名墙已有签名绘制到 signature 卡片面，供初始旋转态预览 */
function drawSignatureFace(
  ctx: CanvasRenderingContext2D,
  item: Extract<Card, { kind: 'signature' }>,
  signatures: Signature[],
  imgs: (HTMLImageElement | null)[]
) {
  const accent = item.accent
  const g = ctx.createLinearGradient(0, 0, CW, CH)
  g.addColorStop(0, '#0a0612')
  g.addColorStop(0.5, hexA(accent, 0.16))
  g.addColorStop(1, '#02030a')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CW, CH)

  // 网格底纹
  ctx.strokeStyle = hexA(accent, 0.08)
  ctx.lineWidth = 1
  for (let x = 0; x <= CW; x += 56) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CH)
    ctx.stroke()
  }
  for (let y = 0; y <= CH; y += 56) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CW, y)
    ctx.stroke()
  }

  // 已有签名（按 x/y/rot 绘制，仅在上部 72% 区域预览，避开底部标题）
  const wallH = CH * 0.72
  signatures.forEach((s, i) => {
    const im = imgs[i]
    if (!im) return
    const px = (s.x / 100) * CW
    const py = (s.y / 100) * wallH
    const w = 150
    const h = w * (im.height / im.width)
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate((s.rot * Math.PI) / 180)
    ctx.shadowColor = s.color
    ctx.shadowBlur = 14
    ctx.drawImage(im, -w / 2, -h / 2, w, h)
    ctx.restore()
  })
  ctx.shadowBlur = 0

  // 底部渐变遮罩，保证标题可读
  const bg = ctx.createLinearGradient(0, CH * 0.55, 0, CH)
  bg.addColorStop(0, 'rgba(4,6,12,0)')
  bg.addColorStop(1, 'rgba(4,6,12,0.92)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CW, CH)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // 顶部标签
  ctx.font = '600 22px "JetBrains Mono", monospace'
  ctx.fillStyle = accent
  ctx.shadowColor = accent
  ctx.shadowBlur = 10
  ctx.fillText('INTERACTIVE', 44, 58)
  ctx.shadowBlur = 0

  // accent line
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

  // 右上角签名计数
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(220,239,255,0.7)'
  ctx.font = '500 22px "JetBrains Mono", monospace'
  ctx.fillText(`${signatures.length} SIGS`, CW - 44, 58)
  ctx.textAlign = 'left'
}

function useCardFace(item: Card, signatures: Signature[]) {
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
    } else if (item.kind === 'signature') {
      // 加载已有签名图片，将签名墙预览渲染到卡片面（初始旋转态即可见）
      const loads = signatures.map(
        (s) =>
          new Promise<HTMLImageElement | null>((res) => {
            if (!s.img) return res(null)
            const im = new Image()
            im.onload = () => res(im)
            im.onerror = () => res(null)
            im.src = s.img
          })
      )
      Promise.all(loads).then((imgs) => {
        if (cancelled) return
        const c = document.createElement('canvas')
        c.width = CW
        c.height = CH
        const ctx = c.getContext('2d')!
        drawSignatureFace(ctx, item, signatures, imgs)
        const t = new THREE.CanvasTexture(c)
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        if (!cancelled) setTex(t)
      })
    } else if (item.kind === 'about') {
      // 关于卡片：makeTexture 已绘制介绍数据，无需异步重建
    } else {
      build()
    }
    return () => {
      cancelled = true
    }
  }, [item, signatures])
  return tex
}

const tmp = new THREE.Vector3()

/** 卡片玻璃薄片几何体（圆角盒）与发光描边，模块级共享以保证边框与底板完全对齐 */
const CARD_GEOM = new RoundedBoxGeometry(CARD_W + 0.14, CARD_H + 0.14, 0.06, 5, 0.02)
const CARD_EDGES = new THREE.EdgesGeometry(CARD_GEOM, 25)

function GalleryCard({ item, index, slug }: { item: Card; index: number; slug: string }) {
  const focusedId = useStore((s) => s.focusedId)
  const setFocused = useStore((s) => s.setFocused)
  const signatures = useStore((s) => s.signatures)
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const tex = useCardFace(item, signatures)
  const accent = item.accent
  const dim = !!focusedId && focusedId !== item.id
  const glassOp = dim ? 0.16 : hovered ? 0.34 : 0.26
  const edgeOp = dim ? 0.4 : hovered ? 1 : 0.85
  const posterOp = dim ? 0.5 : hovered ? 0.97 : 0.9
  const sheenOp = dim ? 0.04 : hovered ? 0.3 : 0.16

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
      <Glow size={5.4} color={accent} opacity={dim ? 0.12 : 0.4} position={[0, 0, -0.06]} />
      <group ref={ref}>
        {/* 玻璃薄片底板 */}
        <mesh geometry={CARD_GEOM}>
          <meshPhysicalMaterial
            color={accent}
            transparent
            opacity={glassOp}
            roughness={0.1}
            metalness={0.35}
            clearcoat={1}
            clearcoatRoughness={0.18}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        {/* 发光描边：与底板共享同一几何体，杜绝错位 */}
        <lineSegments geometry={CARD_EDGES}>
          <lineBasicMaterial color={accent} transparent opacity={edgeOp} toneMapped={false} />
        </lineSegments>

        {/* 海报贴图面 */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial map={tex} toneMapped={false} transparent opacity={posterOp} />
        </mesh>

        {/* 玻璃对角光泽 */}
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshBasicMaterial
            map={SHEEN_TEX}
            transparent
            opacity={sheenOp}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* 交互面 */}
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
        {focusedId === item.id && <DetailView item={item} slug={slug} />}
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

export default function Gallery({ items, slug }: { items: Card[]; slug: string }) {
  const group = useRef<THREE.Group>(null)
  const focusedId = useStore((s) => s.focusedId)
  const N = items.length
  const R = galleryRadius(N)

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
            <GalleryCard item={it} index={i} slug={slug} />
          </group>
        )
      })}
    </group>
  )
}
