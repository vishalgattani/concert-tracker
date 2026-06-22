import type { Event } from './events'

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2/events.json'

const CITIES = [
  'San Francisco',
  'San Jose',
  'Mountain View',
  'Sunnyvale',
  'Santa Clara',
]

function tmDateTime(d: Date, endOfDay = false): string {
  return d.toISOString().slice(0, 10) + (endOfDay ? 'T23:59:59Z' : 'T00:00:00Z')
}

function mapEvent(ev: Record<string, unknown>): Event | null {
  const venues = (ev._embedded as Record<string, unknown[]>)?.venues ?? []
  const venue = venues[0] as Record<string, unknown> | undefined
  if (!venue) return null

  const loc = venue.location as Record<string, string> | undefined
  const lat = parseFloat(loc?.latitude ?? '')
  const lng = parseFloat(loc?.longitude ?? '')
  if (isNaN(lat) || isNaN(lng)) return null

  const city_ = (venue.city as Record<string, string>)?.name ?? ''
  const state_ = (venue.state as Record<string, string>)?.stateCode ?? ''
  const start_ = (ev.dates as Record<string, unknown>)?.start as Record<string, string>
  const prices = (ev.priceRanges as Record<string, number>[] | undefined) ?? []

  return {
    id: `tm-${ev.id as string}`,
    name: ev.name as string,
    date: start_?.localDate ?? '',
    startTime: start_?.localTime ?? null,
    venue: {
      name: venue.name as string,
      location: [city_, state_].filter(Boolean).join(', '),
      latitude: lat,
      longitude: lng,
    },
    url: ev.url as string,
    priceMin: prices[0]?.min ?? null,
    priceMax: prices[0]?.max ?? null,
    source: 'Ticketmaster' as const,
  }
}

async function fetchCity(apiKey: string, city: string, startDT: string, endDT: string): Promise<Event[]> {
  const params = new URLSearchParams({
    apikey: apiKey,
    city,
    classificationName: 'music',
    startDateTime: startDT,
    endDateTime: endDT,
    size: '50',
    sort: 'date,asc',
  })

  const res = await fetch(`${TM_BASE}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) return []

  const data = await res.json()
  const raw: unknown[] = data?._embedded?.events ?? []
  return raw.flatMap((e) => {
    const mapped = mapEvent(e as Record<string, unknown>)
    return mapped ? [mapped] : []
  })
}

export async function fetchEventsRadius(
  apiKey: string,
  lat: number,
  lng: number,
  radiusMiles: number,
  days = 7,
): Promise<Event[]> {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)

  const params = new URLSearchParams({
    apikey: apiKey,
    latlong: `${lat},${lng}`,
    radius: String(Math.ceil(radiusMiles)),
    unit: 'miles',
    classificationName: 'music',
    startDateTime: tmDateTime(start),
    endDateTime: tmDateTime(end, true),
    size: '50',
    sort: 'date,asc',
  })

  const res = await fetch(`${TM_BASE}?${params}`, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  const raw: unknown[] = data?._embedded?.events ?? []
  return raw.flatMap((e) => {
    const mapped = mapEvent(e as Record<string, unknown>)
    return mapped ? [mapped] : []
  })
}

export async function fetchEvents(apiKey: string, days = 7): Promise<Event[]> {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)
  const startDT = tmDateTime(start)
  const endDT = tmDateTime(end, true)

  const results = await Promise.all(CITIES.map((city) => fetchCity(apiKey, city, startDT, endDT)))

  // Dedupe by event id (same event can appear across city queries)
  const seen = new Set<string>()
  return results.flat().filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}
