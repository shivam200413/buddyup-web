import { useState } from 'react'
import { useStore } from '../lib/store'

const s = {
  page: {
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)', padding: 24, gap: 0
  },
  logo: {
    fontSize: 40, fontWeight: 800, letterSpacing: '-2px',
    color: 'var(--text)', marginBottom: 8
  },
  sub: {
    fontSize: 14, color: 'var(--text3)', fontFamily: 'var(--mono)',
    marginBottom: 48, textAlign: 'center'
  },
  card: {
    width: '100%', maxWidth: 360,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 28,
    animation: 'fadeUp 0.4s ease both'
  },
  label: { fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: 'block' },
  input: {
    width: '100%', background: 'var(--bg3)',
    border: '1px solid var(--border2)', borderRadius: 8,
    color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 15,
    padding: '10px 14px', outline: 'none', marginBottom: 16,
    transition: 'border-color 0.2s'
  },
  btn: {
    width: '100%', padding: '11px 0',
    background: 'var(--accent)', color: '#030712',
    border: 'none', borderRadius: 8, fontFamily: 'var(--font)',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.1s'
  },
  btnSecondary: {
    width: '100%', padding: '11px 0',
    background: 'var(--bg3)', color: 'var(--text2)',
    border: '1px solid var(--border2)', borderRadius: 8,
    fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', marginTop: 8
  },
  err: {
    fontSize: 12, color: 'var(--red)', marginTop: 12,
    fontFamily: 'var(--mono)', textAlign: 'center'
  },
  step: { fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 20 },
  successBox: {
    background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 10, padding: '14px 16px', textAlign: 'center'
  }
}

export default function AuthPage() {
  // step: 'email' | 'sent' | 'profile'
  const [step, setStep] = useState('email')
  const [mode, setMode] = useState('magic') // 'magic' | 'password'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { sendMagicLink, signInWithPassword, signUpWithPassword, createProfile } = useStore()

  const handleMagicLink = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true); setError('')
    const { error } = await sendMagicLink(email)
    setLoading(false)
    if (error) setError(error.message)
    else setStep('sent')
  }

  const handlePasswordAuth = async (isSignUp) => {
    if (!email.includes('@')) { setError('Enter a valid email address'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const fn = isSignUp ? signUpWithPassword : signInWithPassword
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else if (isSignUp) setStep('profile')
    // sign-in success is handled by onAuthStateChange in store → auto-navigates
  }

  const handleProfile = async () => {
    if (username.length < 3) { setError('Username must be at least 3 chars'); return }
    if (!/^[a-z0-9_]+$/.test(username)) { setError('Lowercase letters, numbers, _ only'); return }
    setLoading(true); setError('')
    const { error } = await createProfile(username)
    setLoading(false)
    if (error) setError(error.message || 'Username taken, try another')
  }

  return (
    <div style={s.page}>
      <div style={s.logo}>BuddyUp</div>
      <div style={s.sub}>find people nearby · right now · no feed · no followers</div>

      <div style={s.card}>

        {/* ── Email entry ─────────────────────────────── */}
        {step === 'email' && (
          <>
            <div style={s.step}>
              {mode === 'magic' ? 'sign in with magic link — no password needed' : 'sign in / sign up with email'}
            </div>

            <label style={s.label}>Email</label>
            <input
              style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'magic' ? handleMagicLink() : null)}
              placeholder="you@example.com"
              autoComplete="email"
            />

            {mode === 'password' && (
              <>
                <label style={s.label}>Password</label>
                <input
                  style={s.input} type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </>
            )}

            {mode === 'magic' ? (
              <>
                <button style={s.btn} onClick={handleMagicLink} disabled={loading}>
                  {loading ? 'Sending link...' : '✉ Send Magic Link →'}
                </button>
                <button style={s.btnSecondary} onClick={() => { setMode('password'); setError('') }}>
                  Use password instead
                </button>
              </>
            ) : (
              <>
                <button style={s.btn} onClick={() => handlePasswordAuth(false)} disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In →'}
                </button>
                <button style={s.btn} onClick={() => handlePasswordAuth(true)} disabled={loading}
                  style={{ ...s.btn, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border2)', marginTop: 8 }}>
                  {loading ? '...' : 'Create Account →'}
                </button>
                <button style={s.btnSecondary} onClick={() => { setMode('magic'); setError('') }}>
                  Use magic link instead
                </button>
              </>
            )}
          </>
        )}

        {/* ── Magic link sent ─────────────────────────── */}
        {step === 'sent' && (
          <div style={s.successBox}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📬</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              Check your inbox
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
              We sent a login link to<br />
              <span style={{ color: 'var(--accent)' }}>{email}</span><br /><br />
              Click the link in that email — it opens BuddyUp and logs you in automatically.
            </div>
            <button
              style={{ ...s.btnSecondary, marginTop: 16 }}
              onClick={() => { setStep('email'); setError('') }}
            >
              ← Use a different email
            </button>
          </div>
        )}

        {/* ── Pick username ───────────────────────────── */}
        {step === 'profile' && (
          <>
            <div style={s.step}>one last thing — pick a username</div>
            <label style={s.label}>Username</label>
            <input
              style={s.input} type="text" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              onKeyDown={e => e.key === 'Enter' && handleProfile()}
              placeholder="eg. ravi_runs"
            />
            <button style={s.btn} onClick={handleProfile} disabled={loading}>
              {loading ? 'Creating...' : 'Enter BuddyUp →'}
            </button>
          </>
        )}

        {error && <div style={s.err}>{error}</div>}
      </div>

      <div style={{ marginTop: 32, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textAlign: 'center' }}>
        you disappear when you close the app · no tracking · no history
      </div>
    </div>
  )
}
