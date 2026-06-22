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
