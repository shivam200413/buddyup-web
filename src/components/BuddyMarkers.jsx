import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '../lib/store'
import { getActivity } from '../lib/supabase'

function createBuddyIcon(username, activity) {
  const a = getActivity(activity || 'chill')
  const initial = (username || '?')[0].toUpperCase()
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${a.color}15;
          border:2px solid ${a.color}55;
          animation:pulse-ring 3s ease-out infinite;
        "></div>
        <div style="
          position:absolute;inset:3px;border-radius:50%;
          background:linear-gradient(135deg,${a.color}35,${a.color}18);
          border:2px solid ${a.color}88;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:700;color:white;
          font-family:'Syne',sans-serif;
          box-shadow:0 2px 8px ${a.color}33;
        ">${initial}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22]
  })
}

function timeSince(iso) {
  if (!iso) return 'just now'
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (secs < 60)  return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

export default function BuddyMarkers() {
  const { nearbyUsers } = useStore()

  return nearbyUsers
    .filter(u => u.lat && u.lng)
    .map(user => {
      const a = getActivity(user.activity || 'chill')
      return (
        <Marker
          key={user.user_id}
          position={[user.lat, user.lng]}
          icon={createBuddyIcon(user.username, user.activity)}
          zIndexOffset={50}
        >
          <Popup>
            <div style={{ minWidth: 140, fontFamily: 'var(--font)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                @{user.username || 'anonymous'}
              </div>
              <div style={{
                fontSize: 12, display: 'flex',
                alignItems: 'center', gap: 6, marginBottom: 6
              }}>
                <span>{a.emoji}</span>
                <span style={{ color: a.color }}>{a.label}</span>
              </div>
              <div style={{
                fontSize: 11, fontFamily: 'var(--mono)',
                color: 'var(--text3)'
              }}>
                active {timeSince(user.online_at)}
              </div>
            </div>
          </Popup>
        </Marker>
      )
    })
}
