export default function LoadingScreen() {
  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, background: '#080d14'
    }}>
      <div style={{
        fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#f1f5f9'
      }}>
        BuddyUp
      </div>
      <div style={{
        width: 32, height: 32,
        border: '2px solid rgba(255,255,255,0.08)',
        borderTop: '2px solid #38bdf8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
