import { useEffect, useState } from 'react'
import { cqw } from '../responsive'
import { typoStyle } from './typo'

// Slot tipográfico (mismas claves que _editor/typoSlots.js#countdown — no se
// importa desde acá para que este archivo se pueda copiar byte-idéntico a
// la store, que no tiene _editor/).
const COUNTDOWN_SLOT = { font: 'fontFamily', weight: 'weight', size: 'fontSize', lh: 'lineHeight', ls: 'letterSpacingEm', color: 'color' }

export function CountdownView({ p }) {
  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Placeholder (now===null) y conteo activo comparten el mismo tamaño hoy
  // (cqw(20)); el mensaje de vencido usa cqw(18) — ramas distintas, cada una
  // con su propio fallback (no hay un único valor "hardcodeado" para las 3).
  const mainTypo = typoStyle(p, COUNTDOWN_SLOT, { fontFamily: 'inherit', fontWeight: 800, fontSize: cqw(20) })

  if (now === null) {
    return (
      <div data-fit style={{ display: 'flex', gap: cqw(10), ...mainTypo }}>
        {[p.labels.days, p.labels.hours, p.labels.minutes, p.labels.seconds].map((l, i) => (
          <span key={i}>--<small style={{ opacity: .7, marginLeft: cqw(2), fontSize: cqw(11) }}>{l}</small></span>
        ))}
      </div>
    )
  }

  const diff = new Date(p.targetISO).getTime() - now
  if (diff <= 0) {
    const expiredTypo = typoStyle(p, COUNTDOWN_SLOT, { fontFamily: 'inherit', fontWeight: 700, fontSize: cqw(18) })
    return <div data-fit style={expiredTypo}>{p.expiredText}</div>
  }
  const s = Math.floor(diff / 1000)
  const parts = [[Math.floor(s / 86400), p.labels.days], [Math.floor((s % 86400) / 3600), p.labels.hours], [Math.floor((s % 3600) / 60), p.labels.minutes], [s % 60, p.labels.seconds]]
  return (
    <div data-fit style={{ display: 'flex', gap: cqw(10), ...mainTypo }}>
      {parts.map(([v, l], i) => <span key={i}>{String(v).padStart(2, '0')}<small style={{ opacity: .7, marginLeft: cqw(2), fontSize: cqw(11) }}>{l}</small></span>)}
    </div>
  )
}
