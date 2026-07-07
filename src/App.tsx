import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, Link, useNavigate } from 'react-router-dom'
import Scene from './three/Scene'
import { loadSpace, DEFAULT_SLUG, type SpaceData } from './data'
import type { Card } from './data'
import { useStore } from './store'
import LoginModal from './components/LoginModal'
import AdminPanel from './components/AdminPanel'
import SpaceClaimModal from './components/SpaceClaimModal'

function NotFound({ slug }: { slug: string }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        color: '#cfefff',
        background: '#04050b',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div
        className="font-display"
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: '#ff3df0',
          textShadow: '0 0 18px #ff3df0, 0 0 40px #ff3df044',
        }}
      >
        404
      </div>
      <div style={{ fontSize: 13, letterSpacing: 2, opacity: 0.7 }}>
        未知的空间标识：<span style={{ color: '#22e3ff' }}>/{slug}</span>
      </div>
      <Link
        to={`/${DEFAULT_SLUG}`}
        className="font-display"
        style={{
          marginTop: 8,
          padding: '8px 18px',
          borderRadius: 999,
          border: '1px solid #22e3ff',
          color: '#22e3ff',
          fontSize: 12,
          letterSpacing: 3,
          textDecoration: 'none',
          boxShadow: '0 0 16px #22e3ff33',
        }}
      >
        ← 返回默认空间
      </Link>
    </div>
  )
}

function SpacePage() {
  const { slug = DEFAULT_SLUG } = useParams()
  const navigate = useNavigate()
  const [space, setSpace] = useState<SpaceData | null>(() => loadSpace(slug))
  const [loading, setLoading] = useState(!space)
  const [showClaim, setShowClaim] = useState(false)

  const showLoginModal = useStore((s) => s.showLoginModal)
  const closeLoginModal = useStore((s) => s.closeLoginModal)
  const isConfigured = useStore((s) => s.isConfigured)
  const showAdminPanel = useStore((s) => s.showAdminPanel)
  const closeAdminPanel = useStore((s) => s.closeAdminPanel)
  const adminSlug = useStore((s) => s.adminSlug)
  const setClaimGuide = useStore((s) => s.setClaimGuide)

  useEffect(() => {
    const builtin = loadSpace(slug)
    if (builtin) {
      setSpace(builtin)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/space/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: SpaceData & { items: Card[] }) => {
        if (!cancelled) { setSpace(data); setLoading(false) }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (space) document.title = space.title
  }, [slug, space])

  const handleClaimed = (newSlug: string) => {
    setShowClaim(false)
    setClaimGuide(true)
    navigate(`/${newSlug}`)
  }

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#22e3ff', background: '#04050b', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: 2 }}>
        加载中…
      </div>
    )
  }

  if (!space) return <NotFound slug={slug} />

  const accent = space.theme?.primary || '#22e3ff'

  return (
    <>
      <Scene space={space} items={space.items} onClaimSpace={() => setShowClaim(true)} />

      {/* 模态窗在 Canvas 外部渲染 */}
      {showLoginModal && (
        <LoginModal
          onClose={closeLoginModal}
          isSetup={!isConfigured}
          slug={adminSlug || slug}
          accent={accent}
        />
      )}
      {showAdminPanel && (
        <AdminPanel
          slug={adminSlug}
          accent={accent}
          onClose={closeAdminPanel}
        />
      )}
      {showClaim && (
        <SpaceClaimModal
          onClose={() => setShowClaim(false)}
          onClaimed={handleClaimed}
          accent={accent}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_SLUG}`} replace />} />
        <Route path="/:slug" element={<SpacePage />} />
      </Routes>
    </BrowserRouter>
  )
}
