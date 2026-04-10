import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import HeaderSection from './HeaderSection'
import FooterSection from './FooterSection'

function LandingChrome({ loading, children }) {
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false)

  useEffect(() => {
    if (!isWhatsAppDialogOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsWhatsAppDialogOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isWhatsAppDialogOpen])

  return (
    <div className="bg-[#050505]">
      <HeaderSection />
      <main>{children ?? <Outlet />}</main>
      <FooterSection />
      <button
        type="button"
        className="fixed right-4 bottom-4 z-[1400] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_12px_26px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:scale-[1.02]"
        onClick={() => setIsWhatsAppDialogOpen(true)}
        aria-label="Abrir chat de WhatsApp"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>

      {isWhatsAppDialogOpen ? (
        <div
          className="fixed inset-0 z-[1600] grid place-items-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Elegir tipo de chat de WhatsApp"
          onClick={() => setIsWhatsAppDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#2a2a2a] bg-[#111] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="title-font text-[1.3rem] text-white">WhatsApp</h3>
            <p className="mt-1 text-sm text-[#aeb5bf]">Elegí el tipo de chat:</p>
            <div className="mt-4 grid gap-2">
              <a
                className="rounded-lg bg-primary px-4 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-[#0b0b0b]"
                href="https://wa.me/5491155555555?text=Hola%20equipo%20de%20ventas%2C%20quiero%20asesoramiento%20comercial."
                target="_blank"
                rel="noreferrer"
              >
                Chatear con Ventas
              </a>
              <a
                className="rounded-lg border border-[#2f3a2f] bg-[#1a231a] px-4 py-3 text-center text-sm font-black uppercase tracking-[0.08em] text-[#d5f5dd]"
                href="https://wa.me/5491155555555?text=Hola%20equipo%20de%20soporte%2C%20necesito%20ayuda%20t%C3%A9cnica."
                target="_blank"
                rel="noreferrer"
              >
                Chatear con Soporte
              </a>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-[#2a2a2a] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[#c6ccd7]"
              onClick={() => setIsWhatsAppDialogOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <div className="fixed bottom-3 left-1/2 z-[1500] -translate-x-1/2 rounded-full border border-[#3a3a3a] bg-[rgba(20,20,20,0.92)] px-3 py-2 text-xs text-[#d0d0d0]">Syncing from API...</div> : null}
    </div>
  )
}

export default LandingChrome
