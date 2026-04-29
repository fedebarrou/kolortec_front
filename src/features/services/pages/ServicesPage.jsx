import { Link } from 'react-router-dom'
import { defaultLandingContent } from '../../landing/data/landingData'

function ServicesPage() {
  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <div className="mb-5">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(3.8rem,10vw,7rem)] leading-[1.02]">
          Servicios
          <span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">Preparado para consumir `/landing/services` desde API.</p>
        <Link to="/" className="font-bold text-primary">Volver al landing</Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {defaultLandingContent.services.items.map((item) => (
          <article key={item.title} className="overflow-hidden border border-[#2a2a2a] bg-[#111]">
            <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#2a2a2a]">
              <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 ease-out hover:scale-105" />
            </div>
            <div className="px-4 py-4">
              <h3 className="title-font mb-2 text-[1.35rem]">{item.title}</h3>
              <p className="text-[0.9rem] leading-[1.55] text-[#c4c8ce]">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ServicesPage
