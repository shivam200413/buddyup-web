import { Marker } from 'react-leaflet'
import L from 'leaflet'

function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;width:28px;height:28px;border-radius:50%;
          background:rgba(56,189,248,0.12);
          border:2px solid rgba(56,189,248,0.6);
          animation:pulse-ring 2.5s ease-out infinite;
        "></div>
        <div style="
          width:14px;height:14px;border-radius:50%;
          background:#38bdf8;
          border:2.5px solid white;
          box-shadow:0 0 10px rgba(56,189,248,0.9),0 0 20px rgba(56,189,248,0.4);
          z-index:2;position:relative;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  })
}

export default function UserMarker({ position }) {
  if (!position) return null
  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={createUserIcon()}
      zIndexOffset={2000}
    />
  )
}
