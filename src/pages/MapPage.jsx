import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useStore } from '../lib/store'
import FlareMarkers from '../components/FlareMarkers'
import BuddyMarkers from '../components/BuddyMarkers'
import UserMarker from '../components/UserMarker'
import RouteOverlay from '../components/RouteOverlay'
import TopBar from '../components/TopBar'
import DropFlareSheet from '../components/DropFlareSheet'
import FlareDetailSheet from '../components/FlareDetailSheet'
import ChatWindow from '../components/ChatWindow'
import ChatbotPage from '../components/ChatbotPage'
import RouteCard from '../components/RouteCard'
import RadarPulse from '../components/RadarPulse'

function MapController({ position }) {
  const map = useMap()
  const centered = useRef(false)
  useEffect(() => {
    if (position && !centered.current) {
      map.setView([position.lat, position.lng], 15, { animate: true })
      centered.current = true
    }
  }, [position])
  return null
}

export default function MapPage() {
  const {
    startSession, stopSession,
    position, locationError,
    profile, nearbyUsers, flares,
    conversations, activeChatFlareId
  } = useStore()

  const [showDropSheet, setShowDropSheet] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [appState, setAppState] = useState('active')

  // Count total unread DMs
  const totalUnread = Object.values(conversations).reduce((sum, c) => sum + (c.unread || 0), 0)

  useEffect(() => {
    startSession()
    const handleVisibility = () => {
      if (document.hidden) { stopSession(); setAppState('paused') }
      else { startSession(); setAppState('active') }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      stopSession()
    }
  }, [])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <MapContainer
        center={[26.1445, 91.7362]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
          maxZoom={19}
        />
        <MapController position={position} />
        {position && <UserMarker position={position} />}
        <FlareMarkers />
        <BuddyMarkers />
        <RouteOverlay />
      </MapContainer>

      {/* ── UI Overlays ───────────────────────────────────────────────────── */}
      <TopBar nearbyCount={nearbyUsers.length} flareCount={flares.length} />
      <RouteCard />
      <RadarPulse active={appState === 'active'} />

      {/* Location error */}
      {locationError && (
        <div style={{
          position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 8,
          padding: '8px 16px', fontSize: 12, fontFamily: 'var(--mono)',
          color: '#fca5a5', zIndex: 1000, whiteSpace: 'nowrap'
        }}>
          ⚠ {locationError} — allow location access
        </div>
      )}

      {/* Background mode */}
      {appState === 'paused' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(8,13,20,0.92)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 2000, gap: 12
        }}>
          <div style={{ fontSize: 32 }}>👻</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>You're invisible</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)', textAlign: 'center', maxWidth: 260 }}>
            app is in background · you've left the radar
          </div>
        </div>
      )}

      {/* ── Bottom Navigation Bar ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999,
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '8px 16px 20px',
        gap: 8
      }}>
        {/* Recenter */}
        <NavBtn
          icon="◎"
          label="Recenter"
          onClick={() => {
            if (position) {
              const map = document.querySelector('.leaflet-container')?._leaflet_map
              if (map) map.setView([position.lat, position.lng], 15, { animate: true })
            }
          }}
        />

        {/* Chatbot */}
        <NavBtn
          icon="🤖"
          label="BuddyBot"
          onClick={() => setShowChatbot(true)}
          active={showChatbot}
        />

        {/* Drop Flare — centre, prominent */}
        <button
          onClick={() => setShowDropSheet(true)}
          style={{
            flex: '0 0 auto', width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent)', border: 'none',
            fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 0 rgba(56,189,248,0.4)',
            animation: 'fab-pulse 2.5s ease infinite',
            margin: '0 4px'
          }}
          title="Drop a Flare"
        >
          🔥
        </button>

        {/* Messages */}
        <NavBtn
          icon="💬"
          label="Messages"
          badge={totalUnread > 0 ? totalUnread : null}
          onClick={() => {
            // Open most recent conversation or prompt user to join a flare
            const convs = Object.values(conversations)
            if (convs.length > 0) {
              useStore.getState().openChat(convs[convs.length - 1].flare)
            } else {
              alert('Tap a flare on the map and press "Chat" to start a conversation!')
            }
          }}
          active={!!activeChatFlareId}
        />

        {/* Flares list shortcut */}
        <NavBtn
          icon="📋"
          label="Flares"
          badge={flares.length > 0 ? flares.length : null}
          onClick={() => {
            // Zoom map to show all flares
            const map = document.querySelector('.leaflet-container')?._leaflet_map
            if (map && flares.length > 0) {
              try {
                const coords = flares.map(f => {
                  const g = JSON.parse(f.geojson)
                  return [g.coordinates[1], g.coordinates[0]]
                })
                if (coords.length === 1) map.setView(coords[0], 15, { animate: true })
                else map.fitBounds(coords, { padding: [60, 60], animate: true })
              } catch {}
            }
          }}
        />
      </div>

      {/* ── Sheets & Modals ───────────────────────────────────────────────── */}
      {showDropSheet && <DropFlareSheet onClose={() => setShowDropSheet(false)} />}
      <FlareDetailSheet />
      {activeChatFlareId && <ChatWindow />}
      {showChatbot && <ChatbotPage onClose={() => setShowChatbot(false)} />}

      <style>{`
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.4); }
          50%       { box-shadow: 0 0 0 10px rgba(56,189,248,0); }
        }
      `}</style>
    </div>
  )
}

function NavBtn({ icon, label, badge, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, height: 48, borderRadius: 12, cursor: 'pointer',
        background: active ? 'rgba(56,189,248,0.1)' : 'transparent',
        border: active ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 2, position: 'relative',
        transition: 'all 0.15s'
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 9, color: active ? 'var(--accent)' : 'var(--text3)', fontFamily: 'var(--mono)' }}>
        {label}
      </span>
      {badge && (
        <div style={{
          position: 'absolute', top: 6, right: 8,
          background: 'var(--red)', color: 'white',
          borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)'
        }}>
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </button>
  )
}
