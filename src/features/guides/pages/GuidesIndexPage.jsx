import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../../shared/seo/Seo'
import { getGuides } from '../../../shared/services/contentService'

function GuidesIndexPage() {
  // Data-driven: las guías salen de tiendita; si la cuenta no tiene, la lista queda vacía
  // (empty state) en vez de mostrar las guías hardcodeadas.
  const [guides, setGuides] = useState([])

  useEffect(() => {
    let cancelled = false
    getGuides().then((data) => {
      if (!cancelled) setGuides(Array.isArray(data) ? data : [])
    })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title="Guías técnicas de iluminación escénica · Soporte Kolortec"
        description="Cluster de guías técnicas: diagnóstico de cabezales móviles, errores DMX, mantenimiento de consolas y reparación profesional. Soporte local Kolortec."
        path="/soporte/guias"
      />

      <nav className="mb-5 flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be]" aria-label="Breadcrumb">
        <Link to="/soporte" className="transition hover:text-primary">Soporte</Link>
        <span aria-hidden="true">/</span>
        <span className="text-white">Guías</span>
      </nav>

      <header className="mb-10 grid max-w-[80ch] gap-3 kt-reveal">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">
            Cluster Soporte
          </span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Guías técnicas<span className="text-primary">.</span>
        </h1>
        <p className="m-0 text-[1.05rem] leading-[1.55] text-[#cfd4dc]">
          Diagnóstico, mantenimiento y reparación de iluminación profesional. Las preguntas que recibimos en soporte, respondidas en profundidad.
        </p>
      </header>

      {guides.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#2a2a2a] bg-[#0f0f10] p-10 text-center kt-reveal">
          <p className="m-0 text-[0.95rem] text-[#aeb5bf]">
            Todavía no hay guías publicadas.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 list-none m-0 p-0 md:grid-cols-2 kt-reveal">
          {guides.map((g) => (
            <li key={g.slug} className="kt-reveal-item">
              <Link
                to={`/soporte/guias/${g.slug}`}
                className="block rounded-[12px] border border-[#2a2a2a] bg-[#0f0f10] p-5 transition hover:-translate-y-0.5 hover:border-primary/55"
              >
                <h2 className="title-font m-0 mb-2 text-[1.15rem] leading-[1.25] text-white">
                  {g.title}
                </h2>
                <p className="m-0 text-[0.92rem] leading-[1.55] text-[#aeb5bf]">{g.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default GuidesIndexPage
