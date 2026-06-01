import type { Metadata } from 'next'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Concert Tracker',
  description: 'EDM events map powered by EDMTrain',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
