import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'

interface LoginModalProps {
  onClose: () => void
  isSetup: boolean
  slug: string // 空间标识 = 用户名
  accent?: string
}

export default function LoginModal({ onClose, isSetup, slug, accent = '#22e3ff' }: LoginModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useStore((s) => s.login)
  const setupPassword = useStore((s) => s.setupPassword)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isSetup) {
      if (!password || password.length < 4) {
        setError('密码至少需要 4 个字符')
        return
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致')
        return
      }
      setLoading(true)
      try {
        await setupPassword(slug, password)
        onClose()
      } catch (err: any) {
        setError(err.message || '设置失败，请重试')
      } finally {
        setLoading(false)
      }
    } else {
      if (!password) {
        setError('请输入密码')
        return
      }
      setLoading(true)
      try {
        await login(slug, password)
        onClose()
      } catch (err: any) {
        setError(err.message || '登录失败，请重试')
      } finally {
        setLoading(false)
      }
    }
  }

  const inputProps = (type: string, value: string, onChange: (v: string) => void, placeholder: string, autocomplete: string) => ({
    type,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    placeholder,
    autoComplete: autocomplete,
    style: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${accent}44`,
      background: 'rgba(0,0,0,0.3)',
      color: '#eafcff',
      fontSize: 14,
      outline: 'none',
      fontFamily: "'JetBrains Mono', monospace",
      transition: 'border-color 0.2s, box-shadow 0.2s',
    } as React.CSSProperties,
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 6, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: 'min(90vw, 420px)',
          borderRadius: 20,
          border: `1px solid ${accent}66`,
          background: 'rgba(8, 12, 28, 0.92)',
          boxShadow: `0 0 40px ${accent}33, 0 0 80px ${accent}15`,
          padding: 32,
          animation: 'modalIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            className="font-display"
            style={{ fontSize: 11, letterSpacing: '0.35em', color: accent, marginBottom: 6 }}
          >
            {isSetup ? 'INITIAL SETUP · 首次设置' : 'ADMIN · 管理登录'}
          </div>
          <div
            className="font-display"
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#eafcff',
              textShadow: `0 0 12px ${accent}, 0 0 28px ${accent}44`,
            }}
          >
            {isSetup ? '设置管理员密码' : '云中书 · 后台'}
          </div>
          {isSetup && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#9fb3c8', letterSpacing: '0.05em', lineHeight: 1.6 }}>
              首次访问管理后台，请设置管理员密码<br />
              密码使用 <span style={{ color: accent }}>PBKDF2-SHA256 加盐哈希</span> 存储，不可逆
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 空间标识 = 用户名，只读展示 */}
          <div>
            <label style={labelStyle(accent)}>空间标识 / SPACE ID</label>
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${accent}44`, background: 'rgba(0,0,0,0.3)',
              color: '#9fb3c8', fontSize: 14, letterSpacing: '0.05em',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {slug}
            </div>
            <div style={{ marginTop: 4, fontSize: 9, color: '#556678' }}>
              空间标识即您的管理员账号
            </div>
          </div>

          <div>
            <label style={labelStyle(accent)}>
              {isSetup ? '设置密码 / PASSWORD' : '密码 / PASSWORD'}
            </label>
            <input
              ref={inputRef}
              {...inputProps('password', password, setPassword, isSetup ? '至少 4 个字符' : '输入密码', isSetup ? 'new-password' : 'current-password')}
            />
          </div>

          {isSetup && (
            <div>
              <label style={labelStyle(accent)}>确认密码 / CONFIRM</label>
              <input {...inputProps('password', confirmPassword, setConfirmPassword, '再次输入密码', 'new-password')} />
            </div>
          )}

          {error && (
            <div
              style={{
                fontSize: 12,
                color: '#ff4477',
                textAlign: 'center',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(255,68,119,0.1)',
                border: '1px solid #ff447744',
              }}
            >
              ⚠ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              取消
            </button>
            <button type="submit" disabled={loading} style={submitBtnStyle(accent, loading)}>
              {loading ? '处理中…' : isSetup ? '设置密码并登录' : '登 录'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 9, color: '#556678', letterSpacing: '0.1em' }}>
          密码通过 PBKDF2-SHA256 加盐哈希存储 · 不可逆反推
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

const labelStyle = (accent: string): React.CSSProperties => ({
  display: 'block',
  fontSize: 10,
  letterSpacing: '0.25em',
  color: accent,
  marginBottom: 6,
})

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'transparent',
  color: '#8fa4c0',
  fontSize: 12,
  letterSpacing: '0.15em',
  cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
}

const submitBtnStyle = (accent: string, loading: boolean): React.CSSProperties => ({
  flex: 2,
  padding: '10px 0',
  borderRadius: 10,
  border: `1px solid ${accent}`,
  background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
  color: accent,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.2em',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
  boxShadow: `0 0 16px ${accent}33`,
  opacity: loading ? 0.6 : 1,
})
