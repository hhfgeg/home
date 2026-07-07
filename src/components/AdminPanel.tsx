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
  onSpaceUpdated,
}: {
  slug: string
  accent?: string
  onClose: () => void
  onSpaceUpdated?: () => void
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
  const [activeTab, setTab] = useState<'works' | 'about' | 'sigs' | 'settings'>('works')

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

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${accent}33`, padding: '0 24px', flexShrink: 0, gap: 0 }}>
        {[
          { key: 'works' as const, label: '✦ 作品' },
          { key: 'about' as const, label: '👤 关于' },
          { key: 'sigs' as const, label: '✍ 签名' },
          { key: 'settings' as const, label: '⚙ 空间设置' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setTab(tab.key); setEditing(null); setCreating(false) }}
            className="font-display"
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.key ? accent : '#8fa4c0',
              fontSize: 11,
              letterSpacing: '0.15em',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? `2px solid ${accent}` : '2px solid transparent',
              transition: 'all 0.2s',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24, flex: 1, overflow: 'auto' }}>
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
          <>
            {/* ========= 作品 Tab ========= */}
            {activeTab === 'works' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div className="font-display" style={{ fontSize: 11, letterSpacing: '0.25em', color: accent }}>
                    作品卡片 ({workCards.length})
                  </div>
                  <button onClick={() => setCreating(true)} style={actionBtnStyle(accent)}>
                    + 新建作品
                  </button>
                </div>
                {workCards.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: '#556678', fontSize: 12 }}>
                    暂无作品
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {workCards.map((card) => (
                      <div key={card.id} style={cardRowStyle((card as any).accent || accent)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={iconBoxStyle((card as any).accent || accent)}>🎨</div>
                          <div>
                            <div style={{ fontSize: 13, color: '#eafcff', fontWeight: 500 }}>{(card as any).title}</div>
                            <div style={{ fontSize: 10, color: '#8fa4c0', marginTop: 2 }}>
                              ID: {card.id} · {(card as any).year} · {(card as any).tags?.join(', ')}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditing(card)} style={editBtnStyle(accent)}>编辑</button>
                          <button onClick={() => handleDelete(card.id)} style={delBtnStyle}>删除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========= 关于 Tab ========= */}
            {activeTab === 'about' && (
              <AboutEditor
                card={otherCards.find((c) => c.kind === 'about')}
                accent={accent}
                slug={slug}
                token={token!}
                onSuccess={(msg) => { showSuccess(msg); loadCards() }}
                onError={(msg) => { setError(msg); setTimeout(() => setError(''), 3000) }}
              />
            )}

            {/* ========= 签名 Tab ========= */}
            {activeTab === 'sigs' && (
              <SignatureManager
                slug={slug}
                accent={accent}
                token={token!}
                onSuccess={(msg) => { showSuccess(msg) }}
                onError={(msg) => { setError(msg); setTimeout(() => setError(''), 3000) }}
              />
            )}

            {/* ========= 空间设置 Tab ========= */}
            {activeTab === 'settings' && (
              <SpaceSettingsEditor
                slug={slug}
                accent={accent}
                token={token!}
                onSuccess={(msg) => { showSuccess(msg); onSpaceUpdated?.() }}
                onError={(msg) => { setError(msg); setTimeout(() => setError(''), 3000) }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ================================================================
//  关于卡片编辑器
// ================================================================
function AboutEditor({
  card, accent, slug, token, onSuccess, onError,
}: {
  card: Card | undefined
  accent: string
  slug: string
  token: string
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [form, setForm] = useState(() => {
    if (card && card.kind === 'about') {
      return {
        name: card.name || '',
        role: card.role || '',
        location: card.location || '',
        title: card.title || '',
        subtitle: card.subtitle || '',
        bio: [...(card.bio || [])],
        stats: (card.stats || []).map((s) => ({ k: s.k, v: s.v })),
        contacts: (card.contacts || []).map((c) => ({ label: c.label, value: c.value, href: c.href })),
      }
    }
    return { name: '', role: '', location: '', title: '', subtitle: '', bio: [''], stats: [], contacts: [] }
  })
  const [saving, setSaving] = useState(false)

  if (!card || card.kind !== 'about') {
    return <div style={{ textAlign: 'center', padding: 32, color: '#556678', fontSize: 12 }}>关于卡片未找到</div>
  }

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/cards/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          kind: 'about', id: 'about', accent: card.accent,
          name: form.name, role: form.role, location: form.location,
          title: form.title, subtitle: form.subtitle,
          bio: form.bio, stats: form.stats, contacts: form.contacts,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || '保存失败')
      onSuccess('关于信息已更新')
    } catch (e: any) {
      onError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const sectLabel: React.CSSProperties = { fontSize: 10, letterSpacing: '0.2em', color: accent, marginBottom: 8, marginTop: 14 }
  const iStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${accent}44`, background: 'rgba(0,0,0,0.25)',
    color: '#eafcff', fontSize: 12, outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
  }
  const taStyle: React.CSSProperties = { ...iStyle, minHeight: 50, resize: 'vertical' }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={sectLabel}>基本信息 / BASIC INFO</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <input style={iStyle} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="姓名" />
        <input style={iStyle} value={form.role} onChange={(e) => update('role', e.target.value)} placeholder="角色" />
        <input style={iStyle} value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="地点" />
      </div>

      <div style={sectLabel}>卡片文案 / CARD TEXT</div>
      <input style={iStyle} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="卡片标题" />
      <input style={{ ...iStyle, marginTop: 8 }} value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} placeholder="卡片副标题" />

      <div style={sectLabel}>个人简介 / BIO</div>
      {form.bio.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <textarea
            style={taStyle}
            value={b}
            onChange={(e) => {
              const nb = [...form.bio]; nb[i] = e.target.value; update('bio', nb)
            }}
            placeholder={`段落 ${i + 1}`}
          />
          {form.bio.length > 1 && (
            <button onClick={() => update('bio', form.bio.filter((_, j) => j !== i))}
              style={{ ...delBtnStyle, padding: '0 8px', fontSize: 14 }}>×</button>
          )}
        </div>
      ))}
      <button onClick={() => update('bio', [...form.bio, ''])}
        style={{ ...actionBtnStyle(accent), marginTop: 4 }}>+ 添加段落</button>

      <div style={sectLabel}>统计数据 / STATS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {form.stats.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={iStyle} value={s.k} onChange={(e) => {
              const ns = [...form.stats]; ns[i] = { ...ns[i], k: e.target.value }; update('stats', ns)
            }} placeholder="字段名" />
            <input style={iStyle} value={s.v} onChange={(e) => {
              const ns = [...form.stats]; ns[i] = { ...ns[i], v: e.target.value }; update('stats', ns)
            }} placeholder="值" />
            <button onClick={() => update('stats', form.stats.filter((_, j) => j !== i))}
              style={{ ...delBtnStyle, padding: '4px 10px', fontSize: 14 }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => update('stats', [...form.stats, { k: '', v: '' }])}
        style={{ ...actionBtnStyle(accent), marginTop: 6 }}>+ 添加统计</button>

      <div style={sectLabel}>联系方式 / CONTACTS</div>
      {form.contacts.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
          <input style={iStyle} value={c.label} onChange={(e) => {
            const nc = [...form.contacts]; nc[i] = { ...nc[i], label: e.target.value }; update('contacts', nc)
          }} placeholder="标签" />
          <input style={iStyle} value={c.value} onChange={(e) => {
            const nc = [...form.contacts]; nc[i] = { ...nc[i], value: e.target.value }; update('contacts', nc)
          }} placeholder="值" />
          <input style={iStyle} value={c.href} onChange={(e) => {
            const nc = [...form.contacts]; nc[i] = { ...nc[i], href: e.target.value }; update('contacts', nc)
          }} placeholder="链接" />
          <button onClick={() => update('contacts', form.contacts.filter((_, j) => j !== i))}
            style={{ ...delBtnStyle, padding: '4px 10px', fontSize: 14 }}>×</button>
        </div>
      ))}
      <button onClick={() => update('contacts', [...form.contacts, { label: '', value: '', href: '' }])}
        style={{ ...actionBtnStyle(accent), marginTop: 4 }}>+ 添加联系方式</button>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSave} disabled={saving} style={submitBtnStyle(accent)}>
          {saving ? '保存中…' : '保存关于信息'}
        </button>
        <div style={{ marginTop: 8, fontSize: 9, color: '#556678' }}>
          🔒 关于卡片为系统卡片，不可删除，仅可编辑内容
        </div>
      </div>
    </div>
  )
}

// ================================================================
//  签名管理器
// ================================================================
function SignatureManager({
  slug, accent, token, onSuccess, onError,
}: {
  slug: string
  accent: string
  token: string
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [sigs, setSigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadSigs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/signatures/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setSigs(await res.json())
    } catch {}
    setLoading(false)
  }, [slug, token])

  useEffect(() => { loadSigs() }, [loadSigs])

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条签名？')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/signatures/${slug}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error((await res.json()).error || '删除失败')
      setSigs((p) => p.filter((s) => s.id !== id))
      onSuccess('签名已删除')
    } catch (e: any) {
      onError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="font-display" style={{ fontSize: 11, letterSpacing: '0.25em', color: accent }}>
          签名墙管理 ({sigs.length} 条)
        </div>
        <button onClick={loadSigs} style={actionBtnStyle(accent)}>⟳ 刷新</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#556678', fontSize: 12 }}>加载中…</div>
      ) : sigs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#556678', fontSize: 12 }}>暂无签名</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflow: 'auto' }}>
          {sigs.map((s) => (
            <div key={s.id} style={cardRowStyle(accent)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: s.color || accent, fontWeight: 500 }}>
                    {s.name || '匿名'}
                  </span>
                  <span style={{ fontSize: 9, color: '#556678' }}>ID: {s.id?.slice(0, 16)}…</span>
                </div>
                {s.comment && (
                  <div style={{ fontSize: 10, color: '#9fb3c8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.comment}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deleting === s.id}
                style={{ ...delBtnStyle, opacity: deleting === s.id ? 0.5 : 1 }}
              >
                {deleting === s.id ? '…' : '删除'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 9, color: '#556678' }}>
        🔒 签名墙为系统卡片，不可删除，此处管理的是签名墙上的留言内容
      </div>
    </div>
  )
}

// ================================================================
//  空间设置编辑器（名称、文案、主题色）
// ================================================================
function SpaceSettingsEditor({
  slug, accent, token, onSuccess, onError,
}: {
  slug: string
  accent: string
  token: string
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [form, setForm] = useState({
    name: '', brand: '', subtitle: '', studio: '', title: '', description: '',
    primary: '#22e3ff', secondary: '#ff3df0',
  })
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/space/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: any) => {
        setForm({
          name: data.name || '',
          brand: data.brand || '',
          subtitle: data.subtitle || '',
          studio: data.studio || '',
          title: data.title || '',
          description: data.description || '',
          primary: data.theme?.primary || '#22e3ff',
          secondary: data.theme?.secondary || '#ff3df0',
        })
        setLoaded(true)
      })
      .catch(() => { setLoaded(true) })
  }, [slug])

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/space/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          brand: form.brand,
          subtitle: form.subtitle,
          studio: form.studio,
          title: form.title,
          description: form.description,
          theme: { primary: form.primary, secondary: form.secondary },
        }),
      })
      if (res.status === 401) throw new Error('登录已失效，请重新登录')
      if (!res.ok) throw new Error((await res.json()).error || '保存失败')
      onSuccess('空间设置已更新')
    } catch (e: any) {
      onError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const sectLabel: React.CSSProperties = { fontSize: 10, letterSpacing: '0.2em', color: accent, marginBottom: 8, marginTop: 14 }
  const iStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${accent}44`, background: 'rgba(0,0,0,0.25)',
    color: '#eafcff', fontSize: 12, outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
  }
  const taStyle: React.CSSProperties = { ...iStyle, minHeight: 60, resize: 'vertical' }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={sectLabel}>空间名称 / DISPLAY NAME</div>
      <input style={iStyle} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="中文名（留空则使用标识）" />
      <div style={{ fontSize: 9, color: '#556678', marginTop: 4 }}>
        展示在 HUD 与浏览器标题；留空则回退到空间标识
      </div>

      <div style={sectLabel}>卡片文案 / CARD TEXT</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input style={iStyle} value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="标识(slug)" />
        <input style={iStyle} value={form.studio} onChange={(e) => update('studio', e.target.value)} placeholder="工作室" />
      </div>
      <input style={{ ...iStyle, marginTop: 8 }} value={form.subtitle} onChange={(e) => update('subtitle', e.target.value)} placeholder="副标题" />
      <input style={{ ...iStyle, marginTop: 8 }} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="页面标题" />
      <textarea style={{ ...taStyle, marginTop: 8 }} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="空间简介" />

      <div style={sectLabel}>主题色 / THEME</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="color" value={form.primary} onChange={(e) => update('primary', e.target.value)} style={{ width: 36, height: 32, background: 'transparent', border: 'none' }} />
          <input style={iStyle} value={form.primary} onChange={(e) => update('primary', e.target.value)} placeholder="#22e3ff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="color" value={form.secondary} onChange={(e) => update('secondary', e.target.value)} style={{ width: 36, height: 32, background: 'transparent', border: 'none' }} />
          <input style={iStyle} value={form.secondary} onChange={(e) => update('secondary', e.target.value)} placeholder="#ff3df0" />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSave} disabled={saving || !loaded} style={submitBtnStyle(accent)}>
          {saving ? '保存中…' : '保存空间设置'}
        </button>
        <div style={{ marginTop: 8, fontSize: 9, color: '#556678' }}>
          🔒 需管理员登录；更改即时生效，HUD 将实时刷新
        </div>
      </div>
    </div>
  )
}

// ---- 共享内联样式 ----
const actionBtnStyle = (accent: string): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: 999,
  border: `1px solid ${accent}`,
  background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
  color: accent, fontSize: 11, cursor: 'pointer',
  letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace",
  boxShadow: `0 0 12px ${accent}22`,
})

const editBtnStyle = (accent: string): React.CSSProperties => ({
  padding: '4px 12px', borderRadius: 6,
  border: `1px solid ${accent}44`, background: 'transparent',
  color: accent, fontSize: 10, cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
})

const delBtnStyle: React.CSSProperties = {
  padding: '4px 12px', borderRadius: 6,
  border: '1px solid #ff447744', background: 'transparent',
  color: '#ff4477', fontSize: 10, cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
}

const cardRowStyle = (accent: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '12px 16px', borderRadius: 12,
  border: `1px solid ${accent}33`, background: 'rgba(0,0,0,0.25)',
})

const iconBoxStyle = (accent: string): React.CSSProperties => ({
  width: 36, height: 36, borderRadius: 8,
  background: accent, opacity: 0.2,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
})

const submitBtnStyle = (accent: string): React.CSSProperties => ({
  padding: '8px 24px', borderRadius: 999,
  border: `1px solid ${accent}`,
  background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
  color: accent, fontSize: 11, fontWeight: 600, cursor: 'pointer',
  letterSpacing: '0.15em', fontFamily: "'JetBrains Mono', monospace",
  boxShadow: `0 0 12px ${accent}33`,
})
