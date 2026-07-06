import { useRef, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useStore, sigSvg, type Signature } from '../store'
import { DEFAULT_SLUG } from '../data'

const COLORS = ['#22e3ff', '#ff3df0', '#9dff3d', '#8b5cff', '#ffffff']

export default function SignatureWall() {
  const { slug = DEFAULT_SLUG } = useParams()
  const signatures = useStore((s) => s.signatures)
  const loadSignatures = useStore((s) => s.loadSignatures)
  const addSignature = useStore((s) => s.addSignature)
  const wallRef = useRef<HTMLDivElement>(null)
  const padRef = useRef<HTMLCanvasElement>(null)
  const [composer, setComposer] = useState<{ x: number; y: number } | null>(null)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const colorRef = useRef(color)
  const [hover, setHover] = useState<string | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    colorRef.current = color
  }, [color])

  useEffect(() => {
    loadSignatures(slug)
  }, [slug, loadSignatures])

  useEffect(() => {
    if (composer) {
      const c = padRef.current
      if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
      setName('')
      setComment('')
      setColor(COLORS[0])
    }
  }, [composer])

  function getPos(e: React.PointerEvent) {
    const c = padRef.current!
    const r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  function down(e: React.PointerEvent) {
    e.preventDefault()
    drawing.current = true
    const p = getPos(e)
    last.current = p
    const ctx = padRef.current!.getContext('2d')!
    ctx.fillStyle = colorRef.current
    ctx.shadowBlur = 8
    ctx.shadowColor = colorRef.current
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2)
    ctx.fill()
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const p = getPos(e)
    const ctx = padRef.current!.getContext('2d')!
    ctx.strokeStyle = colorRef.current
    ctx.shadowBlur = 8
    ctx.shadowColor = colorRef.current
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current!.x, last.current!.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }
  function up() {
    drawing.current = false
    last.current = null
  }

  async function submit() {
    if (!composer) return
    const c = padRef.current!
    const ctx = c.getContext('2d')!
    // 检测是否存在手写笔迹（非透明像素）
    const data = ctx.getImageData(0, 0, c.width, c.height).data
    let hasInk = false
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) {
        hasInk = true
        break
      }
    }
    const finalName = name.trim() || '匿名'
    // 只输入名字、未手写时，按 mock 数据样式生成签名
    const img = hasInk ? c.toDataURL('image/png') : sigSvg(finalName, color)
    await addSignature(slug, {
      x: composer.x,
      y: composer.y,
      rot: Math.random() * 16 - 8,
      img,
      name: finalName,
      comment: comment.trim(),
      color,
    })
    setComposer(null)
  }

  function onWallClick(e: React.MouseEvent) {
    if (composer) {
      setComposer(null)
      return
    }
    const r = wallRef.current!.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    setComposer({ x, y })
  }

  return (
    <div style={{ width: 'min(90vw, 820px)' }}>
      <div
        ref={wallRef}
        onClick={onWallClick}
        className="relative scroll-neon"
        style={{
          height: 'min(64vh, 460px)',
          border: '1px solid rgba(255,61,240,0.4)',
          borderRadius: 16,
          overflow: 'hidden',
          cursor: 'crosshair',
          background: 'radial-gradient(circle at 50% 0%, rgba(255,61,240,0.10), rgba(4,6,12,0.6))',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,227,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(34,227,255,0.06) 1px,transparent 1px)',
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
          <div className="text-center" style={{ color: 'rgba(207,239,255,0.32)' }}>
            <div className="font-display text-2xl tracking-widest">签名墙</div>
            <div className="text-[11px] mt-2 tracking-widest">点击任意位置 · 手写签名 · 留下评论</div>
          </div>
        </div>

        {signatures.map((s: Signature) => (
          <div
            key={s.id}
            className="absolute"
            style={{ left: s.x + '%', top: s.y + '%', transform: `translate(-50%,-50%) rotate(${s.rot}deg)` }}
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => {
              e.stopPropagation()
              setHover((h) => (h === s.id ? null : s.id))
            }}
          >
            <img
              src={s.img}
              alt={s.name}
              draggable={false}
              className="select-none"
              style={{
                width: 120,
                height: 'auto',
                cursor: 'pointer',
                filter: `drop-shadow(0 0 5px ${s.color}) drop-shadow(0 0 10px ${s.color})`,
              }}
            />
          </div>
        ))}

        {hover && (() => {
          const s = signatures.find((x) => x.id === hover)
          if (!s) return null
          // 靠上签名 -> tooltip 在下方，否则在上方，避免被墙顶裁剪
          const above = s.y > 35
          return (
            <div
              className="glass"
              style={{
                position: 'absolute',
                // 水平方向用 clamp 约束在墙内，杜绝左右边缘遮挡
                left: `clamp(0px, calc(${s.x}% - 105px), calc(100% - 210px))`,
                top: above ? `calc(${s.y}% - 60px)` : `calc(${s.y}% + 50px)`,
                transform: above ? 'translateY(-100%)' : 'translateY(0)',
                width: 210,
                padding: '8px 10px',
                borderRadius: 10,
                border: `1px solid ${s.color}88`,
                boxShadow: `0 0 18px ${s.color}55`,
                pointerEvents: 'none',
                zIndex: 30,
              }}
            >
              <div className="font-display text-xs" style={{ color: s.color }}>
                {s.name}
              </div>
              <div className="text-[11px] mt-1" style={{ color: '#dcefff' }}>
                {s.comment || '（未留下评论）'}
              </div>
            </div>
          )
        })()}

        {composer && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: 'rgba(4,6,12,0.62)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => {
              e.stopPropagation()
              setComposer(null)
            }}
          >
            <div
              className="glass scroll-neon"
              style={{
                width: 'min(88vw, 420px)',
                maxHeight: '100%',
                overflow: 'auto',
                padding: 18,
                borderRadius: 16,
                border: `1px solid ${color}`,
                boxShadow: `0 0 26px ${color}66`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-display text-sm tracking-widest" style={{ color }}>
                ✎ 留下你的签名
              </div>
              <canvas
                ref={padRef}
                width={360}
                height={150}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerLeave={up}
                className="mt-3 w-full rounded-lg"
                style={{
                  touchAction: 'none',
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px dashed ${color}66`,
                }}
              />
              <div className="mt-2 flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full transition"
                    style={{
                      background: c,
                      outline: c === color ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: c === color ? `0 0 10px ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的名字"
                className="mt-3 w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${color}44`, color: '#eafcff' }}
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="留下评论（鼠标悬浮签名时显示）"
                rows={2}
                className="mt-2 w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${color}44`, color: '#eafcff' }}
              />
              <div className="mt-3 flex justify-between">
                <button
                  onClick={() => {
                    padRef.current?.getContext('2d')?.clearRect(0, 0, 360, 150)
                  }}
                  className="rounded-full px-3 py-1.5 text-xs"
                  style={{ border: `1px solid ${color}44`, color }}
                >
                  清除笔迹
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setComposer(null)}
                    className="rounded-full px-3 py-1.5 text-xs"
                    style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#9fb3c8' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={submit}
                    className="rounded-full px-4 py-1.5 text-xs font-display tracking-widest"
                    style={{ background: color, color: '#04050b' }}
                  >
                    提交 ↵
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between text-[11px]" style={{ color: 'rgba(207,239,255,0.5)' }}>
        <span>● {signatures.length} 个签名</span>
        <span>悬浮 / 点击签名查看评论</span>
      </div>
    </div>
  )
}
