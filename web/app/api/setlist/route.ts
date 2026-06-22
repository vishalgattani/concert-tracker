import { NextRequest, NextResponse } from 'next/server'

interface SetlistSong { name: string }
interface SetlistSet { song?: SetlistSong[] }
interface SetlistEntry {
  eventDate: string
  url: string
  venue?: { name?: string; city?: { name?: string } }
  sets?: { set?: SetlistSet[] }
}

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist')
  if (!artist) return NextResponse.json({ success: false, setlists: [] }, { status: 400 })

  const key = process.env.SETLISTFM_API_KEY
  if (!key) return NextResponse.json({ success: false, setlists: [] })

  const res = await fetch(
    `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&p=1`,
    // Cache 24h: same artist costs 1 call/day max (limit is 1440/day, 2/sec)
    { headers: { 'x-api-key': key, Accept: 'application/json' }, next: { revalidate: 86400 } },
  )
  if (!res.ok) return NextResponse.json({ success: false, setlists: [] })

  const data = await res.json()
  const raw: SetlistEntry[] = data.setlist ?? []

  // Only return setlists that have songs recorded (past concerts)
  const withSongs = raw.filter((s) =>
    (s.sets?.set ?? []).some((set) => (set.song ?? []).length > 0),
  )

  const setlists = withSongs.slice(0, 2).map((s) => ({
    date: s.eventDate,
    venue: s.venue?.name ?? '',
    city: s.venue?.city?.name ?? '',
    songs: (s.sets?.set ?? []).flatMap((set) => (set.song ?? []).map((song) => song.name)),
    url: s.url,
  }))

  return NextResponse.json({ success: true, setlists })
}
