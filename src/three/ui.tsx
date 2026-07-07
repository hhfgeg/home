import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { type SpaceData, spaceDisplayName } from '../data'

/** A heads-up overlay that floats in 3D space just in front of the camera. */
export function HUD({ space, itemsCount, onClaimSpace }: { space: SpaceData; itemsCount: number; onClaimSpace?: () => void }) {
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
      {/* Main HUD — pointerEvents none */}
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
                {spaceDisplayName(space)}
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

          {/* center spacer — keeps top/bottom layout */}
          <div />

          {/* bottom legend — hidden while a card is focused */}
          {!focused && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                fontSize: 9,
                letterSpacing: 2,
                opacity: 0.35,
              }}
            >
              <span>拖拽 · 旋转</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>滚轮 · 缩放</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>点击 · 聚焦卡片</span>
            </div>
          )}
        </div>
      </Html>

      {/* "领取我的空间" button — separate Html with pointerEvents auto */}
      {onClaimSpace && !focused && (
        <Html center zIndexRange={[16, 0]} style={{ pointerEvents: 'auto' }}>
          <div style={{ width: '100vw', height: '100vh', pointerEvents: 'none', padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
            <button
              onClick={onClaimSpace}
              className="font-display"
              style={{
                pointerEvents: 'auto',
                marginTop: 48,
                padding: '7px 18px',
                borderRadius: 999,
                border: `1px solid ${primary}`,
                background: `linear-gradient(135deg, ${primary}15, ${primary}08)`,
                color: primary,
                fontSize: 11,
                letterSpacing: '0.15em',
                cursor: 'pointer',
                boxShadow: `0 0 16px ${primary}22`,
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.3s',
                opacity: 0.75,
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = `0 0 24px ${primary}44` }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.boxShadow = `0 0 16px ${primary}22` }}
            >
              ✨ 领取我的空间
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}
