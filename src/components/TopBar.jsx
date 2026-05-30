import { useState } from 'react'
import { useStore } from '../lib/store'

export default function TopBar({ nearbyCount, flareCount }) {
  const { profile, signOut, currentActivity, setCurrentActivity } = useStore()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '12px 16px', display: 'flex', alignItems: 'center',
      gap: 10, pointerEvents: 'none'
    }}>
      {/* Logo pill */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '6px 14px',
        fontWeight: 800, fontSize: 15, letterSpacing: '-0.5px',
        pointerEvents: 'auto'
      }}>
        BuddyUp
      </div>

      {/* Stats */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '6px 12px',
        display: 'flex', gap: 12, fontSize: 12, fontFamily: 'var(--mono)',
        pointerEvents: 'auto'
      }}>
        <span>
          <span style={{ color: 'var(--green)' }}>●</span>
          {' '}{nearbyCount} online
        </span>
        <span style={{ color: 'var(--border2)' }}>|</span>
        <span>
          <span style={{ color: 'var(--orange)' }}>🔥</span>
          {' '}{flareCount} flares
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Profile button */}
      <div style={{ position: 'relative', pointerEvents: 'auto' }}>
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', border: 'none',
            color: '#030712', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', top: 44, right: 0, minWidth: 180,
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: 12, padding: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.2s ease both'
          }}>
            <div style={{ padding: '6px 10px', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              @{profile?.username}
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button
              onClick={() => { signOut(); setShowMenu(false) }}
              style={{
                width: '100%', padding: '8px 10px', textAlign: 'left',
                background: 'none', border: 'none', color: 'var(--red)',
                fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer',
                borderRadius: 6
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
