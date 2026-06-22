import type { Event } from './events'

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2/events.json'

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function tmDateTime(d: Date, endOfDay = false): string {
  const time = endOfDay ? 'T23:59:59Z' : 'T00:00:00Z'
  return d.toISOString().slice(0, 10) + time
}

export async function fetchEvents(apiKey: string, city = 'San Francisco', days = 7): Promise<Event[]> {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)

  const params = new URLSearchParams({
    apikey: apiKey,
    city,
    classificationName: 'music',
    startDateTime: tmDateTime(start),
    endDateTime: tmDateTime(end, true),
    size: '50',
    sort: 'date,asc',
  })

  const res = await fetch(`${TM_BASE}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Ticketmaster API error: ${res.status}`)

  const data = await res.json()
  const raw: unknown[] = data?._embedded?.events ?? []

  return raw.flatMap((e: unknown) => {
    const ev = e as Record<string, unknown>
    const venues = (ev._embedded as Record<string, unknown[]>)?.venues ?? []
    const venue = venues[0] as Record<string, unknown> | undefined
    if (!venue) return []

    const loc = venue.location as Record<string, string> | undefined
    const lat = parseFloat(loc?.latitude ?? '')
    const lng = parseFloat(loc?.longitude ?? '')
    if (isNaN(lat) || isNaN(lng)) return []

    const city_ = (venue.city as Record<string, string>)?.name ?? ''
    const state_ = (venue.state as Record<string, string>)?.stateCode ?? ''
    const dates = ev.dates as Record<string, unknown>
    const start_ = dates?.start as Record<string, string>
    const prices = (ev.priceRanges as Record<string, number>[] | undefined) ?? []

    return [{
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
    }]
  })
}
