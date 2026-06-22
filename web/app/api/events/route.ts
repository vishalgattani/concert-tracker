import { NextRequest, NextResponse } from 'next/server'
import { fetchEvents as fetchTM } from '@/lib/ticketmaster'
import { fetchEvents as fetchEDT } from '@/lib/edmtrain'
import type { Event } from '@/lib/events'

export async function GET(req: NextRequest) {
  const tmKey = process.env.TICKETMASTER_API_KEY
  const edtKey = process.env.EDMTRAIN_API_KEY

  if (!tmKey && !edtKey) {
    return NextResponse.json({ success: false, message: 'No API keys configured' }, { status: 503 })
  }

  const { searchParams } = req.nextUrl
  const city = searchParams.get('city') ?? 'San Francisco'

  const [tmResult, edtResult] = await Promise.allSettled([
    tmKey ? fetchTM(tmKey, city) : Promise.resolve([] as Event[]),
    edtKey ? fetchEDT(edtKey) : Promise.resolve([] as Event[]),
  ])

  const tmEvents = tmResult.status === 'fulfilled' ? tmResult.value : []
  const edtEvents = edtResult.status === 'fulfilled' ? edtResult.value : []

  // Dedupe: if an EDMTrain event has the same venue coords + date as a TM event, drop the TM one
  // (EDMTrain links are more specific for electronic events)
  const edtKeys = new Set(
    edtEvents.map((e) => `${e.venue.latitude.toFixed(3)},${e.venue.longitude.toFixed(3)},${e.date}`)
  )
  const filteredTM = tmEvents.filter(
    (e) => !edtKeys.has(`${e.venue.latitude.toFixed(3)},${e.venue.longitude.toFixed(3)},${e.date}`)
  )

  const events = [...edtEvents, ...filteredTM].sort((a, b) =>
    a.date === b.date ? (a.startTime ?? '').localeCompare(b.startTime ?? '') : a.date.localeCompare(b.date)
  )

  return NextResponse.json({ success: true, data: events })
}
