export default function LoadingScreen() {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'var(--bg)'
    }}>
      <div style={{
        width: 48, height: 48, border: '2px solid var(--border2)',
        borderTop: '2px solid var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        initializing...
      </span>
    </div>
  )
}
