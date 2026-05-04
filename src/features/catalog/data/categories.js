export const PRODUCT_CATEGORIES = [
  {
    slug: 'cabezales-moviles',
    name: 'Cabezales Moviles',
    nameEn: 'Moving Heads',
    description: 'Spots, beams y wash motorizados con maxima precision y rango.',
    descriptionEn: 'Motorized spots, beams, and wash with maximum precision and range.',
    image: '/assets/products/prod-001.png',
    tags: {
      tipo: ['cabezal-movil'],
      aplicacion: ['tour', 'teatro', 'tv-estudio', 'eventos'],
      fuente: ['led', 'discharge', 'hibrido'],
    },
  },
  {
    slug: 'wash-flood',
    name: 'Wash & Flood',
    nameEn: 'Wash & Flood',
    description: 'Iluminacion uniforme de alto flujo para grandes superficies.',
    descriptionEn: 'High-output uniform illumination for large surfaces.',
    image: '/assets/products/prod-002.png',
    tags: {
      tipo: ['wash'],
      aplicacion: ['tour', 'arquitectural-permanente', 'tv-estudio', 'eventos'],
      fuente: ['led'],
    },
  },
  {
    slug: 'beam-spot',
    name: 'Beam & Spot',
    nameEn: 'Beam & Spot',
    description: 'Haces concentrados y definidos para diseno de aire.',
    descriptionEn: 'Concentrated, sharp beams for aerial design work.',
    image: '/assets/products/prod-003.png',
    tags: {
      tipo: ['beam', 'spot'],
      aplicacion: ['tour', 'teatro', 'eventos'],
      fuente: ['led', 'discharge'],
    },
  },
  {
    slug: 'barras-led',
    name: 'Barras LED',
    nameEn: 'LED Bars',
    description: 'Sistemas modulares lineales para arrays y backdrops.',
    descriptionEn: 'Modular linear systems for arrays and backdrops.',
    image: '/assets/products/prod-004.png',
    tags: {
      tipo: ['barra-led'],
      aplicacion: ['tour', 'tv-estudio', 'eventos'],
      fuente: ['led'],
    },
  },
  {
    slug: 'arquitectural',
    name: 'Arquitectural',
    nameEn: 'Architectural',
    description: 'Soluciones permanentes IP65 para edificios y espacios urbanos.',
    descriptionEn: 'Permanent IP65 solutions for buildings and urban spaces.',
    image: '/assets/products/prod-005.png',
    tags: {
      tipo: ['arquitectural'],
      aplicacion: ['arquitectural-permanente'],
      fuente: ['led'],
    },
  },
  {
    slug: 'laser',
    name: 'Laser',
    nameEn: 'Laser',
    description: 'Proyectores laser de alto contraste para shows y mapping.',
    descriptionEn: 'High-contrast laser projectors for shows and mapping.',
    image: '/assets/products/prod-006.png',
    tags: {
      tipo: ['laser'],
      aplicacion: ['tour', 'teatro', 'eventos'],
      fuente: ['laser'],
    },
  },
  {
    slug: 'estrobos-blinders',
    name: 'Estrobos & Blinders',
    nameEn: 'Strobes & Blinders',
    description: 'Pulsos de alta intensidad y wash dirigido a publico.',
    descriptionEn: 'High-intensity pulses and audience-directed wash.',
    image: '/assets/products/prod-007.png',
    tags: {
      tipo: ['estrobo'],
      aplicacion: ['tour', 'eventos'],
      fuente: ['led'],
    },
  },
  {
    slug: 'control-accesorios',
    name: 'Control & Accesorios',
    nameEn: 'Control & Accessories',
    description: 'Consolas, splitters, cases y partes de repuesto.',
    descriptionEn: 'Consoles, splitters, cases, and spare parts.',
    image: '/assets/products/prod-008.png',
    tags: {
      tipo: ['control'],
      aplicacion: ['tour', 'teatro', 'arquitectural-permanente', 'tv-estudio', 'eventos'],
      fuente: [],
    },
  },
]

export function getCategoryBySlug(slug) {
  if (!slug) return null
  return PRODUCT_CATEGORIES.find((category) => category.slug === slug) ?? null
}
