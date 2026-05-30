import { useState } from 'react'
import { useStore } from '../lib/store'

export default function ProfileSetup() {
  const { createProfile, signOut } = useStore()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    if (username.length < 3) { setError('Must be at least 3 characters'); return }
    if (!/^[a-z0-9_]+$/.test(username)) { setError('Lowercase letters, numbers, _ only'); return }
    setLoading(true); setError('')
    const { error } = await createProfile(username)
    setLoading(false)
    if (error) setError(error.message || 'Username taken, try another')
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
      <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 40 }}>
        you're in — pick a username to continue
      </div>

      <div style={{
        width: '100%', maxWidth: 340,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24,
        animation: 'fadeUp 0.3s ease both'
      }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
          this is how others see you on the map
        </div>

        <label style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: 'block' }}>
          Username
        </label>
        <input
          type="text" value={username}
          onChange={e => setUsername(e.target.value.toLowerCase())}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="eg. ravi_runs"
          style={{
            width: '100%', background: 'var(--bg3)',
            border: '1px solid var(--border2)', borderRadius: 8,
            color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 15,
            padding: '10px 14px', outline: 'none', marginBottom: 16
          }}
        />

        <button
          onClick={handle} disabled={loading}
          style={{
            width: '100%', padding: '11px 0',
            background: loading ? 'var(--bg4)' : 'var(--accent)',
            color: loading ? 'var(--text3)' : '#030712',
            border: 'none', borderRadius: 8, fontFamily: 'var(--font)',
            fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Setting up...' : 'Enter BuddyUp →'}
        </button>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 12, fontFamily: 'var(--mono)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span
            onClick={signOut}
            style={{ fontSize: 11, color: 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--mono)' }}
          >
            wrong account? sign out
          </span>
        </div>
      </div>
    </div>
  )
}
