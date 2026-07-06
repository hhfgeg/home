import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
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

export default function Scene({ space, items }: { space: SpaceData; items: Card[] }) {
  const focused = useStore((s) => s.focusedId)
  const setFocused = useStore((s) => s.setFocused)
  const loadSignatures = useStore((s) => s.loadSignatures)
  const controls = useRef<any>(null)
  const R = galleryRadius(items.length)

  // 进入空间即加载签名墙数据，使 signature 卡片在初始旋转态就能渲染已有签名
  useEffect(() => {
    loadSignatures(space.slug)
  }, [space.slug, loadSignatures])

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.8, R + 9.2], fov: 42 }}
      gl={{ antialias: true }}
      onPointerMissed={() => {
        // 签名墙为沉浸式交互区域，点击空白不自动退出，仅靠返回按钮关闭，
        // 避免点击靠边区域误触退出
        if (focused) {
          const card = items.find((i) => i.id === focused)
          if (card && card.kind === 'signature') return
        }
        setFocused(null)
      }}
    >
      <color attach="background" args={['#04050b']} />
      <fog attach="fog" args={['#04050b', R + 5, R + 42]} />
      <Suspense fallback={null}>
        <Effects />
        <Gallery items={items} />
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
      <HUD space={space} itemsCount={items.length} />
    </Canvas>
  )
}
