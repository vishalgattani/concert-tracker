export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3963.2
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface Venue {
  name: string
  location: string
  latitude: number
  longitude: number
}

export interface Event {
  id: string
  name: string
  date: string
  startTime: string | null
  venue: Venue
  url: string
  priceMin: number | null
  priceMax: number | null
  source: 'Ticketmaster' | 'EDMTrain'
}
