import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'

export default function ProfileSetup() {
  const { createProfile, signOut, fetchProfile, session } = useStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  // Re-check if profile was already created (covers magic link redirect case)
  useEffect(() => {
    const recheck = async () => {
      if (session?.user?.id) await fetchProfile(session.user.id)
      setChecking(false)
    }
    recheck()
  }, [session])

  if (checking) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080d14',
        flexDirection: 'column', gap: 14
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(255,255,255,0.08)',
          borderTop: '2px solid #38bdf8',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 12 }}>
          loading...
        </span>
      </div>
    )
  }

  const handleChange = (val) => {
    // Strip invalid chars as you type
    setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))
    setError('')
  }

  const handle = async () => {
    if (username.length < 3) { setError('Must be at least 3 characters'); return }
    setLoading(true); setError('')
    const { error } = await createProfile(username)
    setLoading(false)
    if (error) setError(error.message || 'Username taken — try another one')
  }

  const isValid = username.length >= 3
  const strengthColor = username.length === 0 ? '#1e293b'
    : username.length < 3 ? '#ef4444'
    : '#4ade80'

  return (
    <div style={{
      minHeight: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#080d14', padding: '24px 20px'
    }}>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          fontSize: 42, fontWeight: 800, letterSpacing: '-2px',
          color: '#f1f5f9', marginBottom: 10
        }}>BuddyUp</div>
        <div style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace' }}>
          one last step
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: 360,
        background: '#0f1f35',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, padding: '28px 24px',
        animation: 'fadeUp 0.3s ease both'
      }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Pick a username</div>
          <div style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace', lineHeight: 1.6 }}>
            This is how others see you on the map.<br />
            Lowercase, numbers and _ only.
          </div>
        </div>

        {/* Input with live length bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: '#475569', fontSize: 15, fontFamily: 'monospace',
              pointerEvents: 'none'
            }}>@</span>
            <input
              type="text"
              value={username}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && isValid && handle()}
              placeholder="your_name"
              maxLength={20}
              autoFocus
              style={{
                width: '100%', background: '#111827',
                border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, color: '#f1f5f9',
                fontSize: 15, padding: '12px 14px 12px 30px',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'monospace', transition: 'border-color 0.2s'
              }}
            />
          </div>
          {/* Character length bar */}
          <div style={{
            height: 2, marginTop: 6, borderRadius: 1,
            background: 'rgba(255,255,255,0.06)', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', transition: 'width 0.2s, background 0.2s',
              background: strengthColor,
              width: `${Math.min((username.length / 20) * 100, 100)}%`
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 5
          }}>
            <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>
              {username.length < 3
                ? `${3 - username.length} more character${3 - username.length !== 1 ? 's' : ''}`
                : '✓ looks good'}
            </span>
            <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>
              {username.length}/20
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 8, padding: '9px 12px',
            fontSize: 12, color: '#f87171',
            marginBottom: 16, fontFamily: 'monospace'
          }}>
            {error}
          </div>
        )}

        {/* Preview badge */}
        {username.length >= 3 && !error && (
          <div style={{
            background: 'rgba(56,189,248,0.06)',
            border: '1px solid rgba(56,189,248,0.15)',
            borderRadius: 8, padding: '8px 12px',
            fontSize: 12, color: '#38bdf8',
            marginBottom: 16, fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#38bdf8', color: '#030712',
              display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: 12
            }}>
              {username[0].toUpperCase()}
            </span>
            your map label: @{username}
          </div>
        )}

        <button
          onClick={handle}
          disabled={loading || !isValid}
          style={{
            width: '100%', padding: '13px 0',
            background: loading || !isValid ? '#1e3a5f' : '#38bdf8',
            color: loading || !isValid ? '#475569' : '#030712',
            border: 'none', borderRadius: 10,
            fontFamily: 'inherit', fontWeight: 700, fontSize: 15,
            cursor: loading || !isValid ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {loading ? 'Setting up...' : 'Enter BuddyUp →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={signOut}
            style={{
              background: 'none', border: 'none',
              color: '#334155', fontSize: 12,
              fontFamily: 'monospace', cursor: 'pointer'
            }}
          >
            wrong account? sign out
          </button>
        </div>
      </div>
    </div>
  )
}
