import { NextRequest, NextResponse } from 'next/server'
import type { Event } from '@/lib/edmtrain'

const DUMMY_EVENTS: Event[] = [
  {
    id: 1,
    name: 'Deadmau5',
    link: 'https://edmtrain.com/san-francisco/deadmau5-1',
    ages: '18+',
    festivalInd: false,
    livestreamInd: false,
    electronicGenreInd: true,
    otherGenreInd: false,
    date: '2026-06-15',
    startTime: '21:00:00',
    endTime: null,
    createdDate: '2026-05-01T10:00:00Z',
    venue: {
      id: 101,
      name: 'Chase Center',
      location: 'San Francisco, CA',
      address: '1 Warriors Way, San Francisco, CA 94158',
      state: 'California',
      country: 'United States',
      latitude: 37.768,
      longitude: -122.3876,
    },
    artistList: [{ id: 1, name: 'deadmau5', link: 'https://edmtrain.com/tours/deadmau5-1', b2bInd: false }],
  },
  {
    id: 2,
    name: null,
    link: 'https://edmtrain.com/san-francisco/rezz-2',
    ages: '21+',
    festivalInd: false,
    livestreamInd: false,
    electronicGenreInd: true,
    otherGenreInd: false,
    date: '2026-06-20',
    startTime: '22:00:00',
    endTime: null,
    createdDate: '2026-05-10T08:00:00Z',
    venue: {
      id: 102,
      name: 'The Fillmore',
      location: 'San Francisco, CA',
      address: '1805 Geary Blvd, San Francisco, CA 94115',
      state: 'California',
      country: 'United States',
      latitude: 37.7845,
      longitude: -122.4329,
    },
    artistList: [{ id: 2, name: 'Rezz', link: 'https://edmtrain.com/tours/rezz-2', b2bInd: false }],
  },
  {
    id: 3,
    name: null,
    link: 'https://edmtrain.com/oakland/disclosure-3',
    ages: 'All Ages',
    festivalInd: false,
    livestreamInd: false,
    electronicGenreInd: true,
    otherGenreInd: false,
    date: '2026-07-04',
    startTime: '20:00:00',
    endTime: null,
    createdDate: '2026-05-15T12:00:00Z',
    venue: {
      id: 103,
      name: 'Fox Theater',
      location: 'Oakland, CA',
      address: '1807 Telegraph Ave, Oakland, CA 94612',
      state: 'California',
      country: 'United States',
      latitude: 37.8044,
      longitude: -122.2712,
    },
    artistList: [
      { id: 3, name: 'Disclosure', link: 'https://edmtrain.com/tours/disclosure-3', b2bInd: false },
    ],
  },
  {
    id: 4,
    name: 'How Weird Street Faire',
    link: 'https://edmtrain.com/san-francisco/how-weird-4',
    ages: 'All Ages',
    festivalInd: true,
    livestreamInd: false,
    electronicGenreInd: true,
    otherGenreInd: false,
    date: '2026-07-12',
    startTime: '12:00:00',
    endTime: '20:00:00',
    createdDate: '2026-05-20T09:00:00Z',
    venue: {
      id: 104,
      name: 'Bill Graham Civic Auditorium',
      location: 'San Francisco, CA',
      address: '99 Grove St, San Francisco, CA 94102',
      state: 'California',
      country: 'United States',
      latitude: 37.7781,
      longitude: -122.4177,
    },
    artistList: [
      { id: 4, name: 'Four Tet', link: 'https://edmtrain.com/tours/four-tet-4', b2bInd: false },
      { id: 5, name: 'Floating Points', link: 'https://edmtrain.com/tours/floating-points-5', b2bInd: false },
    ],
  },
  {
    id: 5,
    name: null,
    link: 'https://edmtrain.com/san-francisco/fred-again-5',
    ages: '21+',
    festivalInd: false,
    livestreamInd: false,
    electronicGenreInd: true,
    otherGenreInd: false,
    date: '2026-07-18',
    startTime: '22:00:00',
    endTime: null,
    createdDate: '2026-05-22T11:00:00Z',
    venue: {
      id: 105,
      name: 'DNA Lounge',
      location: 'San Francisco, CA',
      address: '375 11th St, San Francisco, CA 94103',
      state: 'California',
      country: 'United States',
      latitude: 37.7696,
      longitude: -122.421,
    },
    artistList: [
      { id: 6, name: 'Fred again..', link: 'https://edmtrain.com/tours/fred-again-6', b2bInd: false },
    ],
  },
]

function filterFutureEvents(events: Event[]): Event[] {
  const today = new Date().toISOString().slice(0, 10)
  return events.filter((e) => e.date >= today)
}

export async function GET(req: NextRequest) {
  const key = process.env.EDMTRAIN_API_KEY
  if (key) {
    const { searchParams } = req.nextUrl
    const latitude = searchParams.get('lat') ?? '37.77'
    const longitude = searchParams.get('lng') ?? '-122.41'
    const state = searchParams.get('state') ?? 'California'
    const url =
      `https://edmtrain.com/api/events` +
      `?latitude=${latitude}&longitude=${longitude}&state=${state}` +
      `&includeElectronicGenreInd=true&client=${key}`
    const upstream = await fetch(url, { next: { revalidate: 3600 } })
    const data = await upstream.json()
    if (data.success && Array.isArray(data.data)) {
      data.data = filterFutureEvents(data.data)
    }
    return NextResponse.json(data)
  }

  return NextResponse.json({ data: filterFutureEvents(DUMMY_EVENTS), success: true })
}
