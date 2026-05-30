import { useStore } from '../lib/store'

const modeIcons = { walking: '🚶', cycling: '🚴' }
const modeLabels = { walking: 'Walk', cycling: 'Cycle' }

export default function RouteCard() {
  const { activeRoute, routeLoading, clearRoute, fetchRoute } = useStore()

  if (!routeLoading && !activeRoute) return null

  return (
    <div style={{
      position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1100, background: 'var(--bg2)',
      border: '1px solid var(--border2)', borderRadius: 14,
      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      animation: 'fadeUp 0.2s ease both', whiteSpace: 'nowrap'
    }}>
      {routeLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          <div style={{
            width: 16, height: 16, border: '2px solid var(--border2)',
            borderTop: '2px solid var(--accent)', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', flexShrink: 0
          }} />
          Finding route...
        </div>
      ) : (
        <>
          {/* Distance */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px' }}>
              {activeRoute.distanceKm} km
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>distance</div>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--border)' }} />

          {/* ETA */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.5px' }}>
              {activeRoute.durationMin} min
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>ETA</div>
          </div>

          <div style={{ width: 1, height: 32, background: 'var(--border)' }} />

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['walking', 'cycling'].map(mode => (
              <button
                key={mode}
                onClick={() => {
                  const dest = window._lastRouteDest
                  if (dest) fetchRoute(dest.lat, dest.lng, mode)
                }}
                style={{
                  padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
                  background: activeRoute.mode === mode ? 'var(--accent)' : 'var(--bg3)',
                  border: `1px solid ${activeRoute.mode === mode ? 'var(--accent)' : 'var(--border2)'}`,
                  color: activeRoute.mode === mode ? '#030712' : 'var(--text2)',
                  fontSize: 13, fontFamily: 'var(--font)', fontWeight: 600,
                  transition: 'all 0.15s'
                }}
              >
                {modeIcons[mode]}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={clearRoute}
            style={{
              width: 28, height: 28, borderRadius: 8, background: 'var(--bg3)',
              border: '1px solid var(--border2)', color: 'var(--text3)',
              cursor: 'pointer', fontSize: 14, display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}
