import { useState, useRef, useEffect } from 'react'

interface SpaceClaimModalProps {
  onClose: () => void
  onClaimed: (slug: string) => void
  accent?: string
}

export default function SpaceClaimModal({ onClose, onClaimed, accent = '#22e3ff' }: SpaceClaimModalProps) {
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = slug.trim().toLowerCase()
    if (!id) { setError('请输入空间标识'); return }
    if (!/^[a-z0-9-]{2,32}$/.test(id)) {
      setError('仅支持小写字母、数字和连字符，2-32个字符')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/space/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '创建失败')
      }
      onClaimed(id)
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
            输入你的专属空间标识，即可获得一个<br />
            支持作品展示、关于我、签名墙的完整空间
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
          数据与密码独立存储 · 即领即用
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
