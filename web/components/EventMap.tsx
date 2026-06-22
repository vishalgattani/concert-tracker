'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import type { Event } from '@/lib/events'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const INITIAL_VIEW = {
  longitude: -122.41,
  latitude: 37.77,
  zoom: 10,
}

export default function EventMap() {
  const [events, setEvents] = useState<Event[]>([])
  const [selected, setSelected] = useState<Event | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setEvents(body.data)
        else setError(body.message ?? 'Failed to load events')
      })
      .catch(() => setError('Network error'))
  }, [])

  const selectEvent = useCallback((event: Event) => {
    setSelected(event)
    mapRef.current?.flyTo({
      center: [event.venue.longitude, event.venue.latitude],
      zoom: 14,
      duration: 600,
    })
  }, [])

  const handlePopupClose = useCallback(() => setSelected(null), [])

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: 280,
        flexShrink: 0,
        background: '#111',
        color: '#eee',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
      }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #222', fontSize: 13, fontWeight: 600, color: '#aaa', letterSpacing: '0.05em' }}>
          NEXT 7 DAYS
        </div>
        {events.length === 0 && !error && (
          <div style={{ padding: '16px', fontSize: 13, color: '#666' }}>No events found.</div>
        )}
        {events.map((event) => {
          const isSelected = selected?.id === event.id
          return (
            <button
              key={event.id}
              onClick={() => selectEvent(event)}
              style={{
                textAlign: 'left',
                background: isSelected ? '#1a1a2e' : 'transparent',
                border: 'none',
                borderBottom: '1px solid #1a1a1a',
                borderLeft: isSelected ? '3px solid #0070f3' : '3px solid transparent',
                padding: '12px 14px',
                cursor: 'pointer',
                color: '#eee',
                width: '100%',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{event.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{event.venue.name}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                {event.date} · {event.startTime ? event.startTime.slice(0, 5) : 'TBA'}
                {' · '}
                <span style={{ color: event.source === 'EDMTrain' ? '#7c3aed' : '#0070f3' }}>
                  {event.source}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />

          {events.map((event) => (
            <Marker
              key={event.id}
              longitude={event.venue.longitude}
              latitude={event.venue.latitude}
              anchor="bottom"
              onClick={() => selectEvent(event)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: 24 }} title={event.name}>🎵</span>
            </Marker>
          ))}

          {selected && (
            <Popup
              longitude={selected.venue.longitude}
              latitude={selected.venue.latitude}
              anchor="top"
              onClose={handlePopupClose}
              closeOnClick={false}
            >
              <div style={{ maxWidth: 220, padding: '4px 2px' }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>{selected.name}</strong>
                <div style={{ fontSize: 13, color: '#555' }}>{selected.venue.name}</div>
                <div style={{ fontSize: 13, color: '#555' }}>{selected.venue.location}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  📅 {selected.date}
                  {selected.startTime && ` · ${selected.startTime.slice(0, 5)}`}
                </div>
                {selected.priceMin !== null && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    💰 ${selected.priceMin}–${selected.priceMax}
                  </div>
                )}
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#0070f3', marginTop: 6, display: 'block' }}
                >
                  Buy tickets →
                </a>
              </div>
            </Popup>
          )}
        </Map>

        {error && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ff4444',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 14,
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
