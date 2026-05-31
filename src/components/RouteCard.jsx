import { useStore } from '../lib/store'

const modeConfig = {
  walking: { icon: '🚶', label: 'Walk' },
  cycling: { icon: '🚴', label: 'Cycle' }
}

export default function RouteCard() {
  const { activeRoute, routeLoading, clearRoute, refetchRouteWithMode } = useStore()

  if (!routeLoading && !activeRoute) return null

  return (
    <div style={{
      position: 'absolute', top: 72, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1100, background: 'var(--bg2)',
      border: '1px solid var(--border2)', borderRadius: 14,
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      animation: 'fadeUp 0.2s ease both',
      whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)'
    }}>
      {routeLoading ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 13
        }}>
          <div style={{
            width: 16, height: 16,
            border: '2px solid var(--border2)',
            borderTop: '2px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0
          }} />
          Finding route...
        </div>
      ) : (
        <>
          <Stat value={`${activeRoute.distanceKm} km`} label="distance" color="var(--accent)" />
          <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
          <Stat value={`${activeRoute.durationMin} min`} label="ETA" color="var(--green)" />
          <div style={{ width: 1, height: 32, background: 'var(--border)' }} />

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(modeConfig).map(([mode, cfg]) => (
              <button
                key={mode}
                onClick={() => refetchRouteWithMode(mode)}
                title={cfg.label}
                style={{
                  width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                  fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: activeRoute.mode === mode
                    ? 'rgba(56,189,248,0.15)' : 'var(--bg3)',
                  border: activeRoute.mode === mode
                    ? '1px solid rgba(56,189,248,0.4)' : '1px solid var(--border)',
                  transition: 'all 0.15s'
                }}
              >
                {cfg.icon}
              </button>
            ))}
          </div>

          <button
            onClick={clearRoute}
            title="Clear route"
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text3)', cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  )
}

function Stat({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 17, fontWeight: 800,
        color, letterSpacing: '-0.5px', lineHeight: 1
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, color: 'var(--text3)',
        fontFamily: 'var(--mono)', marginTop: 2
      }}>
        {label}
      </div>
    </div>
  )
}
