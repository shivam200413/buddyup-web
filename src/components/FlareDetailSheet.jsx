import { useState } from 'react'
import { useStore } from '../lib/store'
import { getActivity } from '../lib/supabase'

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date()
  if (diff <= 0) return 'expired'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m left`
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`
}

export default function FlareDetailSheet() {
  const {
    selectedFlare, setSelectedFlare,
    joinFlare, session,
    openChat, fetchRoute, routeLoading
  } = useStore()

  const [joining, setJoining] = useState(false)
  const [joined,  setJoined]  = useState(false)
  const [error,   setError]   = useState('')

  if (!selectedFlare) return null

  const a = getActivity(selectedFlare.activity_type)
  const isOwn = selectedFlare.host_id === session?.user?.id

  let destLat = null, destLng = null
  try {
    const geo = JSON.parse(selectedFlare.geojson)
    destLng = geo.coordinates[0]
    destLat = geo.coordinates[1]
  } catch (_) {}

  const handleJoin = async () => {
    setJoining(true); setError('')
    const { error } = await joinFlare(selectedFlare.id)
    setJoining(false)
    if (error) {
      if (error.code === '23505')
        setError('You already joined this flare.')
      else
        setError(error.message || 'Something went wrong')
    } else {
      setJoined(true)
    }
  }

  const handleRoute = () => {
    if (destLat !== null && destLng !== null) {
      fetchRoute(destLat, destLng, 'walking')
      setSelectedFlare(null)
    }
  }

  const handleChat = () => {
    openChat(selectedFlare)
    setSelectedFlare(null)
  }

  return (
    <>
      <div
        onClick={() => setSelectedFlare(null)}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 1500, backdropFilter: 'blur(2px)'
        }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 1600, background: 'var(--bg2)',
        borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border2)', borderBottom: 'none',
        padding: '20px 20px 40px',
        animation: 'fadeUp 0.25s ease both'
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, background: 'var(--bg4)',
          borderRadius: 2, margin: '0 auto 20px'
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14, flexShrink: 0,
            background: `${a.color}22`, border: `2px solid ${a.color}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24
          }}>
            {a.emoji}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: a.color }}>
              {a.label}
            </div>
            {selectedFlare.description && (
              <div style={{
                fontSize: 13, color: 'var(--text2)', marginTop: 3,
                lineHeight: 1.4
              }}>
                {selectedFlare.description}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { icon: '👥', text: `${selectedFlare.participant_count} joined` },
            { icon: '⏱', text: timeLeft(selectedFlare.expires_at) },
            destLat !== null && {
              icon: '📍',
              text: `${Math.round(selectedFlare.distance_meters || 0)}m away`
            }
          ].filter(Boolean).map((s, i) => (
            <div key={i} style={{
              flex: 1, background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: '8px 6px',
              textAlign: 'center',
              fontSize: 12, fontFamily: 'var(--mono)',
              color: 'var(--text2)'
            }}>
              {s.icon} {s.text}
            </div>
          ))}
        </div>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleRoute}
            disabled={!destLat || routeLoading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontFamily: 'var(--font)',
              fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: !destLat ? 0.5 : 1
            }}
          >
            🗺️ Route
          </button>
          <button
            onClick={handleChat}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontFamily: 'var(--font)',
              fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            💬 Chat
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            fontSize: 12, color: 'var(--red)',
            fontFamily: 'var(--mono)', marginBottom: 10,
            padding: '8px 10px', background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8
          }}>
            {error}
          </div>
        )}

        {/* Primary actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setSelectedFlare(null)}
            style={{
              flex: 1, padding: 13, background: 'var(--bg3)',
              border: '1px solid var(--border2)', borderRadius: 10,
              color: 'var(--text2)', fontFamily: 'var(--font)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}
          >
            Close
          </button>

          {isOwn ? (
            <div style={{
              flex: 2, padding: 13, background: 'var(--bg3)',
              border: `1px solid ${a.color}33`, borderRadius: 10,
              color: a.color, fontFamily: 'var(--mono)', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              your flare 🔥
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining || joined || selectedFlare._pending}
              style={{
                flex: 2, padding: 13,
                background: joined ? `${a.color}22` : a.color,
                border: joined ? `2px solid ${a.color}55` : 'none',
                borderRadius: 10,
                color: joined ? a.color : '#030712',
                fontFamily: 'var(--font)', fontWeight: 700,
                fontSize: 14,
                cursor: joining || joined ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {joined   ? `✓ You're in!`
               : joining ? 'Joining...'
               : `Join ${a.emoji}`}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
