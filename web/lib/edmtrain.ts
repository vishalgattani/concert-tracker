export interface Venue {
  id: number
  name: string
  location: string
  address: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export interface Artist {
  id: number
  name: string
  link: string
  b2bInd: boolean
}

export interface Event {
  id: number
  link: string
  name: string | null
  ages: string
  festivalInd: boolean
  livestreamInd: boolean
  electronicGenreInd: boolean
  otherGenreInd: boolean
  date: string
  startTime: string | null
  endTime: string | null
  createdDate: string
  venue: Venue
  artistList: Artist[]
}

export interface EdmtrainResponse {
  data: Event[]
  success: boolean
  message?: string
}

export function eventDisplayName(event: Event): string {
  if (event.name) return event.name
  const artists = event.artistList.map((a) => a.name).join(' b2b ')
  return artists || 'Unknown Event'
}
