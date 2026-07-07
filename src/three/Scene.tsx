import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Effects } from './effects'
import Gallery from './Gallery'
import { HUD } from './ui'
import { useStore } from '../store'
import { galleryRadius, type SpaceData, type Card } from '../data'

function CameraRig({
  controlsRef,
  count,
}: {
  controlsRef: React.MutableRefObject<any>
  count: number
}) {
  const focused = useStore((s) => s.focusedId)
  const R = galleryRadius(count)
  const target = useRef(new THREE.Vector3(0, 0.6, R + 5.8))
  const look = useRef(new THREE.Vector3(0, 0, R))
  useFrame((state, dt) => {
    if (focused) {
      if (controlsRef.current) controlsRef.current.enabled = false
      state.camera.position.lerp(target.current, 1 - Math.exp(-4 * dt))
      state.camera.lookAt(look.current)
    } else if (controlsRef.current && controlsRef.current.enabled === false) {
      controlsRef.current.enabled = true
    }
  })
  return null
}

export default function Scene({ space, items, onClaimSpace }: { space: SpaceData; items: Card[]; onClaimSpace?: () => void }) {
  const focused = useStore((s) => s.focusedId)
  const setFocused = useStore((s) => s.setFocused)
  const loadSignatures = useStore((s) => s.loadSignatures)
  const modalOpen = useStore((s) => s.modalOpen)
  const showClaimGuide = useStore((s) => s.showClaimGuide)
  const setClaimGuide = useStore((s) => s.setClaimGuide)
  const controls = useRef<any>(null)
  const R = galleryRadius(items.length)
  const [guideVisible, setGuideVisible] = useState(!!showClaimGuide)

  useEffect(() => {
    if (showClaimGuide) {
      setGuideVisible(true)
      const t = setTimeout(() => { setGuideVisible(false); setClaimGuide(false) }, 12000)
      return () => clearTimeout(t)
    }
  }, [showClaimGuide, setClaimGuide])

  useEffect(() => {
    loadSignatures(space.slug)
  }, [space.slug, loadSignatures])

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.8, R + 9.2], fov: 42 }}
      gl={{ antialias: true }}
      onPointerMissed={() => {
        if (modalOpen) return
        if (focused) {
          const card = items.find((i) => i.id === focused)
          if (card && card.kind === 'signature') return
        }
        setFocused(null)
        // 点击任意处关闭引导
        if (guideVisible) { setGuideVisible(false); setClaimGuide(false) }
      }}
    >
      <color attach="background" args={['#04050b']} />
      <fog attach="fog" args={['#04050b', R + 5, R + 42]} />
      <Suspense fallback={null}>
        <Effects />
        <Gallery items={items} slug={space.slug} />
      </Suspense>
      <CameraRig controlsRef={controls} count={items.length} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping={!focused}
        enableRotate={!focused}
        enableZoom={!focused}
        dampingFactor={0.08}
        minDistance={R + 1}
        maxDistance={R + 20}
        minPolarAngle={0.6}
        maxPolarAngle={1.5}
        makeDefault
      />

      {/* 注册引导提示 — 指向"关于"卡片 */}
      {guideVisible && (
        <Html center zIndexRange={[50, 0]} style={{ pointerEvents: 'none', transform: 'translateY(-40%)' }}>
          <div className="font-display animate-pulseGlow" style={{
            background: 'rgba(8,12,26,0.8)', backdropFilter: 'blur(8px)',
            border: `1px solid ${space.theme.primary}66`,
            borderRadius: 14, padding: '16px 28px', textAlign: 'center',
            boxShadow: `0 0 30px ${space.theme.primary}33`,
            minWidth: 280, whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: 14, color: '#eafcff', letterSpacing: '0.1em', marginBottom: 8 }}>
              🎉 空间已领取！
            </div>
            <div style={{ fontSize: 12, color: '#9fb3c8', letterSpacing: '0.05em', lineHeight: 1.7 }}>
              点击「<span style={{ color: space.theme.primary }}>About // 关于</span>」卡片<br />
              设置密码登录管理你的空间
            </div>
          </div>
        </Html>
      )}

      <HUD space={space} itemsCount={items.length} onClaimSpace={onClaimSpace} />
    </Canvas>
  )
}
