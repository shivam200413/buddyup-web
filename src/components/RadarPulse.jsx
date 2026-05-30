export default function RadarPulse({ active }) {
  return (
    <div style={{
      position: 'absolute', bottom: 90, left: 24, zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'var(--bg2)', border: '1px solid var(--border2)',
      borderRadius: 20, padding: '5px 10px 5px 8px',
      pointerEvents: 'none'
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? 'var(--green)' : 'var(--text3)',
        boxShadow: active ? '0 0 6px var(--green)' : 'none',
        transition: 'all 0.3s'
      }} />
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>
        {active ? 'live' : 'paused'}
      </span>
    </div>
  )
}
