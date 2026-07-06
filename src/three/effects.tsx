import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Grid, Sparkles, Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function makeGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.12)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function Glow({
  size = 4,
  color = '#22e3ff',
  opacity = 0.5,
  position = [0, 0, 0],
  dim = false,
}: {
  size?: number
  color?: string
  opacity?: number
  position?: [number, number, number]
  dim?: boolean
}) {
  const tex = useMemo(makeGlowTexture, [])
  return (
    <mesh position={position} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={dim ? opacity * 0.3 : opacity}
        color={color}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

function Core() {
  const wire = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (wire.current) {
      wire.current.rotation.y += dt * 0.25
      wire.current.rotation.x += dt * 0.1
    }
  })
  return (
    <group position={[0, 0, 0]}>
      <Glow size={7} color="#22e3ff" opacity={0.5} />
      <Glow size={4} color="#ff3df0" opacity={0.35} />
      <Float speed={1.6} rotationIntensity={0.7} floatIntensity={0.9}>
        <mesh>
          <icosahedronGeometry args={[0.92, 1]} />
          <MeshDistortMaterial
            color="#0a0e1a"
            emissive="#22e3ff"
            emissiveIntensity={1.15}
            distort={0.38}
            speed={2.1}
            roughness={0.18}
            metalness={0.65}
            toneMapped={false}
          />
        </mesh>
      </Float>
      <mesh ref={wire} scale={1.32}>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshBasicMaterial
          color="#8b5cff"
          wireframe
          transparent
          opacity={0.28}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} color="#22e3ff" intensity={3.2} distance={22} decay={2} />
    </group>
  )
}

export function Effects() {
  return (
    <group>
      <ambientLight intensity={0.35} />
      <pointLight position={[8, 6, 10]} color="#22e3ff" intensity={1.4} distance={40} decay={2} />
      <pointLight position={[-9, -2, 6]} color="#ff3df0" intensity={1.1} distance={40} decay={2} />
      <directionalLight position={[0, 8, 4]} intensity={0.25} color="#cfeeff" />

      <Stars radius={70} depth={45} count={2400} factor={3} saturation={0} fade speed={0.4} />

      <Grid
        position={[0, -3.2, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.9}
        cellColor="#0f2f38"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#1ec8ff"
        fadeDistance={40}
        fadeStrength={1.6}
        infiniteGrid
      />

      <Sparkles
        count={70}
        scale={[26, 9, 26]}
        position={[0, 1, 0]}
        size={4}
        speed={0.3}
        color="#5fe9ff"
        opacity={0.6}
      />

      <Core />
    </group>
  )
}
