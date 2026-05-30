import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../lib/store'
import { getActivity } from '../lib/supabase'

function createFlareIcon(activity, pending = false) {
  const a = getActivity(activity)
  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 44px; height: 44px;
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          position: absolute; inset: 0; border-radius: 50%;
          background: ${a.color}22;
          border: 2px solid ${a.color}${pending ? '66' : 'cc'};
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          width: 34px; height: 34px; border-radius: 50%;
          background: ${a.color}33;
          border: 2px solid ${a.color}${pending ? '44' : '99'};
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          opacity: ${pending ? 0.5 : 1};
        ">${a.emoji}</div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24]
  })
}

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date()
  if (diff <= 0) return 'expired'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m left`
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`
}

export default function FlareMarkers() {
  const { flares, setSelectedFlare } = useStore()

  return flares.map(flare => {
    let lat, lng
    try {
      const geo = JSON.parse(flare.geojson)
      lng = geo.coordinates[0]
      lat = geo.coordinates[1]
    } catch { return null }

    const activity = getActivity(flare.activity_type)

    return (
      <Marker
        key={flare.id}
        position={[lat, lng]}
        icon={createFlareIcon(flare.activity_type, flare._pending)}
        eventHandlers={{ click: () => setSelectedFlare(flare) }}
      >
        <Popup>
          <div style={{ minWidth: 160, fontFamily: 'var(--font)' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{activity.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: activity.color }}>
              {activity.label}
            </div>
            {flare.description && (
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                {flare.description}
              </div>
            )}
            <div style={{
              fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)',
              marginTop: 8, display: 'flex', gap: 10
            }}>
              <span>👥 {flare.participant_count}</span>
              <span>⏱ {timeLeft(flare.expires_at)}</span>
              {flare.distance_meters != null && (
                <span>📍 {Math.round(flare.distance_meters)}m</span>
              )}
            </div>
            {!flare._pending && (
              <button
                onClick={() => setSelectedFlare(flare)}
                style={{
                  marginTop: 10, width: '100%', padding: '6px 0',
                  background: activity.color, border: 'none', borderRadius: 6,
                  color: '#030712', fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'var(--font)'
                }}
              >
                Join →
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    )
  })
}
