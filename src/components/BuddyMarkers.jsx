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
      <div style="position:relative; width:38px; height:38px;">
        <div style="
          position:absolute; inset:0; border-radius:50%;
          border: 2px solid ${a.color}88;
          animation: pulse-ring 3s ease-out infinite;
        "></div>
        <div style="
          width:34px; height:34px; border-radius:50%;
          background: linear-gradient(135deg, ${a.color}44, ${a.color}22);
          border: 2px solid ${a.color}99;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:700; color:white;
          font-family: 'Syne', sans-serif;
        ">${initial}</div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22]
  })
}

function timeSince(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (secs < 60) return 'just now'
  return `${Math.floor(secs / 60)}m ago`
}

export default function BuddyMarkers() {
  const { nearbyUsers } = useStore()

  return nearbyUsers.map(user => {
    if (!user.lat || !user.lng) return null
    const a = getActivity(user.activity || 'chill')

    return (
      <Marker
        key={user.user_id}
        position={[user.lat, user.lng]}
        icon={createBuddyIcon(user.username, user.activity)}
      >
        <Popup>
          <div style={{ minWidth: 140, fontFamily: 'var(--font)' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              @{user.username || 'anonymous'}
            </div>
            <div style={{
              fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span>{a.emoji}</span>
              <span style={{ color: a.color }}>{a.label}</span>
            </div>
            <div style={{
              fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', marginTop: 6
            }}>
              active {timeSince(user.online_at)}
            </div>
          </div>
        </Popup>
      </Marker>
    )
  })
}
