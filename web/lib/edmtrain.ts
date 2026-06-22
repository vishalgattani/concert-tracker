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

export async function fetchEvents(
  apiKey: string,
  latitude = '37.77',
  longitude = '-122.41',
  state = 'California',
  days = 7,
): Promise<Event[]> {
  const url =
    `${EDT_BASE}?latitude=${latitude}&longitude=${longitude}&state=${state}` +
    `&includeElectronicGenreInd=true&client=${apiKey}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`EDMTrain API error: ${res.status}`)

  const data = await res.json()
  if (!data.success || !Array.isArray(data.data)) return []

  const { start, end } = windowDates(days)

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
