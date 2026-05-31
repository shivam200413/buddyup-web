import { useState, useRef, useEffect } from 'react'
import { useStore } from '../lib/store'

export default function TopBar({ nearbyCount, flareCount }) {
  const { profile, signOut } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setShowMenu(false)
    await signOut()
  }

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
      // NOTE: pointerEvents none on outer div, 'auto' on each interactive child
      pointerEvents: 'none'
    }}>

      {/* Logo */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '7px 14px',
        fontWeight: 800, fontSize: 15, letterSpacing: '-0.5px',
        pointerEvents: 'auto',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
      }}>
        BuddyUp
      </div>

      {/* Stats pill */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '7px 12px',
        display: 'flex', gap: 10, fontSize: 12, fontFamily: 'var(--mono)',
        pointerEvents: 'auto', alignItems: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
            background: nearbyCount > 0 ? 'var(--green)' : 'var(--text3)',
            boxShadow: nearbyCount > 0 ? '0 0 6px var(--green)' : 'none',
            animation: nearbyCount > 0 ? 'blink 2s ease infinite' : 'none'
          }} />
          <span style={{ color: nearbyCount > 0 ? 'var(--text)' : 'var(--text3)' }}>
            {nearbyCount} online
          </span>
        </span>
        <span style={{ color: 'var(--border2)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>🔥</span>
          <span style={{ color: flareCount > 0 ? 'var(--orange)' : 'var(--text3)' }}>
            {flareCount} flares
          </span>
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Profile avatar + dropdown */}
      <div
        ref={menuRef}
        style={{ position: 'relative', pointerEvents: 'auto' }}
      >
        {/* Avatar button */}
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--accent)', border: '2px solid rgba(56,189,248,0.4)',
            color: '#030712', fontWeight: 800, fontSize: 15,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(56,189,248,0.3)',
            // Explicitly set pointerEvents auto on button too
            pointerEvents: 'auto'
          }}
        >
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div style={{
            position: 'absolute', top: 46, right: 0, minWidth: 180,
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 12, padding: 6,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            animation: 'fadeUp 0.15s ease both',
            // Critical: ensure dropdown is clickable
            pointerEvents: 'auto',
            zIndex: 1100
          }}>
            {/* Username row */}
            <div style={{
              padding: '8px 12px 10px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 4
            }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 3 }}>
                signed in as
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                @{profile?.username}
              </div>
            </div>

            {/* Sign out button */}
            <button
              onMouseDown={handleSignOut}  /* mousedown fires before blur closes the menu */
              style={{
                width: '100%', padding: '9px 12px',
                textAlign: 'left', background: 'none',
                border: 'none', color: 'var(--red)',
                fontFamily: 'var(--font)', fontSize: 13,
                cursor: 'pointer', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.1s',
                pointerEvents: 'auto'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span>→</span> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
