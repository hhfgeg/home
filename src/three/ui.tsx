import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { type SpaceData } from '../data'

/** A heads-up overlay that floats in 3D space just in front of the camera. */
export function HUD({ space, itemsCount }: { space: SpaceData; itemsCount: number }) {
  const ref = useRef<THREE.Group>(null)
  const fwd = useRef(new THREE.Vector3())
  const { camera } = useThree()
  const focused = useStore((s) => s.focusedId)
  const primary = space.theme.primary
  const countStr = String(itemsCount).padStart(2, '0')

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.copy(camera.position)
    fwd.current.set(0, 0, -1).applyQuaternion(camera.quaternion)
    ref.current.position.add(fwd.current.multiplyScalar(2))
  })

  return (
    <group ref={ref}>
      <Html center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 20px',
            color: '#cfefff',
          }}
        >
          {/* top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="font-display" style={{ lineHeight: 1.1 }}>
              <div
                className="neon-text"
                style={{ fontSize: 26, fontWeight: 900, letterSpacing: 4, color: primary }}
              >
                {space.brand}
              </div>
              <div style={{ fontSize: 10, letterSpacing: 6, opacity: 0.6, marginTop: 2 }}>
                {space.subtitle}
              </div>
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 10,
                letterSpacing: 3,
                opacity: 0.5,
                textAlign: 'right',
                borderLeft: `1px solid ${primary}4D`,
                paddingLeft: 12,
              }}
            >
              <div>{space.studio}</div>
              <div style={{ color: '#9dff3d', marginTop: 2 }}>● 作品 {countStr}</div>
            </div>
          </div>

          {/* center hint — hidden while a card is focused to avoid overlapping the panel */}
          {!focused && (
            <div style={{ textAlign: 'center' }}>
              <div
                className="animate-pulseGlow"
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  letterSpacing: 4,
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: `1px solid ${primary}59`,
                  background: 'rgba(8,12,26,0.5)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                拖拽旋转 · 滚轮缩放 · 点击卡片聚焦
              </div>
            </div>
          )}

          {/* bottom legend */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 18,
              fontSize: 9,
              letterSpacing: 3,
              opacity: 0.45,
            }}
          >
            <span>DRAG · 旋转</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>SCROLL · 缩放</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>CLICK · 聚焦</span>
          </div>
        </div>
      </Html>
    </group>
  )
}
