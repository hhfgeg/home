import { useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useStore } from '../store'
import { type Card, type Downloads } from '../data'
import { assetUrl } from '../api'
import SignatureWall from './SignatureWall'

function BackBtn() {
  const setFocused = useStore((s) => s.setFocused)
  return (
    <button
      onClick={() => setFocused(null)}
      className="font-display rounded-full px-3 py-1.5 text-[11px] tracking-widest transition hover:brightness-125"
      style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#cfefff' }}
    >
      ← 返回展厅
    </button>
  )
}

function Panel({
  item,
  children,
  tall = false,
}: {
  item: Card
  children: React.ReactNode
  tall?: boolean
}) {
  return (
    <Html position={[0, 0, 0.45]} center zIndexRange={[40, 0]} style={{ pointerEvents: 'auto' }}>
      <div
        className="glass scroll-neon"
        style={{
          width: 'min(92vw, 860px)',
          maxHeight: tall ? 'none' : '82vh',
          overflow: 'auto',
          border: `1px solid ${item.accent}`,
          borderRadius: 18,
          boxShadow: `0 0 30px ${item.accent}55, 0 0 60px ${item.accent}22`,
          padding: 22,
        }}
      >
        {children}
      </div>
    </Html>
  )
}

function Section({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="font-display text-[10px] tracking-[0.35em]" style={{ color: accent }}>
        {label}
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#dcefff' }}>
        {children}
      </p>
    </div>
  )
}

/** 平台图标 SVG */
const PlatformIcons = {
  mac: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18c-2.5 0-5-1.3-6-3.5.8.5 1.7.8 2.7.8 1.3 0 2.5-.6 3.3-1.5A4 4 0 0 1 5 10a4 4 0 0 0 5.5 3.5A4 4 0 0 1 17 8a4 4 0 0 0-3 1.5 4 4 0 0 1-1-2.5c0-1 .4-2 1-2.7C12.5 5.5 10.5 6 9 7c0 0-1.5-1-3.5-1C3.5 6 2 8 2 10.5 2 16 8.5 20 12 20c1 0 3-.6 4.5-1.5a5.5 5.5 0 0 0-7.5-.5Z" />
    </svg>
  ),
  windows: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h7.5V4L3 5.5V12Zm0 0v6.5L10.5 20V12H3Zm10.5 0H21v7.5l-7.5-1V12Zm0-8v7.5H21V4l-7.5 0Z" />
    </svg>
  ),
}

/** 判断 downloads 是否有任何链接 */
function hasDownloads(d?: Downloads): boolean {
  if (!d) return false
  return !!(d.macIntel || d.macApple || d.windows)
}

function DownloadsSection({ downloads, accent }: { downloads: Downloads; accent: string }) {
  const links: { label: string; url: string; icon: 'mac' | 'windows' }[] = []

  if (downloads.macApple) {
    links.push({ label: 'macOS (Apple Silicon)', url: downloads.macApple, icon: 'mac' })
  }
  if (downloads.macIntel) {
    links.push({ label: 'macOS (Intel)', url: downloads.macIntel, icon: 'mac' })
  }
  if (downloads.windows) {
    links.push({ label: 'Windows', url: downloads.windows, icon: 'windows' })
  }

  if (links.length === 0) return null

  return (
    <div className="mt-5">
      <div className="font-display text-[10px] tracking-[0.35em] mb-3" style={{ color: accent }}>
        下载 / DOWNLOAD
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-[11px] tracking-wider transition hover:brightness-125"
            style={{
              border: `1px solid ${accent}`,
              color: accent,
              boxShadow: `0 0 14px ${accent}33`,
              background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
            }}
          >
            {PlatformIcons[l.icon]}
            {l.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function WorkDetail({ item }: { item: Extract<Card, { kind: 'work' }> }) {
  return (
    <Panel item={item}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-[10px] tracking-[0.35em]" style={{ color: item.accent }}>
          {item.year} · PROJECT
        </div>
        <BackBtn />
      </div>
      <h2
        className="font-display"
        style={{ fontSize: 34, fontWeight: 800, color: '#eafcff', textShadow: `0 0 8px ${item.accent}, 0 0 22px ${item.accent}` }}
      >
        {item.title}
      </h2>
      <div className="text-sm" style={{ color: item.accent }}>
        {item.subtitle}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-2.5 py-1 text-[11px]"
            style={{ border: `1px solid ${item.accent}66`, color: item.accent }}
          >
            {t}
          </span>
        ))}
      </div>

      {item.video && (
        <video
          src={item.video}
          poster={assetUrl(item.poster)}
          controls
          autoPlay
          loop
          muted
          playsInline
          className="mt-4 aspect-video w-full rounded-xl"
          style={{ border: `1px solid ${item.accent}55` }}
        />
      )}

      <Section label="简介 / OVERVIEW" accent={item.accent}>
        {item.intro}
      </Section>
      <Section label="创作理念 / CONCEPT" accent={item.accent}>
        {item.concept}
      </Section>

      {item.downloads && hasDownloads(item.downloads) && (
        <DownloadsSection downloads={item.downloads} accent={item.accent} />
      )}

      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block rounded-full px-5 py-2 font-display text-xs tracking-widest transition hover:brightness-125"
        style={{ border: `1px solid ${item.accent}`, color: item.accent, boxShadow: `0 0 16px ${item.accent}33` }}
      >
        访问项目 ↗
      </a>
    </Panel>
  )
}

function AboutDetail({ item, slug }: { item: Extract<Card, { kind: 'about' }>; slug: string }) {
  const isLoggedIn = useStore((s) => s.isLoggedIn)
  const isConfigured = useStore((s) => s.isConfigured)
  const checkAuthStatus = useStore((s) => s.checkAuthStatus)
  const openLoginModal = useStore((s) => s.openLoginModal)
  const openAdminPanel = useStore((s) => s.openAdminPanel)

  // 仅在 mount 时检查一次认证状态
  useEffect(() => {
    checkAuthStatus(slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Panel item={item}>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-[10px] tracking-[0.35em]" style={{ color: item.accent }}>
            PROFILE · 关于我
          </div>
          <BackBtn />
        </div>
        <h2
          className="font-display"
          style={{ fontSize: 36, fontWeight: 800, color: '#eafcff', textShadow: `0 0 8px ${item.accent}, 0 0 22px ${item.accent}` }}
        >
          {item.name}
        </h2>
        <div className="text-sm" style={{ color: item.accent }}>
          {item.role} · {item.location}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {item.stats.map((s) => (
            <div key={s.k} className="rounded-lg p-2 text-center" style={{ border: `1px solid ${item.accent}33`, background: 'rgba(0,0,0,0.25)' }}>
              <div className="font-display text-lg" style={{ color: item.accent }}>
                {s.v}
              </div>
              <div className="text-[10px] tracking-widest" style={{ color: '#9fb3c8' }}>
                {s.k}
              </div>
            </div>
          ))}
        </div>

        {item.bio.map((p, i) => (
          <p key={i} className="mt-3 text-[13px] leading-relaxed" style={{ color: '#dcefff' }}>
            {p}
          </p>
        ))}

        {/* 管理按钮 */}
        <div className="mt-4">
          <div className="font-display text-[10px] tracking-[0.35em]" style={{ color: item.accent }}>
            管理 / ADMIN
          </div>
          <div className="mt-2 flex gap-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); openAdminPanel(slug) }}
                  className="font-display rounded-full px-4 py-2 text-[11px] tracking-widest transition hover:brightness-125"
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    border: `1px solid ${item.accent}`,
                    color: item.accent,
                    boxShadow: `0 0 12px ${item.accent}33`,
                  }}
                >
                  ⚙ 管理面板
                </button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); openLoginModal(slug) }}
                onPointerDown={(e) => e.stopPropagation()}
                className="font-display rounded-full px-4 py-2 text-[11px] tracking-widest transition hover:brightness-125"
                style={{
                  border: `1px solid ${item.accent}`,
                  color: item.accent,
                  boxShadow: `0 0 12px ${item.accent}33`,
                }}
              >
                {isConfigured === null ? '…' : isConfigured ? '🔐 管理员登录' : '🔧 首次设置密码'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="font-display text-[10px] tracking-[0.35em]" style={{ color: item.accent }}>
            联系方式 / CONTACT
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {item.contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:brightness-125"
                style={{ border: `1px solid ${item.accent}44`, background: 'rgba(0,0,0,0.25)' }}
              >
                <span className="text-[11px] tracking-widest" style={{ color: item.accent }}>
                  {c.label}
                </span>
                <span className="text-[12px]" style={{ color: '#dcefff' }}>
                  {c.value}
                </span>
              </a>
            ))}
          </div>
        </div>
      </Panel>
    </>
  )
}

function SignatureWallPanel({ item }: { item: Extract<Card, { kind: 'signature' }> }) {
  return (
    <Html position={[0, 0, 0.45]} center zIndexRange={[40, 0]} style={{ pointerEvents: 'auto' }}>
      <div
        className="glass"
        style={{
          padding: 18,
          borderRadius: 18,
          border: `1px solid ${item.accent}`,
          boxShadow: `0 0 30px ${item.accent}55, 0 0 60px ${item.accent}22`,
        }}
      >
        <div className="mb-3 flex items-center justify-between" style={{ width: 'min(90vw,820px)' }}>
          <div>
            <div className="font-display text-[10px] tracking-[0.35em]" style={{ color: item.accent }}>
              INTERACTIVE · 签名墙
            </div>
            <div className="font-display text-xl" style={{ color: '#eafcff' }}>
              {item.title}
            </div>
          </div>
          <BackBtn />
        </div>
        <SignatureWall />
      </div>
    </Html>
  )
}

export default function DetailView({ item, slug }: { item: Card; slug: string }) {
  if (item.kind === 'work') return <WorkDetail item={item} />
  if (item.kind === 'about') return <AboutDetail item={item} slug={slug} />
  return <SignatureWallPanel item={item} />
}
