import { Link } from 'react-router-dom'
import { DEFAULT_SLUG } from '../data'

interface NotFoundProps {
  slug: string
  accent?: string
  /** 点击「创建此空间」时触发 */
  onClaim: () => void
}

/**
 * 404 页面：当访问的空间标识不存在时展示。
 * 除了返回默认空间，还提供「创建此空间」入口，引导用户直接创建所访问的 slug。
 */
export default function NotFound({ slug, accent = '#22e3ff', onClaim }: NotFoundProps) {
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
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to={`/${DEFAULT_SLUG}`}
          className="font-display"
          style={{
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
        <button
          type="button"
          onClick={onClaim}
          className="font-display"
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            border: `1px solid ${accent}`,
            color: accent,
            fontSize: 12,
            letterSpacing: 2,
            cursor: 'pointer',
            background: `linear-gradient(135deg, ${accent}22, ${accent}0a)`,
            boxShadow: `0 0 16px ${accent}33`,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          ＋ 创建此空间 /{slug}
        </button>
      </div>
    </div>
  )
}
