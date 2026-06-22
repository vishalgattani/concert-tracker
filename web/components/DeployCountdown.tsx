'use client'

import { useEffect, useState } from 'react'

// Nightly deploy: cron 0 6 * * * = 6am UTC (11pm PT)
function getDeployInfo() {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(6, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)

  const msUntil = next.getTime() - now.getTime()
  const totalMs = 24 * 60 * 60 * 1000
  // 1 = full circle (just deployed), drains to 0 as next deploy approaches
  const progress = msUntil / totalMs

  const h = Math.floor(msUntil / (1000 * 60 * 60))
  const m = Math.floor((msUntil % (1000 * 60 * 60)) / (1000 * 60))

  const nextLocal = next.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    timeZone: 'America/Los_Angeles',
  })

  return { progress, h, m, nextLocal }
}

const SIZE = 36
const R = 13
const CIRC = 2 * Math.PI * R

export default function DeployCountdown() {
  const [info, setInfo] = useState(getDeployInfo)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setInfo(getDeployInfo()), 60_000)
    return () => clearInterval(id)
  }, [])

  const offset = CIRC * (1 - info.progress)

  return (
    <div
      style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Circular progress ring */}
      <div style={{
        width: SIZE, height: SIZE, borderRadius: 4,
        background: 'rgba(0,0,0,0.35)', boxShadow: '0 0 0 2px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default',
      }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="white" strokeWidth={3}
            strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Hover tooltip panel */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, right: SIZE + 8,
          width: 220, background: '#1a1a1a', border: '1px solid #333',
          borderRadius: 8, padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          color: '#eee', fontSize: 12, lineHeight: 1.5, pointerEvents: 'none',
          whiteSpace: 'normal',
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#fff' }}>
            🔄 Nightly Deploy
          </div>
          <div style={{ color: '#aaa', marginBottom: 8 }}>
            Event data refreshes automatically every night at <strong style={{ color: '#eee' }}>11 pm PT</strong> (6 am UTC).
          </div>
          <div style={{ color: '#aaa', marginBottom: 6 }}>
            The circle is <strong style={{ color: '#fff' }}>full</strong> right after a deploy and drains as the next one approaches.
          </div>
          <div style={{
            borderTop: '1px solid #333', paddingTop: 8, marginTop: 4,
            color: '#888', fontSize: 11,
          }}>
            Next deploy in{' '}
            <strong style={{ color: '#0af' }}>{info.h}h {info.m}m</strong>
            <br />
            <span style={{ color: '#555' }}>{info.nextLocal}</span>
          </div>
        </div>
      )}
    </div>
  )
}
