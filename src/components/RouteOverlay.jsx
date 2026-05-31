import { useEffect } from 'react'
import { Polyline, useMap } from 'react-leaflet'
import { useStore } from '../lib/store'

export default function RouteOverlay() {
  const { activeRoute } = useStore()
  const map = useMap()

  useEffect(() => {
    if (!activeRoute?.coords?.length) return
    try {
      const bounds = activeRoute.coords.reduce(
        (b, [lat, lng]) => [
          [Math.min(b[0][0], lat), Math.min(b[0][1], lng)],
          [Math.max(b[1][0], lat), Math.max(b[1][1], lng)]
        ],
        [[Infinity, Infinity], [-Infinity, -Infinity]]
      )
      map.fitBounds(bounds, { padding: [70, 70], animate: true })
    } catch (_) {}
  }, [activeRoute])

  if (!activeRoute) return null

  return (
    <Polyline
      positions={activeRoute.coords}
      pathOptions={{
        color: '#38bdf8',
        weight: 4,
        opacity: 0.9,
        dashArray: activeRoute.mode === 'cycling' ? '8 5' : null,
        lineCap: 'round',
        lineJoin: 'round'
      }}
    />
  )
}
