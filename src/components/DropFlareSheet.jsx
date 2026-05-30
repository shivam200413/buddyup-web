import { useState } from 'react'
import { useStore } from '../lib/store'
import { ACTIVITIES } from '../lib/supabase'

export default function DropFlareSheet({ onClose }) {
  const { dropFlare, fetchNearbyFlares, position } = useStore()
  const [selected, setSelected] = useState('run')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDrop = async () => {
    if (!position) { setError('Waiting for GPS...'); return }
    setLoading(true); setError('')
    const { error } = await dropFlare(selected, desc)
    setLoading(false)
    if (error) { setError(typeof error === 'string' ? error : (error.message || 'Failed to drop flare')); return }
    fetchNearbyFlares()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1500, backdropFilter: 'blur(2px)'
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1600,
        background: 'var(--bg2)', borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border2)', borderBottom: 'none',
        padding: '20px 20px 36px',
        animation: 'fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both'
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, background: 'var(--bg4)',
          borderRadius: 2, margin: '0 auto 20px'
        }} />

        <div style={{
          fontSize: 18, fontWeight: 700, marginBottom: 4,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          🔥 Drop a Flare
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 20 }}>
          visible to people within 2km · expires in 2 hours
        </div>

        {/* Activity grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20
        }}>
          {ACTIVITIES.map(a => (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              style={{
                padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: selected === a.id ? `${a.color}22` : 'var(--bg3)',
                border: selected === a.id ? `2px solid ${a.color}99` : '2px solid transparent',
                transition: 'all 0.15s',
                fontFamily: 'var(--font)'
              }}
            >
              <span style={{ fontSize: 20 }}>{a.emoji}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, color: selected === a.id ? a.color : 'var(--text3)'
              }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>

        {/* Optional description */}
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          maxLength={80}
          placeholder="Add a note... (optional)"
          rows={2}
          style={{
            width: '100%', background: 'var(--bg3)',
            border: '1px solid var(--border2)', borderRadius: 8,
            color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13,
            padding: '10px 12px', outline: 'none', resize: 'none',
            marginBottom: 16
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--mono)', marginBottom: 12 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12, background: 'var(--bg3)',
              border: '1px solid var(--border2)', borderRadius: 10,
              color: 'var(--text2)', fontFamily: 'var(--font)', fontWeight: 600,
              fontSize: 14, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDrop}
            disabled={loading}
            style={{
              flex: 2, padding: 12,
              background: loading ? 'var(--bg4)' : 'var(--accent)',
              border: 'none', borderRadius: 10,
              color: loading ? 'var(--text3)' : '#030712',
              fontFamily: 'var(--font)', fontWeight: 700,
              fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Dropping...' : '🔥 Drop Flare'}
          </button>
        </div>
      </div>
    </>
  )
}
