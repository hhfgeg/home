import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, Link } from 'react-router-dom'
import Scene from './three/Scene'
import { loadSpace, DEFAULT_SLUG } from './data'

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
  const space = loadSpace(slug)

  useEffect(() => {
    if (space) document.title = space.title
  }, [slug, space])

  if (!space) return <NotFound slug={slug} />

  return <Scene space={space} items={space.items} />
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
