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
    transition: 'border-color 0.2s', boxSizing: 'border-box'
  },
  btn: {
    width: '100%', padding: '11px 0',
    background: 'var(--accent)', color: '#030712',
    border: 'none', borderRadius: 8, fontFamily: 'var(--font)',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    transition: 'opacity 0.2s', marginBottom: 0
  },
  btnGhost: {
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
  step: {
    fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 20
  },
  successBox: {
    background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 10, padding: '16px', textAlign: 'center'
  }
}

export default function AuthPage() {
  // modes: 'choose' | 'magic' | 'magic-sent' | 'signin' | 'signup' | 'signup-confirm'
  const [step, setStep] = useState('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { sendMagicLink, signInWithPassword, signUpWithPassword } = useStore()

  const reset = (newStep) => { setError(''); setStep(newStep) }

  // ── Magic link ────────────────────────────────────────────────────────────
  const handleMagicLink = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true); setError('')
    const { error } = await sendMagicLink(email)
    setLoading(false)
    if (error) setError(error.message)
    else setStep('magic-sent')
  }

  // ── Password sign in ──────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    // On success, onAuthStateChange in store handles navigation automatically
    if (error) setError(error.message)
  }

  // ── Password sign up ──────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const { data, error } = await signUpWithPassword(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }

    // If Supabase email confirmations are ON → show confirm screen
    // If confirmations are OFF → session is created immediately → onAuthStateChange handles it
    if (data?.session) {
      // Confirmation disabled — session exists, ProfileSetup will show automatically
      return
    }
    // Confirmation enabled — user needs to click email link
    setStep('signup-confirm')
  }

  return (
    <div style={s.page}>
      <div style={s.logo}>BuddyUp</div>
      <div style={s.sub}>find people nearby · right now · no feed · no followers</div>

      <div style={s.card}>

        {/* ── Choose method ──────────────────────────────────────────────── */}
        {step === 'choose' && (
          <>
            <div style={s.step}>sign in or create account</div>
            <button style={s.btn} onClick={() => reset('magic')}>
              ✉ Continue with Magic Link
            </button>
            <button style={s.btnGhost} onClick={() => reset('signin')}>
              🔑 Sign in with Password
            </button>
            <button style={s.btnGhost} onClick={() => reset('signup')}>
              ✨ Create New Account
            </button>
          </>
        )}

        {/* ── Magic link entry ───────────────────────────────────────────── */}
        {step === 'magic' && (
          <>
            <div style={s.step}>magic link — no password needed</div>
            <label style={s.label}>Email</label>
            <input
              style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
              placeholder="you@example.com" autoComplete="email"
            />
            <button style={s.btn} onClick={handleMagicLink} disabled={loading}>
              {loading ? 'Sending...' : '✉ Send Magic Link →'}
            </button>
            <button style={s.btnGhost} onClick={() => reset('choose')}>← Back</button>
          </>
        )}

        {/* ── Magic link sent ────────────────────────────────────────────── */}
        {step === 'magic-sent' && (
          <div style={s.successBox}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📬</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Check your inbox</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', lineHeight: 1.7 }}>
              We sent a login link to<br />
              <span style={{ color: 'var(--accent)' }}>{email}</span><br /><br />
              Click the link in the email — it will open BuddyUp and log you in automatically.
            </div>
            <button style={{ ...s.btnGhost, marginTop: 16 }} onClick={() => reset('choose')}>
              ← Use a different method
            </button>
          </div>
        )}

        {/* ── Sign in ────────────────────────────────────────────────────── */}
        {step === 'signin' && (
          <>
            <div style={s.step}>sign in to your account</div>
            <label style={s.label}>Email</label>
            <input
              style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
            <label style={s.label}>Password</label>
            <input
              style={s.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="••••••••" autoComplete="current-password"
            />
            <button style={s.btn} onClick={handleSignIn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
            <button style={s.btnGhost} onClick={() => reset('choose')}>← Back</button>
          </>
        )}

        {/* ── Sign up ────────────────────────────────────────────────────── */}
        {step === 'signup' && (
          <>
            <div style={s.step}>create a new account</div>
            <label style={s.label}>Email</label>
            <input
              style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
            />
            <label style={s.label}>Password</label>
            <input
              style={s.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignUp()}
              placeholder="min 6 characters" autoComplete="new-password"
            />
            <button style={s.btn} onClick={handleSignUp} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
            <button style={s.btnGhost} onClick={() => reset('choose')}>← Back</button>
          </>
        )}

        {/* ── Signup confirm email ───────────────────────────────────────── */}
        {step === 'signup-confirm' && (
          <div style={s.successBox}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📩</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Confirm your email</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', lineHeight: 1.7 }}>
              We sent a confirmation link to<br />
              <span style={{ color: 'var(--accent)' }}>{email}</span><br /><br />
              Click the link in the email to activate your account, then come back here and sign in.
            </div>
            <button style={{ ...s.btn, marginTop: 16 }} onClick={() => reset('signin')}>
              → Go to Sign In
            </button>
          </div>
        )}

        {error && <div style={s.err}>{error}</div>}
      </div>

      <div style={{ marginTop: 32, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', textAlign: 'center' }}>
        you disappear when you close the app · no tracking · no history
      </div>
    </div>
  )
}
