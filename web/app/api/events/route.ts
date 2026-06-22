import { NextRequest, NextResponse } from 'next/server'

function dateWindow(): { start: string; end: string } {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export async function GET(req: NextRequest) {
  const key = process.env.EDMTRAIN_API_KEY
  if (!key) {
    return NextResponse.json({ success: false, message: 'EDMTRAIN_API_KEY not configured' }, { status: 503 })
  }

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
    const { start, end } = dateWindow()
    data.data = data.data.filter((e: { date: string }) => e.date >= start && e.date <= end)
  }
  return NextResponse.json(data)
}
