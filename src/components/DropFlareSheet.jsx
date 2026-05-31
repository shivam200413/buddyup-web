import { useState } from 'react'
import { useStore } from '../lib/store'
import { ACTIVITIES } from '../lib/supabase'

export default function DropFlareSheet({ onClose }) {
  const { dropFlare, fetchNearbyFlares, position } = useStore()
  const [selected, setSelected] = useState('run')
  const [desc,     setDesc]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleDrop = async () => {
    if (!position) { setError('Waiting for GPS signal...'); return }
    setLoading(true); setError('')
    const { error } = await dropFlare(selected, desc.trim() || null)
    setLoading(false)
    if (error) {
      if (error.message?.includes('Max 3 active'))
        setError('You already have 3 active flares. Wait for one to expire.')
      else
        setError(error.message || 'Failed to drop flare')
      return
    }
    fetchNearbyFlares()
    onClose()
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1500, backdropFilter: 'blur(2px)'
        }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 1600, background: 'var(--bg2)',
        borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border2)', borderBottom: 'none',
        padding: '16px 20px 36px',
        animation: 'fadeUp 0.3s cubic-bezier(0.34,1.4,0.64,1) both'
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, background: 'var(--bg4)',
          borderRadius: 2, margin: '0 auto 18px'
        }} />

        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>
            🔥 Drop a Flare
          </div>
          <div style={{
            fontSize: 12, color: 'var(--text3)',
            fontFamily: 'var(--mono)'
          }}>
            visible within 2km · expires in 2 hours
          </div>
        </div>

        {/* Activity grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8, marginBottom: 18
        }}>
          {ACTIVITIES.map(a => (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              style={{
                padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 5,
                background: selected === a.id ? `${a.color}20` : 'var(--bg3)',
                border: selected === a.id
                  ? `2px solid ${a.color}99`
                  : '2px solid transparent',
                transition: 'all 0.12s'
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{a.emoji}</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: selected === a.id ? a.color : 'var(--text3)',
                lineHeight: 1
              }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>

        {/* Description */}
        <div style={{ position: 'relative', marginBottom: 6 }}>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            maxLength={80}
            placeholder="Add a note... (optional)"
            rows={2}
            style={{
              width: '100%', background: 'var(--bg3)',
              border: '1px solid var(--border2)', borderRadius: 10,
              color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13,
              padding: '10px 12px', outline: 'none', resize: 'none',
              boxSizing: 'border-box', lineHeight: 1.5
            }}
          />
          <div style={{
            position: 'absolute', bottom: 8, right: 10,
            fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)',
            pointerEvents: 'none'
          }}>
            {desc.length}/80
          </div>
        </div>

        {/* GPS status */}
        {!position && (
          <div style={{
            fontSize: 11, color: 'var(--orange)', fontFamily: 'var(--mono)',
            marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--orange)', animation: 'blink 1s ease infinite'
            }} />
            Waiting for GPS...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            fontSize: 12, color: 'var(--red)', fontFamily: 'var(--mono)',
            padding: '8px 10px', background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 8, marginBottom: 12
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 13, background: 'var(--bg3)',
              border: '1px solid var(--border2)', borderRadius: 10,
              color: 'var(--text2)', fontFamily: 'var(--font)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDrop}
            disabled={loading || !position}
            style={{
              flex: 2, padding: 13,
              background: loading || !position ? 'var(--bg4)' : 'var(--accent)',
              border: 'none', borderRadius: 10,
              color: loading || !position ? 'var(--text3)' : '#030712',
              fontFamily: 'var(--font)', fontWeight: 700,
              fontSize: 14,
              cursor: loading || !position ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {loading ? 'Dropping...' : '🔥 Drop Flare'}
          </button>
        </div>
      </div>
    </>
  )
}
