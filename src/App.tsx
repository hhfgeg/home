import { useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Scene from './three/Scene'
import { loadSpace, DEFAULT_SLUG, resolveFocusItem, type SpaceData, spaceDisplayName } from './data'
import type { Card } from './data'
import { useStore } from './store'
import { apiUrl } from './api'
import LoginModal from './components/LoginModal'
import AdminPanel from './components/AdminPanel'
import SpaceClaimModal from './components/SpaceClaimModal'
import NotFound from './components/NotFound'

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
  const completeClaim = useStore((s) => s.completeClaim)
  const focusedId = useStore((s) => s.focusedId)
  const setFocused = useStore((s) => s.setFocused)

  // ---- URL `?focus=` 参数双向同步 ----
  const [searchParams, setSearchParams] = useSearchParams()
  // 抑制标志：当 effect ① 从 URL 同步聚焦时，告知 effect ② 跳过反向同步
  const suppressUrlSync = useRef(false)

  // ① URL / 空间变化时 → 同步聚焦状态（初始加载 + 浏览器前进/后退）
  useEffect(() => {
    if (!space) return
    const resolved = resolveFocusItem(space.items, searchParams.get('focus'))
    if (focusedId !== resolved) {
      // 标记为 URL 驱动的变更，防止 effect ② 反向覆盖 URL
      suppressUrlSync.current = true
      setFocused(resolved)
    }
  }, [space, slug, searchParams])

  // ② 用户交互改变聚焦 → 同步到 URL（replace 不产生浏览器历史）
  useEffect(() => {
    // 若本次 focusedId 变更是 effect ① 触发的，跳过反向同步
    if (suppressUrlSync.current) {
      suppressUrlSync.current = false
      return
    }
    if (!space) return
    const focusParam = searchParams.get('focus') || null
    if (focusedId !== focusParam) {
      const next = new URLSearchParams(searchParams)
      if (focusedId) {
        next.set('focus', focusedId)
      } else {
        next.delete('focus')
      }
      setSearchParams(next, { replace: true })
    }
  }, [focusedId])

  useEffect(() => {
    const builtin = loadSpace(slug)
    if (builtin) {
      setSpace(builtin)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(apiUrl(`/api/space/${slug}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: SpaceData & { items: Card[] }) => {
        if (!cancelled) { setSpace(data); setLoading(false) }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (space) document.title = `${spaceDisplayName(space)} · ${space.title}`
  }, [slug, space])

  const handleClaimed = (newSlug: string, claimed: { passwordSet: boolean; token: string | null }) => {
    setShowClaim(false)
    setClaimGuide(true)
    // 若创建时已设置密码，服务端返回 token，直接自动登录免二次输入
    completeClaim(newSlug, { token: claimed.token, passwordSet: claimed.passwordSet })
    navigate(`/${newSlug}`)
  }

  // 管理面板更新空间元数据后，重新拉取空间数据以刷新 HUD 等展示
  const reloadSpace = () => {
    const builtin = loadSpace(slug)
    if (builtin) { setSpace(builtin); return }
    fetch(apiUrl(`/api/space/${slug}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: SpaceData & { items: Card[] }) => setSpace(data))
      .catch(() => {})
  }

  // 空间加载完成前 accent 先使用默认色；404 状态下亦以此作为创建入口强调色
  const accent = space?.theme?.primary || '#22e3ff'

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#22e3ff', background: '#04050b', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: 2 }}>
        加载中…
      </div>
    )
  }

  if (!space) {
    return (
      <>
        <NotFound slug={slug} accent={accent} onClaim={() => setShowClaim(true)} />
        {showClaim && (
          <SpaceClaimModal
            initialSlug={slug}
            onClose={() => setShowClaim(false)}
            onClaimed={handleClaimed}
            accent={accent}
          />
        )}
      </>
    )
  }

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
          onSpaceUpdated={reloadSpace}
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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_SLUG}`} replace />} />
        <Route path="/:slug" element={<SpacePage />} />
      </Routes>
    </BrowserRouter>
  )
}
