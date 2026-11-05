import { useState, useSyncExternalStore } from 'react'
import { cqw } from '../responsive'
import { typoStyle } from './typo'

// Slot tipográfico (mismas claves que _editor/typoSlots.js#countdown — no se
// importa desde acá para que este archivo se pueda copiar byte-idéntico a
// la store, que no tiene _editor/).
const COUNTDOWN_SLOT = { font: 'fontFamily', weight: 'weight', size: 'fontSize', lh: 'lineHeight', ls: 'letterSpacingEm', color: 'color' }

// Reloj de 1s como store externo: el snapshot de servidor es null (placeholder
// "--", igual que antes) y en el cliente arranca en Date.now() y avanza cada segundo.
function createClock() {
  let now = Date.now()
  return {
    subscribe(cb) {
      const t = setInterval(() => { now = Date.now(); cb() }, 1000)
      return () => clearInterval(t)
    },
    getSnapshot: () => now,
  }
}
const getServerNow = () => null

// Un diseño puede llegar sin rótulos ni fecha (una propuesta de la IA, uno viejo): se muestra igual, nunca tira la pantalla.
const ROTULOS = { days: 'd', hours: 'h', minutes: 'm', seconds: 's' }

export function CountdownView({ p }) {
  const [clock] = useState(createClock)
  const now = useSyncExternalStore(clock.subscribe, clock.getSnapshot, getServerNow)

  // Placeholder (now===null) y conteo activo comparten el mismo tamaño hoy
  // (cqw(20)); el mensaje de vencido usa cqw(18) — ramas distintas, cada una
  // con su propio fallback (no hay un único valor "hardcodeado" para las 3).
  const mainTypo = typoStyle(p, COUNTDOWN_SLOT, { fontFamily: 'inherit', fontWeight: 800, fontSize: cqw(20) })
  const labels = { ...ROTULOS, ...(p.labels || {}) }
  const target = new Date(p.targetISO).getTime()

  if (now === null || !Number.isFinite(target)) {
    return (
      <div data-fit style={{ display: 'flex', gap: cqw(10), ...mainTypo }}>
        {[labels.days, labels.hours, labels.minutes, labels.seconds].map((l, i) => (
          <span key={i}>--<small style={{ opacity: .7, marginLeft: cqw(2), fontSize: cqw(11) }}>{l}</small></span>
        ))}
      </div>
    )
  }

  const diff = target - now
  if (diff <= 0) {
    const expiredTypo = typoStyle(p, COUNTDOWN_SLOT, { fontFamily: 'inherit', fontWeight: 700, fontSize: cqw(18) })
    return <div data-fit style={expiredTypo}>{p.expiredText}</div>
  }
  const s = Math.floor(diff / 1000)
  const parts = [[Math.floor(s / 86400), labels.days], [Math.floor((s % 86400) / 3600), labels.hours], [Math.floor((s % 3600) / 60), labels.minutes], [s % 60, labels.seconds]]
  return (
    <div data-fit style={{ display: 'flex', gap: cqw(10), ...mainTypo }}>
      {parts.map(([v, l], i) => <span key={i}>{String(v).padStart(2, '0')}<small style={{ opacity: .7, marginLeft: cqw(2), fontSize: cqw(11) }}>{l}</small></span>)}
    </div>
  )
}
