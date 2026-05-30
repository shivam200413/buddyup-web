import { Marker } from 'react-leaflet'
import L from 'leaflet'

function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
        <div style="
          position:absolute; width:24px; height:24px; border-radius:50%;
          background: rgba(56,189,248,0.15);
          border: 2px solid rgba(56,189,248,0.5);
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          width:12px; height:12px; border-radius:50%;
          background: #38bdf8;
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(56,189,248,0.8);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

export default function UserMarker({ position }) {
  if (!position) return null
  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={createUserIcon()}
      zIndexOffset={1000}
    />
  )
}
