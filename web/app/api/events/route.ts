import { NextRequest, NextResponse } from 'next/server'
import { fetchEvents as fetchTM, fetchEventsRadius as fetchTMRadius } from '@/lib/ticketmaster'
import { fetchEvents as fetchEDT, fetchEventsRadius as fetchEDTRadius } from '@/lib/edmtrain'
import type { Event } from '@/lib/events'

const MAX_RADIUS_MILES = 50

function mergeAndSort(tmEvents: Event[], edtEvents: Event[]): Event[] {
  const edtKeys = new Set(
    edtEvents.map((e) => `${e.venue.latitude.toFixed(3)},${e.venue.longitude.toFixed(3)},${e.date}`)
  )
  const filteredTM = tmEvents.filter(
    (e) => !edtKeys.has(`${e.venue.latitude.toFixed(3)},${e.venue.longitude.toFixed(3)},${e.date}`)
  )
  return [...edtEvents, ...filteredTM].sort((a, b) =>
    a.date === b.date ? (a.startTime ?? '').localeCompare(b.startTime ?? '') : a.date.localeCompare(b.date)
  )
}

export async function GET(req: NextRequest) {
  const tmKey = process.env.TICKETMASTER_API_KEY
  const edtKey = process.env.EDMTRAIN_API_KEY

  if (!tmKey && !edtKey) {
    return NextResponse.json({ success: false, message: 'No API keys configured' }, { status: 503 })
  }

  const { searchParams } = req.nextUrl
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const radiusParam = searchParams.get('radius')

  // Radius search mode
  if (latParam && lngParam && radiusParam) {
    const lat = parseFloat(latParam)
    const lng = parseFloat(lngParam)
    const radius = Math.min(parseFloat(radiusParam), MAX_RADIUS_MILES)

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return NextResponse.json({ success: false, message: 'Invalid lat/lng/radius' }, { status: 400 })
    }

    const [tmResult, edtResult] = await Promise.allSettled([
      tmKey ? fetchTMRadius(tmKey, lat, lng, radius) : Promise.resolve([] as Event[]),
      edtKey ? fetchEDTRadius(edtKey, lat, lng, radius) : Promise.resolve([] as Event[]),
    ])

    return NextResponse.json({
      success: true,
      data: mergeAndSort(
        tmResult.status === 'fulfilled' ? tmResult.value : [],
        edtResult.status === 'fulfilled' ? edtResult.value : [],
      ),
    })
  }

  // Default city search mode
  const [tmResult, edtResult] = await Promise.allSettled([
    tmKey ? fetchTM(tmKey) : Promise.resolve([] as Event[]),
    edtKey ? fetchEDT(edtKey) : Promise.resolve([] as Event[]),
  ])

  return NextResponse.json({
    success: true,
    data: mergeAndSort(
      tmResult.status === 'fulfilled' ? tmResult.value : [],
      edtResult.status === 'fulfilled' ? edtResult.value : [],
    ),
  })
}
