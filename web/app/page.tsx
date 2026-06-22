import dynamic from 'next/dynamic'

const EventMap = dynamic(() => import('@/components/EventMap'), { ssr: false })

export default function Home() {
  return (
    <main>
      <EventMap />
    </main>
  )
}
