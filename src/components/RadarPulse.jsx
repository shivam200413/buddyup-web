export default function RadarPulse({ active }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(var(--nav-h) + 12px)',
      left: 14, zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'var(--bg2)',
      border: '1px solid var(--border2)',
      borderRadius: 20, padding: '5px 12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      pointerEvents: 'none'
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: active ? 'var(--green)' : 'var(--text3)',
        boxShadow: active ? '0 0 6px var(--green)' : 'none',
        animation: active ? 'blink 2s ease infinite' : 'none',
        transition: 'all 0.3s', flexShrink: 0
      }} />
      <span style={{
        fontSize: 11, fontFamily: 'var(--mono)',
        color: active ? 'var(--text2)' : 'var(--text3)',
        fontWeight: 500
      }}>
        {active ? 'live' : 'paused'}
      </span>
    </div>
  )
}
