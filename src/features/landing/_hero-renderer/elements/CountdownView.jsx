import { useEffect, useState } from 'react'
import { cqw } from '../responsive'

export function CountdownView({ p }) {
  const labels = p.labels || { days: 'd', hours: 'h', minutes: 'm', seconds: 's' }
  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (now === null) {
    return (
      <div data-fit style={{ display: 'flex', gap: cqw(10), fontWeight: 800, fontSize: cqw(20) }}>
        {[labels.days, labels.hours, labels.minutes, labels.seconds].map((l, i) => (
          <span key={i}>--<small style={{ opacity: .7, marginLeft: cqw(2), fontSize: cqw(11) }}>{l}</small></span>
        ))}
      </div>
    )
  }

  const diff = new Date(p.targetISO).getTime() - now
  if (diff <= 0) return <div data-fit style={{ fontSize: cqw(18), fontWeight: 700 }}>{p.expiredText}</div>
  const s = Math.floor(diff / 1000)
  const parts = [[Math.floor(s / 86400), labels.days], [Math.floor((s % 86400) / 3600), labels.hours], [Math.floor((s % 3600) / 60), labels.minutes], [s % 60, labels.seconds]]
  return (
    <div data-fit style={{ display: 'flex', gap: cqw(10), fontWeight: 800, fontSize: cqw(20) }}>
      {parts.map(([v, l], i) => <span key={i}>{String(v).padStart(2, '0')}<small style={{ opacity: .7, marginLeft: cqw(2), fontSize: cqw(11) }}>{l}</small></span>)}
    </div>
  )
}
