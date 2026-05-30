import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'

export default function ProfileSetup() {
  const { createProfile, signOut, fetchProfile, session } = useStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  // Re-check if profile was already created (e.g. after magic link redirect)
  useEffect(() => {
    const recheck = async () => {
      if (session?.user?.id) {
        await fetchProfile(session.user.id)
      }
      setChecking(false)
    }
    recheck()
  }, [session])

  if (checking) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)', gap: 12,
        flexDirection: 'column'
      }}>
        <div style={{
          width: 36, height: 36, border: '2px solid var(--border2)',
          borderTop: '2px solid var(--accent)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
          loading your profile...
        </span>
      </div>
    )
  }

  const handle = async () => {
    if (username.length < 3) { setError('Must be at least 3 characters'); return }
    if (!/^[a-z0-9_]+$/.test(username)) { setError('Lowercase letters, numbers and _ only'); return }
    setLoading(true); setError('')
    const { error } = await createProfile(username)
    setLoading(false)
    if (error) setError(error.message || 'Username taken, try another')
    // On success, store sets profile → App.jsx re-renders to MapPage automatically
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24
    }}>
      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-2px', marginBottom: 8 }}>
        BuddyUp
      </div>
      <div style={{
        fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)',
        marginBottom: 40, textAlign: 'center'
      }}>
        one last step — pick your username
      </div>

      <div style={{
        width: '100%', maxWidth: 340,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24,
        animation: 'fadeUp 0.3s ease both'
      }}>
        <div style={{
          fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 16
        }}>
          this is how others see you on the map
        </div>

        <label style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: 'block' }}>
          Username
        </label>
        <input
          type="text" value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="eg. shiva_runs"
          autoFocus
          style={{
            width: '100%', background: 'var(--bg3)',
            border: '1px solid var(--border2)', borderRadius: 8,
            color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 15,
            padding: '10px 14px', outline: 'none', marginBottom: 6,
            boxSizing: 'border-box'
          }}
        />
        <div style={{
          fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)',
          marginBottom: 16
        }}>
          lowercase letters, numbers and _ only
        </div>

        <button
          onClick={handle} disabled={loading || username.length < 3}
          style={{
            width: '100%', padding: '11px 0',
            background: loading || username.length < 3 ? 'var(--bg4)' : 'var(--accent)',
            color: loading || username.length < 3 ? 'var(--text3)' : '#030712',
            border: 'none', borderRadius: 8, fontFamily: 'var(--font)',
            fontWeight: 700, fontSize: 14,
            cursor: loading || username.length < 3 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? 'Setting up...' : 'Enter BuddyUp →'}
        </button>

        {error && (
          <div style={{
            fontSize: 12, color: 'var(--red)', marginTop: 12,
            fontFamily: 'var(--mono)', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span
            onClick={signOut}
            style={{
              fontSize: 11, color: 'var(--text3)',
              cursor: 'pointer', fontFamily: 'var(--mono)'
            }}
          >
            wrong account? sign out
          </span>
        </div>
      </div>
    </div>
  )
}
