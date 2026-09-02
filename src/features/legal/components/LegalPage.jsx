import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../../shared/seo/Seo'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { getDatosResponsable } from '../../../shared/services/contentService'
import { DATOS_LEGALES, armarResponsable } from '../data/datosLegales'

/**
 * LegalPage — armazón de las páginas legales (privacidad y términos).
 *
 * Las dos comparten estructura, así que el layout vive acá una sola vez y cada
 * página aporta sólo su contenido, como un array de secciones. Eso mantiene el
 * texto legible en su archivo (que es lo que alguien va a querer revisar) y
 * evita que las dos páginas se despeguen visualmente con el tiempo.
 *
 * IDIOMA: el contenido está en castellano y no se traduce. La ley aplicable es
 * argentina y los términos que definen derechos no se traducen "al vuelo" sin
 * que un abogado mire el resultado: una palabra distinta cambia una obligación.
 * Cuando el sitio está en inglés se muestra arriba un aviso diciendo que la
 * versión vinculante es la castellana, que es la práctica habitual.
 *
 * ANCHO DE LECTURA: `max-w-[68ch]` sobre el cuerpo. El `ch` mide el ancho del
 * "0", más ancho que el glifo promedio, así que rinde ~62 caracteres reales por
 * línea — dentro del rango cómodo de lectura para un texto largo y denso.
 */

/** Un párrafo, una lista o una cláusula citada textual. */
function Bloque({ bloque }) {
  if (typeof bloque === 'string') {
    return <p className="m-0 text-[0.95rem] leading-[1.7] text-[#b7bbc4]">{bloque}</p>
  }

  if (bloque.tipo === 'lista') {
    return (
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {bloque.items.map((item, i) => (
          <li key={i} className="relative pl-5 text-[0.95rem] leading-[1.7] text-[#b7bbc4]">
            <span aria-hidden="true" className="absolute left-0 top-[0.7em] block h-[2px] w-2.5 bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    )
  }

  if (bloque.tipo === 'definiciones') {
    return (
      <dl className="m-0 flex flex-col gap-3">
        {bloque.items.map(({ termino, texto }, i) => (
          <div key={i} className="flex flex-col gap-1">
            <dt className="text-[0.75rem] font-black uppercase tracking-[0.14em] text-[#e8eaee]">{termino}</dt>
            <dd className="m-0 text-[0.95rem] leading-[1.7] text-[#b7bbc4]">{texto}</dd>
          </div>
        ))}
      </dl>
    )
  }

  /* `cita`: texto que la norma obliga a reproducir LITERALMENTE. Va destacado
     no por estética sino porque no se puede editar — el recuadro avisa que
     esas palabras son las de la ley, no las nuestras. */
  if (bloque.tipo === 'cita') {
    return (
      <blockquote className="m-0 border-l-2 border-primary bg-[#121215] py-4 pl-5 pr-4">
        <p className="m-0 text-[0.95rem] leading-[1.7] text-[#d6d9df]">{bloque.texto}</p>
        {bloque.fuente ? (
          <p className="m-0 mt-2 text-[0.75rem] uppercase tracking-[0.12em] text-[#8b8f98]">{bloque.fuente}</p>
        ) : null}
      </blockquote>
    )
  }

  return null
}

function LegalPage({ eyebrow, titulo, bajada, ruta, seoTitle, seoDesc, secciones }) {
  const { t, language } = useLanguage()
  const [responsable, setResponsable] = useState(() => armarResponsable())

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    let vivo = true
    getDatosResponsable()
      .then((datos) => { if (vivo) setResponsable(armarResponsable(datos)) })
      .catch(() => { /* Sin API queda el respaldo: la página nunca se cae. */ })
    return () => { vivo = false }
  }, [])

  const bloques = typeof secciones === 'function' ? secciones(responsable) : secciones

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo title={seoTitle} description={seoDesc} path={ruta} />

      <div className="mb-10 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {titulo}<span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[60ch] text-[1rem] leading-[1.55] text-[#b7bbc4]">{bajada}</p>

        <p className="m-0 text-[0.75rem] uppercase tracking-[0.14em] text-[#8b8f98]">
          Última actualización: {DATOS_LEGALES.ultimaActualizacion}
        </p>

        {language === 'en' ? (
          <p className="m-0 max-w-[60ch] border-l-2 border-[#3a3d42] pl-4 text-[0.85rem] leading-[1.6] text-[#8b8f98]">
            This document is available in Spanish only. Argentine law applies, and the Spanish
            version is the binding one.
          </p>
        ) : null}

        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-primary transition hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {t('warranty.page.back', 'Volver al inicio')}
        </Link>
      </div>

      <div data-legal-body className="flex max-w-[68ch] flex-col gap-10">
        {bloques.map((seccion, i) => (
          <article key={i} className="flex flex-col gap-3">
            <h2
              id={seccion.id}
              className="title-font m-0 scroll-mt-24 text-[clamp(1.15rem,2.2vw,1.5rem)] leading-[1.2] text-[#f2f2f2]"
            >
              {seccion.titulo}
            </h2>
            {seccion.bloques.map((bloque, j) => <Bloque key={j} bloque={bloque} />)}
          </article>
        ))}
      </div>
    </section>
  )
}

export default LegalPage
