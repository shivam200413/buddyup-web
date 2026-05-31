import { useState } from 'react'
import { useStore } from '../lib/store'

export default function AuthPage() {
  const [mode, setMode] = useState('signin')   // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signInWithPassword, signUpWithPassword } = useStore()

  const switchMode = (m) => {
    setMode(m); setError(''); setSuccess('')
    setPassword(''); setConfirm('')
  }

  const validate = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Enter a valid email address'
    if (password.length < 6) return 'Password must be at least 6 characters'
    if (mode === 'signup' && password !== confirm) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError(''); setSuccess('')

    if (mode === 'signin') {
      const { error } = await signInWithPassword(email, password)
      setLoading(false)
      if (error) {
        if (error.message.includes('Invalid login credentials'))
          setError('Wrong email or password.')
        else
          setError(error.message)
      }
      // success → onAuthStateChange fires → App re-renders to MapPage automatically
    } else {
      const { data, error } = await signUpWithPassword(email, password)
      setLoading(false)
      if (error) {
        if (error.message.includes('already registered'))
          setError('An account with this email already exists. Sign in instead.')
        else
          setError(error.message)
        return
      }
      if (data?.session) {
        // Email confirmations are OFF — session exists, ProfileSetup shows automatically
        return
      }
      // Email confirmations are ON — tell user to check inbox
      setSuccess(`Confirmation email sent to ${email}. Click the link, then sign in here.`)
      switchMode('signin')
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const inp = {
    width: '100%', background: '#111827',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#f1f5f9',
    fontSize: 15, padding: '12px 14px',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.2s'
  }

  return (
    <div style={{
      minHeight: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#080d14', padding: '24px 20px'
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          fontSize: 42, fontWeight: 800, letterSpacing: '-2px',
          color: '#f1f5f9', marginBottom: 10, lineHeight: 1
        }}>
          BuddyUp
        </div>
        <div style={{
          fontSize: 13, color: '#475569',
          fontFamily: 'monospace', lineHeight: 1.6
        }}>
          find people nearby · right now · no feed · no followers
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#0f1f35',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, overflow: 'hidden'
      }}>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          {['signin', 'signup'].map(m => (
            <button key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                background: mode === m ? '#0f1f35' : '#0a1628',
                color: mode === m ? '#38bdf8' : '#475569',
                borderBottom: mode === m ? '2px solid #38bdf8' : '2px solid transparent',
                transition: 'all 0.15s'
              }}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div style={{ padding: '24px 24px 28px' }}>

          {/* Success message */}
          {success && (
            <div style={{
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: 10, padding: '12px 14px',
              fontSize: 13, color: '#4ade80', marginBottom: 20,
              lineHeight: 1.55, fontFamily: 'monospace'
            }}>
              ✓ {success}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 12, color: '#64748b',
              marginBottom: 7, fontFamily: 'monospace'
            }}>
              Email address
            </label>
            <input
              style={inp}
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={handleKey}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: mode === 'signup' ? 14 : 22, position: 'relative' }}>
            <label style={{
              display: 'block', fontSize: 12, color: '#64748b',
              marginBottom: 7, fontFamily: 'monospace'
            }}>
              Password {mode === 'signup' && <span style={{ color: '#334155' }}>— min 6 characters</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inp, paddingRight: 44 }}
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={handleKey}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#475569', fontSize: 14, padding: 2
                }}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Confirm password — only on signup */}
          {mode === 'signup' && (
            <div style={{ marginBottom: 22 }}>
              <label style={{
                display: 'block', fontSize: 12, color: '#64748b',
                marginBottom: 7, fontFamily: 'monospace'
              }}>
                Confirm password
              </label>
              <input
                style={{
                  ...inp,
                  borderColor: confirm && confirm !== password
                    ? 'rgba(248,113,113,0.5)' : inp.border
                }}
                type={showPass ? 'text' : 'password'} value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                onKeyDown={handleKey}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {confirm && confirm !== password && (
                <div style={{ fontSize: 11, color: '#f87171', marginTop: 5, fontFamily: 'monospace' }}>
                  Passwords don't match
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: 12, color: '#f87171',
              marginBottom: 16, fontFamily: 'monospace', lineHeight: 1.5
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '13px 0',
              background: loading ? '#1e3a5f' : '#38bdf8',
              color: loading ? '#475569' : '#030712',
              border: 'none', borderRadius: 10,
              fontFamily: 'inherit', fontWeight: 700, fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', letterSpacing: '0.2px'
            }}
          >
            {loading
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (mode === 'signin' ? 'Sign In →' : 'Create Account →')
            }
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 0'
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>
              {mode === 'signin' ? "don't have an account?" : 'already have an account?'}
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <button
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{
              width: '100%', marginTop: 10, padding: '11px 0',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, color: '#64748b',
              fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {mode === 'signin' ? 'Create a new account' : 'Sign in to existing account'}
          </button>
        </div>
      </div>

      <div style={{
        marginTop: 28, fontSize: 11, color: '#1e293b',
        fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.8
      }}>
        you disappear when you close the app<br />no tracking · no history · no feed
      </div>
    </div>
  )
}
