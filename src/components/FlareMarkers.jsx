import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../lib/store'
import { getActivity } from '../lib/supabase'

function createFlareIcon(activity, pending = false) {
  const a = getActivity(activity)
  const op = pending ? '0.5' : '1'
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${a.color}18;
          border:2px solid ${a.color}55;
          animation:pulse-ring 2.8s ease-out infinite;
        "></div>
        <div style="
          width:40px;height:40px;border-radius:50%;
          background:linear-gradient(135deg,${a.color}30,${a.color}18);
          border:2px solid ${a.color}cc;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
          box-shadow:0 2px 12px ${a.color}44;
          opacity:${op};
          position:relative;z-index:1;
        ">${a.emoji}</div>
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -28]
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
      lng = geo.coordinates[0]; lat = geo.coordinates[1]
    } catch { return null }

    const a = getActivity(flare.activity_type)

    return (
      <Marker
        key={flare.id}
        position={[lat, lng]}
        icon={createFlareIcon(flare.activity_type, flare._pending)}
        zIndexOffset={100}
        eventHandlers={{ click: () => setSelectedFlare(flare) }}
      >
        <Popup>
          <div style={{ minWidth: 170, fontFamily: 'var(--font)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:22 }}>{a.emoji}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:a.color }}>{a.label}</div>
                {flare.description && (
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>{flare.description}</div>
                )}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, fontSize:11, fontFamily:'var(--mono)', color:'var(--text3)', marginBottom:10 }}>
              <span>👥 {flare.participant_count}</span>
              <span>⏱ {timeLeft(flare.expires_at)}</span>
              {flare.distance_meters != null && <span>📍 {Math.round(flare.distance_meters)}m</span>}
            </div>
            {!flare._pending && (
              <button
                onClick={() => setSelectedFlare(flare)}
                style={{
                  width:'100%', padding:'7px 0',
                  background:a.color, border:'none', borderRadius:8,
                  color:'#030712', fontWeight:700, fontSize:12,
                  cursor:'pointer', fontFamily:'var(--font)'
                }}
              >
                View details →
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    )
  })
}
