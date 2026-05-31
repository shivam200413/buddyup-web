import { useEffect, useRef, useState, useCallback } from 'react'
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

// Centers map on first GPS fix
function MapController({ position }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (position && !done.current) {
      map.setView([position.lat, position.lng], 15, { animate: true })
      done.current = true
    }
  }, [position])
  return null
}

// Recenter button — lives inside MapContainer so it can use useMap()
function RecenterBtn({ position }) {
  const map = useMap()
  if (!position) return null
  return (
    <button
      onClick={() => map.setView([position.lat, position.lng], 15, { animate: true })}
      title="Re-center on my location"
      style={{
        position: 'absolute', bottom: 88, right: 14, zIndex: 999,
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        color: 'var(--text)', fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)'
      }}
    >
      ◎
    </button>
  )
}

export default function MapPage() {
  const {
    startSession, stopSession,
    position, locationError,
    nearbyUsers, flares,
    conversations, activeChatFlareId
  } = useStore()

  const [showDropSheet, setShowDropSheet] = useState(false)
  const [showChatbot,   setShowChatbot]   = useState(false)
  const [appState,      setAppState]      = useState('active')

  const totalUnread = Object.values(conversations)
    .reduce((sum, c) => sum + (c.unread || 0), 0)

  useEffect(() => {
    startSession()

    const handleVisibility = () => {
      if (document.hidden) {
        stopSession()
        setAppState('paused')
      } else {
        startSession()
        setAppState('active')
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      stopSession()
    }
  }, [])

  const openMessages = useCallback(() => {
    const convs = Object.values(conversations)
    if (convs.length > 0) {
      useStore.getState().openChat(convs[convs.length - 1].flare)
    }
    // No alert — just silently do nothing if no conversations yet
  }, [conversations])

  const zoomToFlares = useCallback(() => {
    if (!flares.length) return
    try {
      const map = document.querySelector('.leaflet-container')?._leaflet_map
      if (!map) return
      const coords = flares.map(f => {
        const g = JSON.parse(f.geojson)
        return [g.coordinates[1], g.coordinates[0]]
      })
      if (coords.length === 1) map.setView(coords[0], 15, { animate: true })
      else map.fitBounds(coords, { padding: [70, 70], animate: true })
    } catch (_) {}
  }, [flares])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <MapContainer
        center={[26.1445, 91.7362]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          keepBuffer={4}
        />
        <MapController position={position} />
        <UserMarker position={position} />
        <FlareMarkers />
        <BuddyMarkers />
        <RouteOverlay />
        <RecenterBtn position={position} />
      </MapContainer>

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      <TopBar nearbyCount={nearbyUsers.length} flareCount={flares.length} />
      <RouteCard />
      <RadarPulse active={appState === 'active'} />

      {/* Location error banner */}
      {locationError && (
        <div style={{
          position: 'absolute', top: 70, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(127,29,29,0.95)',
          border: '1px solid rgba(239,68,68,0.5)',
          borderRadius: 10, padding: '8px 16px',
          fontSize: 12, fontFamily: 'var(--mono)',
          color: '#fca5a5', zIndex: 1000,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}>
          ⚠ {locationError}
        </div>
      )}

      {/* Background / invisible overlay */}
      {appState === 'paused' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(8,13,20,0.95)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, gap: 14
        }}>
          <div style={{ fontSize: 40 }}>👻</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            You're invisible
          </div>
          <div style={{
            fontSize: 13, color: 'var(--text3)',
            fontFamily: 'var(--mono)', textAlign: 'center',
            maxWidth: 240, lineHeight: 1.7
          }}>
            app is in background<br />you've left the radar
          </div>
          <button
            onClick={() => { startSession(); setAppState('active') }}
            style={{
              marginTop: 8, padding: '10px 24px',
              background: 'var(--accent)', color: '#030712',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: 'pointer'
            }}
          >
            Rejoin radar
          </button>
        </div>
      )}

      {/* ── Bottom nav ────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 999, height: 'var(--nav-h)',
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border2)',
        display: 'flex', alignItems: 'center',
        padding: '0 8px env(safe-area-inset-bottom, 8px)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.5)'
      }}>
        <NavBtn
          icon="◎" label="Recenter"
          onClick={() => {
            const map = document.querySelector('.leaflet-container')?._leaflet_map
            if (map && position) map.setView([position.lat, position.lng], 15, { animate: true })
          }}
        />
        <NavBtn
          icon="🤖" label="BuddyBot"
          active={showChatbot}
          onClick={() => setShowChatbot(true)}
        />

        {/* Centre FAB */}
        <button
          onClick={() => setShowDropSheet(true)}
          style={{
            flex: '0 0 auto', width: 58, height: 58,
            borderRadius: '50%', background: 'var(--accent)',
            border: '3px solid var(--bg2)', fontSize: 24,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 6px', flexShrink: 0,
            animation: 'fab-pulse 2.5s ease infinite',
            boxShadow: '0 4px 20px rgba(56,189,248,0.45)'
          }}
          title="Drop a Flare"
        >
          🔥
        </button>

        <NavBtn
          icon="💬" label="Messages"
          active={!!activeChatFlareId}
          badge={totalUnread || null}
          onClick={openMessages}
        />
        <NavBtn
          icon="📋" label="Flares"
          badge={flares.filter(f => !f._pending).length || null}
          onClick={zoomToFlares}
        />
      </nav>

      {/* ── Sheets ────────────────────────────────────────────────────────── */}
      {showDropSheet     && <DropFlareSheet   onClose={() => setShowDropSheet(false)} />}
      {activeChatFlareId && <ChatWindow />}
      {showChatbot       && <ChatbotPage      onClose={() => setShowChatbot(false)} />}
      <FlareDetailSheet />
    </div>
  )
}

function NavBtn({ icon, label, badge, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, height: 52, borderRadius: 12,
        cursor: 'pointer', position: 'relative',
        background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
        border: active ? '1px solid rgba(56,189,248,0.25)' : '1px solid transparent',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        transition: 'background 0.15s, border-color 0.15s'
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 500,
        color: active ? 'var(--accent)' : 'var(--text2)',
        letterSpacing: '0.3px'
      }}>
        {label}
      </span>
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: 7, right: 10,
          background: 'var(--red)', color: 'white',
          borderRadius: '50%', minWidth: 17, height: 17,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
          border: '2px solid var(--bg2)', padding: '0 2px'
        }}>
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </button>
  )
}
