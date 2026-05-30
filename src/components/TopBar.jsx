import { useState, useRef, useEffect } from 'react'
import { useStore } from '../lib/store'

export default function TopBar({ nearbyCount, flareCount }) {
  const { profile, signOut } = useStore()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
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

      {/* Stats */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '7px 12px',
        display: 'flex', gap: 10, fontSize: 12, fontFamily: 'var(--mono)',
        pointerEvents: 'auto', alignItems: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
      }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: nearbyCount > 0 ? 'var(--green)' : 'var(--text3)',
            display: 'inline-block',
            boxShadow: nearbyCount > 0 ? '0 0 6px var(--green)' : 'none'
          }} />
          <span style={{ color: nearbyCount > 0 ? 'var(--text)' : 'var(--text3)' }}>
            {nearbyCount} online
          </span>
        </span>
        <span style={{ color: 'var(--border2)' }}>|</span>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span>🔥</span>
          <span style={{ color: flareCount > 0 ? 'var(--orange)' : 'var(--text3)' }}>
            {flareCount} flares
          </span>
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Profile */}
      <div ref={menuRef} style={{ position: 'relative', pointerEvents: 'auto' }}>
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--accent)', border: '2px solid rgba(56,189,248,0.4)',
            color: '#030712', fontWeight: 800, fontSize: 15,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(56,189,248,0.3)'
          }}
        >
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', top: 46, right: 0, minWidth: 170,
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 12, padding: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            animation: 'fadeUp 0.15s ease both'
          }}>
            <div style={{
              padding: '6px 10px 10px', fontSize: 12,
              color: 'var(--text3)', fontFamily: 'var(--mono)',
              borderBottom: '1px solid var(--border)', marginBottom: 4
            }}>
              signed in as<br />
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>@{profile?.username}</span>
            </div>
            <button
              onClick={() => { signOut(); setShowMenu(false) }}
              style={{
                width: '100%', padding: '8px 10px', textAlign: 'left',
                background: 'none', border: 'none', color: 'var(--red)',
                fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer',
                borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              ← Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
