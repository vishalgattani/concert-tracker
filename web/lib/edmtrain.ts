import type { Event } from './events'

const EDT_BASE = 'https://edmtrain.com/api/events'

function windowDates(days: number): { start: string; end: string } {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

const LOCATIONS = [
  { latitude: '37.77', longitude: '-122.41', state: 'California' },  // San Francisco
  { latitude: '37.33', longitude: '-121.89', state: 'California' },  // San Jose
]

async function fetchLocation(
  apiKey: string,
  latitude: string,
  longitude: string,
  state: string,
  start: string,
  end: string,
): Promise<Event[]> {
  const url =
    `${EDT_BASE}?latitude=${latitude}&longitude=${longitude}&state=${state}` +
    `&includeElectronicGenreInd=true&client=${apiKey}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []

  const data = await res.json()
  if (!data.success || !Array.isArray(data.data)) return []

  return (data.data as Record<string, unknown>[])
    .filter((e) => {
      const d = e.date as string
      return d >= start && d <= end
    })
    .map((e) => {
      const venue = e.venue as Record<string, unknown>
      const artists = (e.artistList as { name: string }[]) ?? []
      const name = (e.name as string | null) ?? (artists.map((a) => a.name).join(' b2b ') || 'Unknown Event')
      return {
        id: `edt-${e.id as number}`,
        name,
        date: e.date as string,
        startTime: (e.startTime as string | null) ?? null,
        venue: {
          name: venue.name as string,
          location: venue.location as string,
          latitude: venue.latitude as number,
          longitude: venue.longitude as number,
        },
        url: e.link as string,
        priceMin: null,
        priceMax: null,
        source: 'EDMTrain' as const,
      }
    })
}

export async function fetchEvents(apiKey: string, days = 7): Promise<Event[]> {
  const { start, end } = windowDates(days)

  const results = await Promise.all(
    LOCATIONS.map((loc) => fetchLocation(apiKey, loc.latitude, loc.longitude, loc.state, start, end))
  )

  // Dedupe by event id (same event can appear in both location queries)
  const seen = new Set<string>()
  return results.flat().filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}
