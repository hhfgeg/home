import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store'
import type { Card } from '../data'

const PROTECTED_IDS = new Set(['about', 'signature'])

function CardForm({
  card,
  onSave,
  onCancel,
  accent,
}: {
  card: Partial<Card> & { kind: string }
  onSave: (data: any) => void
  onCancel: () => void
  accent: string
}) {
  const [form, setForm] = useState(() => {
    if (card.kind === 'work') {
      return {
        id: (card as any).id || '',
        title: (card as any).title || '',
        subtitle: (card as any).subtitle || '',
        year: (card as any).year || new Date().getFullYear().toString(),
        tags: [...((card as any).tags || [])] as string[],
        accent: (card as any).accent || accent,
        poster: (card as any).poster || '/assets/work1.jpg',
        intro: (card as any).intro || '',
        concept: (card as any).concept || '',
        link: (card as any).link || '',
        video: (card as any).video || '',
      }
    }
    return {}
  })

  const [tagInput, setTagInput] = useState('')
  const isNew = !(card as any).id

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    const t = tagInput.trim()
    const tags = form.tags || []
    if (t && !tags.includes(t)) {
      setForm((prev: any) => ({ ...prev, tags: [...tags, t] }))
    }
    setTagInput('')
  }

  const removeTag = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      tags: prev.tags.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const item: any = {
      kind: 'work',
      id: form.id,
      title: form.title,
      subtitle: form.subtitle,
      year: form.year,
      tags: form.tags,
      accent: form.accent,
      poster: form.poster,
      intro: form.intro,
      concept: form.concept,
      link: form.link,
    }
    if (form.video) item.video = form.video
    onSave(item)
  }

  const inputStyle = (wide = false): React.CSSProperties => ({
    width: wide ? '100%' : '100%',
    padding: '8px 11px',
    borderRadius: 8,
    border: `1px solid ${accent}44`,
    background: 'rgba(0,0,0,0.3)',
    color: '#eafcff',
    fontSize: 12,
    outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'border-color 0.2s',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 9,
    letterSpacing: '0.2em',
    color: accent,
    marginBottom: 4,
    textTransform: 'uppercase',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3
        className="font-display"
        style={{
          fontSize: 13,
          color: '#eafcff',
          letterSpacing: '0.15em',
          borderBottom: `1px solid ${accent}33`,
          paddingBottom: 8,
          margin: 0,
        }}
      >
        {isNew ? '✦ 新建作品' : `✎ 编辑：${(card as any).title}`}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>ID（唯一标识）</label>
          <input
            style={inputStyle()}
            value={form.id}
            onChange={(e) => handleChange('id', e.target.value)}
            placeholder="my-project"
            disabled={!isNew}
          />
        </div>
        <div>
          <label style={labelStyle}>年份</label>
          <input
            style={inputStyle()}
            value={form.year}
            onChange={(e) => handleChange('year', e.target.value)}
            placeholder="2026"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>标题</label>
          <input
            style={inputStyle()}
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="作品标题"
          />
        </div>
        <div>
          <label style={labelStyle}>副标题</label>
          <input
            style={inputStyle()}
            value={form.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="简短描述"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>主题色</label>
          <input
            style={inputStyle()}
            value={form.accent}
            onChange={(e) => handleChange('accent', e.target.value)}
            type="color"
          />
        </div>
        <div>
          <label style={labelStyle}>海报 (assets path)</label>
          <input
            style={inputStyle()}
            value={form.poster}
            onChange={(e) => handleChange('poster', e.target.value)}
            placeholder="/assets/work1.jpg"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>标签（回车添加）</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {(form.tags || []).map((t: string, i: number) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 10px',
                borderRadius: 999,
                border: `1px solid ${accent}66`,
                color: accent,
                fontSize: 11,
              }}
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff4477',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          style={inputStyle()}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder="输入标签后按回车"
        />
      </div>

      <div>
        <label style={labelStyle}>简介</label>
        <textarea
          style={{ ...inputStyle(), minHeight: 60, resize: 'vertical' }}
          value={form.intro}
          onChange={(e) => handleChange('intro', e.target.value)}
          placeholder="作品简介描述"
        />
      </div>

      <div>
        <label style={labelStyle}>创作理念</label>
        <textarea
          style={{ ...inputStyle(), minHeight: 60, resize: 'vertical' }}
          value={form.concept}
          onChange={(e) => handleChange('concept', e.target.value)}
          placeholder="设计理念与背景"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>外部链接</label>
          <input
            style={inputStyle()}
            value={form.link}
            onChange={(e) => handleChange('link', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <label style={labelStyle}>视频链接（可选）</label>
          <input
            style={inputStyle()}
            value={form.video}
            onChange={(e) => handleChange('video', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: `1px solid ${accent}33`,
            background: 'transparent',
            color: '#8fa4c0',
            fontSize: 11,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          取消
        </button>
        <button
          type="submit"
          style={{
            flex: 2,
            padding: '8px 0',
            borderRadius: 8,
            border: `1px solid ${accent}`,
            background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
            color: accent,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.15em',
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: `0 0 12px ${accent}33`,
          }}
        >
          {isNew ? '创建作品' : '保存修改'}
        </button>
      </div>
    </form>
  )
}

export default function AdminPanel({
  slug,
  accent = '#22e3ff',
  onClose,
}: {
  slug: string
  accent?: string
  onClose: () => void
}) {
  const token = useStore((s) => s.token)
  const logout = useStore((s) => s.logout)
  const username = useStore((s) => s.username)
  const setFocused = useStore((s) => s.setFocused)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Card | null>(null)
  const [creating, setCreating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const apiHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const loadCards = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/cards/${slug}`, { headers: apiHeaders })
      if (res.status === 401) {
        logout()
        onClose()
        return
      }
      const data = await res.json()
      setCards(data.items || [])
    } catch {
      setError('加载卡片失败')
    } finally {
      setLoading(false)
    }
  }, [slug, token])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 2000)
  }

  const handleSave = async (item: any) => {
    try {
      const res = await fetch(`/api/admin/cards/${slug}`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(item),
      })
      if (res.status === 401) { logout(); onClose(); return }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '保存失败')
      }
      await loadCards()
      setEditing(null)
      setCreating(false)
      showSuccess(creating ? '作品创建成功' : '作品更新成功')
    } catch (err: any) {
      setError(err.message || '保存失败')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDelete = async (id: string) => {
    if (PROTECTED_IDS.has(id)) return
    if (!confirm(`确定要删除作品 "${id}" 吗？此操作不可撤销。`)) return
    try {
      const res = await fetch(`/api/admin/cards/${slug}/${id}`, {
        method: 'DELETE',
        headers: apiHeaders,
      })
      if (res.status === 401) { logout(); onClose(); return }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '删除失败')
      }
      await loadCards()
      showSuccess('作品已删除')
    } catch (err: any) {
      setError(err.message || '删除失败')
      setTimeout(() => setError(''), 3000)
    }
  }

  const workCards = cards.filter((c) => c.kind === 'work')
  const otherCards = cards.filter((c) => c.kind !== 'work')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(4, 6, 18, 0.92)',
        backdropFilter: 'blur(16px)',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: `1px solid ${accent}33`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => {
              setFocused(null)
              onClose()
            }}
            className="font-display"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#cfefff',
              fontSize: 11,
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            ← 返回展厅
          </button>
          <div>
            <div className="font-display" style={{ fontSize: 10, letterSpacing: '0.3em', color: accent }}>
              ADMIN PANEL
            </div>
            <div className="font-display" style={{ fontSize: 16, color: '#eafcff', fontWeight: 600 }}>
              管理面板 · {slug}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#8fa4c0' }}>{username}</span>
          <button
            onClick={() => { logout(); onClose() }}
            style={{
              padding: '4px 14px',
              borderRadius: 999,
              border: '1px solid #ff447744',
              background: 'transparent',
              color: '#ff4477',
              fontSize: 10,
              cursor: 'pointer',
              letterSpacing: '0.1em',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* Success / error toast */}
      {(successMsg || error) && (
        <div
          style={{
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: 11,
            color: successMsg ? '#9dff3d' : '#ff4477',
            background: successMsg ? 'rgba(157,255,61,0.08)' : 'rgba(255,68,119,0.08)',
            borderBottom: `1px solid ${successMsg ? '#9dff3d33' : '#ff447733'}`,
            letterSpacing: '0.1em',
          }}
        >
          {successMsg || `⚠ ${error}`}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 24, flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: accent, fontSize: 13, letterSpacing: '0.2em' }}>
            加载中…
          </div>
        ) : editing || creating ? (
          <CardForm
            card={editing || { kind: 'work' }}
            accent={accent}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false) }}
          />
        ) : (
          <div>
            {/* Work cards section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="font-display" style={{ fontSize: 11, letterSpacing: '0.25em', color: accent }}>
                  ✦ 作品卡片 ({workCards.length})
                </div>
                <button
                  onClick={() => setCreating(true)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 999,
                    border: `1px solid ${accent}`,
                    background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
                    color: accent,
                    fontSize: 11,
                    cursor: 'pointer',
                    letterSpacing: '0.1em',
                    fontFamily: "'JetBrains Mono', monospace",
                    boxShadow: `0 0 12px ${accent}22`,
                  }}
                >
                  + 新建作品
                </button>
              </div>

              {workCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#556678', fontSize: 12 }}>
                  暂无作品，点击「新建作品」添加
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {workCards.map((card) => (
                    <div
                      key={card.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: `1px solid ${(card as any).accent || accent}33`,
                        background: 'rgba(0,0,0,0.25)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: (card as any).accent || accent,
                            opacity: 0.2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                          }}
                        >
                          🎨
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: '#eafcff', fontWeight: 500 }}>
                            {(card as any).title}
                          </div>
                          <div style={{ fontSize: 10, color: '#8fa4c0', marginTop: 2 }}>
                            ID: {card.id} · {(card as any).year} · {(card as any).tags?.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setEditing(card)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            border: `1px solid ${accent}44`,
                            background: 'transparent',
                            color: accent,
                            fontSize: 10,
                            cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            border: '1px solid #ff447744',
                            background: 'transparent',
                            color: '#ff4477',
                            fontSize: 10,
                            cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Protected cards section */}
            <div>
              <div className="font-display" style={{ fontSize: 11, letterSpacing: '0.25em', color: '#556678', marginBottom: 12 }}>
                🔒 受保护卡片（不可管理）
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {otherCards.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: '1px solid #222840',
                      background: 'rgba(0,0,0,0.15)',
                      opacity: 0.5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 16 }}>{card.kind === 'about' ? '👤' : '✍️'}</div>
                      <div>
                        <div style={{ fontSize: 12, color: '#8fa4c0' }}>{card.title}</div>
                        <div style={{ fontSize: 9, color: '#556678', marginTop: 2 }}>
                          {card.kind === 'about' ? '关于我卡片' : '签名墙卡片'} — 系统保留
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: '#556678', letterSpacing: '0.1em' }}>🔒 受保护</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
