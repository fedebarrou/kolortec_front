import { useCallback, useEffect, useRef, useState } from 'react'
import Seo from '../../../shared/seo/Seo'
import { useAuth } from '../../../shared/auth/AuthContext'
import { getGoogleAuthUrl } from '../../../shared/services/contentService'
import {
  CANALES,
  cuerpoDeToggle,
  datosDelPerfil,
  estadoDeCanal,
  historialDe,
  mensajeTrasCambio,
} from '../lib/consentimiento'
import { getMisConsentimientos, setMisConsentimientos } from '../lib/consentimientoApi'

/**
 * /mis-datos — el panel del cliente con sesión: sus datos y, por canal, si recibe promociones.
 * Port de tiendita-store/components/consentimiento/MisDatos.jsx (decisión visual A, 04-oct-2026):
 * lista de ajustes con un interruptor por canal, su estado (aceptado · pendiente · dado de baja)
 * y el historial chico al pie. Los tokens son los de kolortec (negro + amarillo primary, Futura
 * para los títulos, Manrope para el cuerpo, piso de 12px).
 *
 *   GET  /public/me/consentimientos   estado por canal + textos
 *   POST /public/me/consentimientos   {email?:bool, whatsapp?:bool}  true acepta/reactiva · false da de baja
 *
 * SEC-001: WhatsApp se confirma EN WhatsApp; prenderlo deja «pendiente». Sólo acá (con sesión) se reabre una baja.
 * La página de baja del back enlaza a {tienda}/mis-datos: esta es esa ruta.
 */

const CANAL = {
  email: { titulo: 'Por email', icono: 'mail' },
  whatsapp: { titulo: 'Por WhatsApp', icono: 'chat' },
}

/* Chips de estado: texto claro sobre fondo translúcido (AA sobre #0b0b0b); «sin suscribir» y «baja» llevan borde. */
const CHIP = {
  ok: 'bg-emerald-400/15 text-emerald-300',
  pend: 'bg-amber-400/15 text-amber-300',
  baja: 'border border-white/25 bg-white/5 text-slate-300',
  sin: 'border border-white/25 bg-white/5 text-slate-300',
}

const CARD =
  'rounded-[14px] border border-[rgba(244,223,51,0.18)] bg-[#0b0b0b] px-4 py-6 shadow-[0_22px_46px_rgba(0,0,0,0.45)] sm:p-8'

const BTN_PRIMARY =
  'inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-black uppercase tracking-[0.08em] text-[#0b0b0b] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

function Cabecera() {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
        <span className="text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">Mi cuenta</span>
      </div>
      <h1 className="title-font m-0 mt-4 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] text-white">
        Mis datos<span className="text-primary">.</span>
      </h1>
    </div>
  )
}

function Esqueleto() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]" aria-busy="true" aria-label="Cargando tus datos">
      {[0, 1].map((i) => (
        <div key={i} className={`${CARD} animate-pulse`} aria-hidden="true">
          <div className="h-5 w-2/5 rounded bg-white/10" />
          <div className="mt-6 flex flex-col gap-3">
            <div className="h-4 w-11/12 rounded bg-white/10" />
            <div className="h-4 w-8/12 rounded bg-white/10" />
            <div className="h-4 w-9/12 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Ajuste({ canal, fila, destino, ocupado, sinDestino, onToggle }) {
  const { titulo, icono } = CANAL[canal]
  const est = estadoDeCanal(canal, fila)
  return (
    <div className="flex items-center gap-4 border-b border-white/10 py-4" data-testid={`ajuste-${canal}`}>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-white/15 bg-white/5 text-primary"
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-[20px] leading-none">{icono}</span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <b className="text-[0.95rem] font-extrabold text-white">{titulo}</b>
        <span className="[overflow-wrap:anywhere] text-[0.875rem] text-[#aeb5bf]">{destino || 'Sin teléfono cargado'}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.8125rem] text-[#aeb5bf]" data-testid={`estado-${canal}`}>
          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[0.75rem] font-bold ${CHIP[est.chip]}`}>
            <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-current" />
            {est.etiqueta}
          </span>
          {sinDestino ? 'todavía no tenemos tu teléfono: sin él no se puede activar' : est.detalle}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={est.encendido}
        aria-label={titulo}
        disabled={ocupado || sinDestino}
        aria-busy={ocupado || undefined}
        data-testid={`switch-${canal}`}
        onClick={() => onToggle(canal)}
        className="group relative h-[26px] w-11 shrink-0 cursor-pointer rounded-full border-0 bg-slate-500 p-0 transition-colors after:absolute after:-inset-x-1 after:-inset-y-[9px] after:content-[''] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55 aria-checked:bg-primary"
      >
        <i className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform group-aria-checked:translate-x-[18px] group-aria-checked:bg-[#0b0b0b]" />
      </button>
    </div>
  )
}

export default function MisDatosPage() {
  const { user, loading: authLoading } = useAuth()

  const [estado, setEstado] = useState(null) // data de GET /me/consentimientos
  const [cargando, setCargando] = useState(false)
  const [errorCarga, setErrorCarga] = useState(null)
  const [ocupado, setOcupado] = useState({}) // { canal: true } mientras se guarda
  const [aviso, setAviso] = useState(null) // { tipo: 'ok' | 'err', texto }
  const [verTextos, setVerTextos] = useState(false)
  const enVuelo = useRef({})

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    const res = await getMisConsentimientos()
    setCargando(false)
    if (res.ok && res.estado) setEstado(res.estado)
    else setErrorCarga(res.message || 'No pudimos cargar tus preferencias. Intentá de nuevo.')
  }, [])

  useEffect(() => {
    // Carga de datos al tener sesión: el setState ocurre después de un await, no en el cuerpo del efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading && user) cargar()
  }, [authLoading, user, cargar])

  async function onToggle(canal) {
    if (enVuelo.current[canal]) return // latch: un doble toque no manda dos POST
    const fila = estado?.canales?.[canal]
    const cuerpo = cuerpoDeToggle(canal, fila)
    const queria = cuerpo[canal]
    enVuelo.current[canal] = true
    setOcupado((o) => ({ ...o, [canal]: true }))
    setAviso(null)

    // Instantáneo: apagar y prender email se ven al toque. WhatsApp prendido queda «pendiente», no se adelanta.
    const previo = estado
    if (!(canal === 'whatsapp' && queria)) {
      setEstado((e) => ({
        ...e,
        canales: { ...e.canales, [canal]: { ...e.canales[canal], estado: queria ? 'aceptado' : 'baja' } },
      }))
    }

    const res = await setMisConsentimientos(cuerpo)
    enVuelo.current[canal] = false
    setOcupado((o) => ({ ...o, [canal]: false }))

    if (res.ok && res.estado) {
      setEstado(res.estado)
      const destino = canal === 'email' ? user?.email : user?.telefono
      setAviso({ tipo: 'ok', texto: mensajeTrasCambio(canal, queria, res.estado.canales?.[canal], destino) })
    } else {
      setEstado(previo)
      setAviso({ tipo: 'err', texto: res.message || 'No pudimos guardar el cambio. Intentá de nuevo.' })
    }
  }

  const envoltura = (hijos) => (
    <section className="min-h-[52vh] bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title="Mis datos · Kolortec"
        description="Tus datos y tus preferencias de promociones en Kolortec."
        path="/mis-datos"
        noindex
      />
      <Cabecera />
      {hijos}
    </section>
  )

  if (authLoading) return envoltura(<Esqueleto />)

  if (!user) {
    return envoltura(
      <div className={`${CARD} flex max-w-[560px] flex-col items-start gap-4`}>
        <span className="material-symbols-outlined text-[44px] leading-none text-primary" aria-hidden="true">shield_person</span>
        <h2 className="title-font m-0 text-[1.6rem] text-white">
          Ingresá para ver tus preferencias<span className="text-primary">.</span>
        </h2>
        <p className="m-0 text-[0.95rem] leading-relaxed text-[#aeb5bf]">
          Entrá con tu cuenta para ver tus datos y elegir por dónde querés recibir promociones y novedades de Kolortec.
        </p>
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => {
            // Vuelve a /mis-datos (no a la home) una vez identificada.
            window.location.href = getGoogleAuthUrl('/mis-datos')
          }}
        >
          Ingresar
        </button>
      </div>,
    )
  }

  const datos = datosDelPerfil(user)
  const historial = estado ? historialDe(estado.canales) : []

  return envoltura(
    <>
      {errorCarga && (
        <div
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-[0.875rem] text-red-300"
          role="alert"
        >
          <p className="m-0">{errorCarga}</p>
          <button
            type="button"
            onClick={cargar}
            className="h-9 rounded-lg border border-red-300/60 px-4 text-[0.75rem] font-black uppercase tracking-[0.08em] text-red-200 transition hover:bg-red-400/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Reintentar
          </button>
        </div>
      )}

      {cargando && !estado ? (
        <Esqueleto />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]">
          <div className={CARD} data-testid="mis-datos-perfil">
            <h2 className="title-font m-0 mb-1 text-[1.35rem] text-white">Tus datos</h2>
            {datos.map((d) => (
              <div className="flex justify-between gap-4 border-b border-white/10 py-3 text-[0.95rem] last:border-0" key={d.clave}>
                <span className="text-[#aeb5bf]">{d.etiqueta}</span>
                <b className="break-all text-right font-semibold text-white">{d.valor}</b>
              </div>
            ))}
          </div>

          <div className={CARD} data-testid="mis-datos-promociones">
            <h2 className="title-font m-0 mb-1 text-[1.35rem] text-white">Promociones</h2>
            <p className="m-0 text-[0.875rem] leading-relaxed text-[#aeb5bf]">
              Elegí por dónde querés enterarte de promociones y novedades de Kolortec. Los avisos sobre tu cuenta y
              tus consultas te llegan igual: no son promociones.
            </p>

            {estado && (
              <>
                <div className="mt-4 border-t border-white/10">
                  {CANALES.map((canal) => (
                    <Ajuste
                      key={canal}
                      canal={canal}
                      fila={estado.canales?.[canal]}
                      destino={canal === 'email' ? user.email : user.telefono}
                      ocupado={Boolean(ocupado[canal])}
                      sinDestino={!String((canal === 'email' ? user.email : user.telefono) || '').trim()}
                      onToggle={onToggle}
                    />
                  ))}
                </div>

                {aviso && (
                  <p
                    className={`mx-0 mb-0 mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[0.875rem] leading-snug ${
                      aviso.tipo === 'ok'
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                        : 'border-red-400/40 bg-red-400/10 text-red-300'
                    }`}
                    role="status"
                    data-testid="mis-datos-aviso"
                  >
                    <span className="material-symbols-outlined mt-px text-[18px] leading-none" aria-hidden="true">
                      {aviso.tipo === 'ok' ? 'check_circle' : 'error'}
                    </span>
                    <span>{aviso.texto}</span>
                  </p>
                )}

                {historial.length > 0 && (
                  <>
                    <h3 className="mb-2 mt-6 text-[0.8125rem] font-extrabold uppercase tracking-[0.14em] text-white">Últimos cambios</h3>
                    <ul className="m-0 flex list-none flex-col gap-2 p-0" data-testid="mis-datos-historial">
                      {historial.map((h) => (
                        <li key={h.clave} className="flex gap-3 text-[0.875rem] text-[#d5d9e0]">
                          <time className="min-w-[84px] whitespace-nowrap text-[#aeb5bf]">{h.fecha}</time>
                          <span className="min-w-0 [overflow-wrap:anywhere]">{h.texto}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {estado.texto_version && (
                  <p className="mb-0 mt-4 text-[0.8125rem] text-[#aeb5bf]">
                    Texto aceptado: versión {estado.texto_version} ·{' '}
                    <button
                      type="button"
                      aria-expanded={verTextos}
                      onClick={() => setVerTextos((v) => !v)}
                      className="cursor-pointer border-0 bg-transparent p-0 text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {verTextos ? 'ocultar el texto' : 'ver el texto'}
                    </button>
                  </p>
                )}
                {verTextos && (
                  <ul className="mb-0 mt-2 flex list-disc flex-col gap-1 pl-4 text-[0.8125rem] text-[#aeb5bf]">
                    {estado.email && <li>{estado.email}</li>}
                    {estado.whatsapp && <li>{estado.whatsapp}</li>}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>,
  )
}
