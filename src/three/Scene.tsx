import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Effects } from './effects'
import Gallery from './Gallery'
import { HUD } from './ui'
import { useStore } from '../store'
import { type SpaceData, type Card } from '../data'

function CameraRig({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const focused = useStore((s) => s.focusedId)
  const target = useRef(new THREE.Vector3(0, 0.6, 12.6))
  const look = useRef(new THREE.Vector3(0, 0, 6.8))
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
  const controls = useRef<any>(null)

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.8, 16], fov: 42 }}
      gl={{ antialias: true }}
      onPointerMissed={() => setFocused(null)}
    >
      <color attach="background" args={['#04050b']} />
      <fog attach="fog" args={['#04050b', 12, 48]} />
      <Suspense fallback={null}>
        <Effects />
        <Gallery items={items} />
      </Suspense>
      <CameraRig controlsRef={controls} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableDamping={!focused}
        enableRotate={!focused}
        enableZoom={!focused}
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={26}
        minPolarAngle={0.6}
        maxPolarAngle={1.5}
        makeDefault
      />
      <HUD space={space} itemsCount={items.length} />
    </Canvas>
  )
}
