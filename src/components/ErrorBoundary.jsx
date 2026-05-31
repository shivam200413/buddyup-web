import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('BuddyUp render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#080d14', padding: 32, gap: 16
        }}>
          <div style={{ fontSize: 36 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
            Something went wrong
          </div>
          <div style={{
            fontSize: 12, color: '#475569', fontFamily: 'monospace',
            textAlign: 'center', lineHeight: 1.6, maxWidth: 300
          }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: '10px 24px',
              background: '#38bdf8', color: '#030712',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: 'pointer'
            }}
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
