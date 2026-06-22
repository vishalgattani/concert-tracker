'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl'
import type { MapRef, LngLatBoundsLike, MapLayerMouseEvent } from 'react-map-gl'
import type { Event } from '@/lib/events'
import { haversineMiles } from '@/lib/events'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
const MAX_RADIUS_MILES = 50

const FALLBACK_VIEW = { longitude: -122.15, latitude: 37.55, zoom: 9 }

function computeBounds(events: Event[]): LngLatBoundsLike | null {
  if (events.length === 0) return null
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const e of events) {
    minLng = Math.min(minLng, e.venue.longitude)
    maxLng = Math.max(maxLng, e.venue.longitude)
    minLat = Math.min(minLat, e.venue.latitude)
    maxLat = Math.max(maxLat, e.venue.latitude)
  }
  return [[minLng, minLat], [maxLng, maxLat]]
}

function makeCircleGeoJSON(center: [number, number], radiusMiles: number) {
  const [lng, lat] = center
  const pts = 64
  const coords: [number, number][] = []
  for (let i = 0; i <= pts; i++) {
    const angle = (i / pts) * 2 * Math.PI
    const dLat = (radiusMiles / 69.0) * Math.cos(angle)
    const dLng = (radiusMiles / (69.0 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
    coords.push([lng + dLng, lat + dLat])
  }
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }] }
}

export default function EventMap() {
  const [events, setEvents] = useState<Event[]>([])
  const [selected, setSelected] = useState<Event | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<MapRef>(null)
  const boundsRef = useRef<LngLatBoundsLike | null>(null)

  // Radius mode state
  const [radiusMode, setRadiusMode] = useState(false)
  const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null)
  const [radiusMiles, setRadiusMiles] = useState(0)
  const [radiusEvents, setRadiusEvents] = useState<Event[] | null>(null)
  const [radiusLoading, setRadiusLoading] = useState(false)

  // Refs to avoid stale closures in map event handlers
  const dragRef = useRef<{ active: boolean; center: [number, number] | null; miles: number }>({
    active: false, center: null, miles: 0,
  })
  const radiusModeRef = useRef(false)
  useEffect(() => { radiusModeRef.current = radiusMode }, [radiusMode])

  // Load default events
  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((body) => { if (body.success) setEvents(body.data); else setError(body.message ?? 'Failed to load events') })
      .catch(() => setError('Network error'))
  }, [])

  // Fit map to all default events once loaded
  useEffect(() => {
    if (events.length === 0) return
    const bounds = computeBounds(events)
    if (!bounds) return
    boundsRef.current = bounds
    mapRef.current?.fitBounds(bounds, { padding: 60, duration: 800, maxZoom: 13 })
  }, [events])

  const selectEvent = useCallback((event: Event) => {
    setSelected(event)
    mapRef.current?.flyTo({ center: [event.venue.longitude, event.venue.latitude], zoom: 14, duration: 600 })
  }, [])

  const resetView = useCallback(() => {
    setSelected(null)
    if (boundsRef.current) {
      mapRef.current?.fitBounds(boundsRef.current, { padding: 60, duration: 600, maxZoom: 13 })
    }
  }, [])

  const handlePopupClose = useCallback(() => setSelected(null), [])

  // Toggle radius draw mode
  const toggleRadiusMode = useCallback(() => {
    const next = !radiusModeRef.current
    setRadiusMode(next)
    if (!next) {
      // Exit: clear radius state, restore default view
      dragRef.current = { active: false, center: null, miles: 0 }
      setRadiusCenter(null)
      setRadiusMiles(0)
      setRadiusEvents(null)
      setSelected(null)
      if (boundsRef.current) {
        mapRef.current?.fitBounds(boundsRef.current, { padding: 60, duration: 600, maxZoom: 13 })
      }
    }
  }, [])

  // Map mouse handlers for radius draw
  const handleMouseDown = useCallback((e: MapLayerMouseEvent) => {
    if (!radiusModeRef.current) return
    const center: [number, number] = [e.lngLat.lng, e.lngLat.lat]
    dragRef.current = { active: true, center, miles: 0 }
    setRadiusCenter(center)
    setRadiusMiles(0)
    setRadiusEvents(null)
    setSelected(null)
  }, [])

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (!radiusModeRef.current || !dragRef.current.active || !dragRef.current.center) return
    const dist = Math.min(
      haversineMiles(dragRef.current.center[1], dragRef.current.center[0], e.lngLat.lat, e.lngLat.lng),
      MAX_RADIUS_MILES,
    )
    dragRef.current.miles = dist
    setRadiusMiles(dist)
  }, [])

  const handleMouseUp = useCallback(async () => {
    if (!radiusModeRef.current || !dragRef.current.active || !dragRef.current.center) return
    dragRef.current.active = false
    const { center, miles } = dragRef.current
    if (miles < 0.5) return // ignore tiny clicks

    setRadiusLoading(true)
    try {
      const res = await fetch(`/api/events?lat=${center[1]}&lng=${center[0]}&radius=${miles.toFixed(2)}`)
      const body = await res.json()
      if (body.success) {
        setRadiusEvents(body.data)
        const bounds = computeBounds(body.data)
        if (bounds) mapRef.current?.fitBounds(bounds, { padding: 80, duration: 600, maxZoom: 13 })
      }
    } finally {
      setRadiusLoading(false)
    }
  }, [])

  const displayEvents = radiusEvents ?? events

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 280, flexShrink: 0, background: '#111', color: '#eee', overflowY: 'auto', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #222', fontSize: 13, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em' }}>
          {radiusEvents !== null
            ? `RADIUS RESULTS (${displayEvents.length})`
            : 'NEXT 7 DAYS'}
        </div>
        {displayEvents.length === 0 && !error && (
          <div style={{ padding: '16px', fontSize: 13, color: '#666' }}>
            {radiusLoading ? 'Searching…' : radiusMode && radiusCenter ? 'No events in this radius.' : 'No events found.'}
          </div>
        )}
        {displayEvents.map((event) => {
          const isSelected = selected?.id === event.id
          return (
            <button key={event.id} onClick={() => selectEvent(event)} style={{
              textAlign: 'left', background: isSelected ? '#1a1a2e' : 'transparent', border: 'none',
              borderBottom: '1px solid #1a1a1a', borderLeft: isSelected ? '3px solid #0070f3' : '3px solid transparent',
              padding: '12px 14px', cursor: 'pointer', color: '#eee', width: '100%',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{event.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{event.venue.name}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                {event.date} · {event.startTime ? event.startTime.slice(0, 5) : 'TBA'}
                {' · '}
                <span style={{ color: event.source === 'EDMTrain' ? '#7c3aed' : '#0070f3' }}>{event.source}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative', cursor: radiusMode ? 'crosshair' : 'default' }}>
        <Map
          ref={mapRef}
          initialViewState={FALLBACK_VIEW}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          dragPan={!radiusMode}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <NavigationControl position="top-right" />

          {/* Radius circle overlay */}
          {radiusCenter && radiusMiles > 0 && (
            <Source id="radius-circle" type="geojson" data={makeCircleGeoJSON(radiusCenter, radiusMiles) as never}>
              <Layer id="radius-fill" type="fill" paint={{ 'fill-color': '#0070f3', 'fill-opacity': 0.1 }} />
              <Layer id="radius-line" type="line" paint={{ 'line-color': '#0070f3', 'line-width': 2, 'line-dasharray': [4, 2] }} />
            </Source>
          )}

          {/* Center pin */}
          {radiusCenter && (
            <Marker longitude={radiusCenter[0]} latitude={radiusCenter[1]} anchor="center">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0070f3', border: '2px solid #fff' }} />
            </Marker>
          )}

          {displayEvents.map((event) => (
            <Marker key={event.id} longitude={event.venue.longitude} latitude={event.venue.latitude}
              anchor="bottom" onClick={() => selectEvent(event)} style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: 24 }} title={event.name}>🎵</span>
            </Marker>
          ))}

          {selected && (
            <Popup longitude={selected.venue.longitude} latitude={selected.venue.latitude}
              anchor="top" onClose={handlePopupClose} closeOnClick={false}>
              <div style={{ maxWidth: 220, padding: '4px 2px' }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{selected.name}</strong>
                <div style={{ fontSize: 13, color: '#555' }}>{selected.venue.name}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{selected.venue.location}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  📅 {selected.date}{selected.startTime && ` · ${selected.startTime.slice(0, 5)}`}
                </div>
                {selected.priceMin !== null && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>💰 ${selected.priceMin}–${selected.priceMax}</div>
                )}
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#0070f3', marginTop: 6, display: 'block' }}>
                  Buy tickets →
                </a>
              </div>
            </Popup>
          )}
        </Map>

        {/* Radius mode toggle button */}
        <button onClick={toggleRadiusMode} title={radiusMode ? 'Exit radius search' : 'Draw radius to search'} style={{
          position: 'absolute', top: 10, left: 10,
          background: radiusMode ? '#0070f3' : '#fff',
          color: radiusMode ? '#fff' : '#333',
          border: 'none', borderRadius: 6, padding: '7px 12px',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 0 0 2px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⊙ {radiusMode ? 'Exit Radius Search' : 'Radius Search'}
        </button>

        {/* Live radius readout while dragging */}
        {radiusMode && radiusMiles > 0.5 && (
          <div style={{
            position: 'absolute', top: 50, left: 10,
            background: 'rgba(0,0,0,0.75)', color: '#fff',
            borderRadius: 6, padding: '4px 10px', fontSize: 13, pointerEvents: 'none',
          }}>
            {radiusMiles >= MAX_RADIUS_MILES
              ? `${MAX_RADIUS_MILES} mi (max)`
              : `${radiusMiles.toFixed(1)} mi`}
          </div>
        )}

        {/* Reset view button — below +/- controls */}
        <button onClick={resetView} title="Reset view" style={{
          position: 'absolute', top: 110, right: 10,
          width: 30, height: 30, background: '#fff', border: 'none', borderRadius: 4,
          boxShadow: '0 0 0 2px rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>
          ⊙
        </button>

        {error && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: '#ff4444', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
