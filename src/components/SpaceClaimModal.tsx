import { useState, useRef, useEffect } from 'react'
import { normalizeSlug, validateSlug } from '../slug'

interface SpaceClaimModalProps {
  onClose: () => void
  onClaimed: (slug: string, claimed: { passwordSet: boolean; token: string | null }) => void
  accent?: string
  /** 预填的空间标识（例如从 404 页面带入的缺失 slug） */
  initialSlug?: string
}

export default function SpaceClaimModal({ onClose, onClaimed, accent = '#22e3ff', initialSlug }: SpaceClaimModalProps) {
  // 优先使用规范化后的预填值，保证带入的 slug 一定合法可编辑
  const [slug, setSlug] = useState(() => normalizeSlug(initialSlug || ''))
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // 若有预填值，直接全选方便修改
    if (initialSlug) inputRef.current?.select()
  }, [initialSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = slug.trim().toLowerCase()
    const err = validateSlug(id)
    if (err) { setError(err); return }
    // 密码为选填，但填写后需满足最小长度
    if (password && password.length < 4) {
      setError('密码至少需要 4 个字符')
      passwordRef.current?.focus()
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/space/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: id, name: name.trim() || undefined, password: password || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '创建失败')
      }
      const data = await res.json()
      onClaimed(id, { passwordSet: !!password, token: data?.token ?? null })
    } catch (err: any) {
      setError(err.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1px solid ${accent}55`, background: 'rgba(0,0,0,0.3)',
    color: '#eafcff', fontSize: 20, outline: 'none', textAlign: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.1em', fontWeight: 600,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4, 6, 18, 0.85)', backdropFilter: 'blur(12px)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: 'min(90vw, 440px)', borderRadius: 20,
          border: `1px solid ${accent}66`,
          background: 'rgba(8, 12, 28, 0.92)',
          boxShadow: `0 0 40px ${accent}33, 0 0 80px ${accent}15`,
          padding: 32,
          animation: 'claimModalIn 0.3s ease-out',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="font-display" style={{ fontSize: 11, letterSpacing: '0.35em', color: accent, marginBottom: 8 }}>
            CLAIM YOUR SPACE
          </div>
          <div
            className="font-display"
            style={{
              fontSize: 22, fontWeight: 800, color: '#eafcff',
              textShadow: `0 0 12px ${accent}, 0 0 28px ${accent}44`,
            }}
          >
            ✨ 领取我的空间
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#9fb3c8', lineHeight: 1.6, letterSpacing: '0.05em' }}>
            {initialSlug
              ? <>该空间尚不存在，确认后将为你创建<br />支持作品展示、关于我、签名墙的完整空间</>
              : <>输入你的专属空间标识，即可获得一个<br />支持作品展示、关于我、签名墙的完整空间</>}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: '#556678' }}>
            （例如：my-works、design-2026）
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: accent, fontSize: 20, fontWeight: 300, opacity: 0.6,
              fontFamily: 'monospace',
            }}>/</div>
            <input
              ref={inputRef}
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="your-space-id"
              style={{ ...iStyle, paddingLeft: 40 }}
              autoComplete="off"
              maxLength={32}
            />
          </div>

          {/* 中文名（选填，留空则使用空间标识） */}
          <div>
            <div style={{ fontSize: 10, color: '#7d93b0', letterSpacing: '0.15em', marginBottom: 6, paddingLeft: 4 }}>
              空间名称（选填）· 支持中文，留空则使用标识
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as any) }}
              placeholder={slug || '我的创意空间'}
              style={{ ...iStyle, fontSize: 16, letterSpacing: '0.02em', textAlign: 'left', paddingLeft: 16, opacity: 0.95 }}
              autoComplete="off"
              maxLength={32}
            />
          </div>

          {/* 密码（选填，支持显示/隐藏切换） */}
          <div>
            <div style={{ fontSize: 10, color: '#7d93b0', letterSpacing: '0.15em', marginBottom: 6, paddingLeft: 4 }}>
              空间密码（选填）· 设置后需登录才能管理
            </div>
            <div style={{ position: 'relative' }}>
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as any) }}
                placeholder="设置管理密码"
                style={{ ...iStyle, fontSize: 16, letterSpacing: '0.05em', paddingRight: 48 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                title={showPassword ? '隐藏密码' : '显示密码'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                  color: showPassword ? accent : '#7d93b0', fontSize: 16, lineHeight: 1,
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontSize: 12, color: '#ff4477', textAlign: 'center',
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255,68,119,0.1)', border: '1px solid #ff447744',
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              取消
            </button>
            <button type="submit" disabled={loading} style={submitBtnStyle(accent, loading)}>
              {loading ? '创建中…' : '🚀 立即领取'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 9, color: '#556678', letterSpacing: '0.1em' }}>
          密码独立加盐存储（PBKDF2）· 即领即用
        </div>
      </div>

      <style>{`
        @keyframes claimModalIn {
          from { opacity: 0; transform: scale(0.9) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
  color: '#8fa4c0', fontSize: 12, letterSpacing: '0.15em', cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
}

const submitBtnStyle = (accent: string, loading: boolean): React.CSSProperties => ({
  flex: 2.5, padding: '10px 0', borderRadius: 10,
  border: `1px solid ${accent}`,
  background: `linear-gradient(135deg, ${accent}33, ${accent}11)`,
  color: accent, fontSize: 13, fontWeight: 700, letterSpacing: '0.2em',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
  boxShadow: `0 0 20px ${accent}33`,
  opacity: loading ? 0.6 : 1,
})
