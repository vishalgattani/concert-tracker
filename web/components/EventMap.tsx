'use client'

import { useEffect, useState, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl'
import type { Event } from '@/lib/edmtrain'
import { eventDisplayName } from '@/lib/edmtrain'

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

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setEvents(body.data)
        else setError(body.message ?? 'Failed to load events')
      })
      .catch(() => setError('Network error'))
  }, [])

  const handleMarkerClick = useCallback((event: Event) => {
    setSelected(event)
  }, [])

  const handlePopupClose = useCallback(() => setSelected(null), [])

  return (
    <>
      <Map
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
            onClick={() => handleMarkerClick(event)}
            style={{ cursor: 'pointer' }}
          >
            <span style={{ fontSize: 24 }} title={eventDisplayName(event)}>
              🎵
            </span>
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
              <strong style={{ display: 'block', marginBottom: 4 }}>
                {eventDisplayName(selected)}
              </strong>
              <div style={{ fontSize: 13, color: '#555' }}>{selected.venue.name}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{selected.venue.location}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                📅 {selected.date}
                {selected.startTime && ` · ${selected.startTime.slice(0, 5)}`}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {selected.ages}
                {selected.festivalInd && ' · Festival'}
              </div>
              <a
                href={selected.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#0070f3', marginTop: 6, display: 'block' }}
              >
                View on Edmtrain →
              </a>
            </div>
          </Popup>
        )}
      </Map>

      <a
        href="https://edmtrain.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 11,
          textDecoration: 'none',
          zIndex: 10,
        }}
      >
        Powered by Edmtrain
      </a>

      {error && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ff4444',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}
    </>
  )
}
