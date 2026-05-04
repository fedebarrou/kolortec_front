export const FILTER_AXES = [
  {
    id: 'tipo',
    eyebrow: 'Por categoria',
    eyebrowEn: 'By category',
    label: 'Tipo de fixture',
    labelEn: 'Fixture type',
    options: [
      { id: 'cabezal-movil', label: 'Cabezal movil', labelEn: 'Moving head' },
      { id: 'wash', label: 'Wash', labelEn: 'Wash' },
      { id: 'beam', label: 'Beam', labelEn: 'Beam' },
      { id: 'spot', label: 'Spot', labelEn: 'Spot' },
      { id: 'barra-led', label: 'Barra LED', labelEn: 'LED bar' },
      { id: 'estrobo', label: 'Estrobo', labelEn: 'Strobe' },
      { id: 'laser', label: 'Laser', labelEn: 'Laser' },
      { id: 'arquitectural', label: 'Arquitectural', labelEn: 'Architectural' },
      { id: 'control', label: 'Control', labelEn: 'Control' },
    ],
  },
  {
    id: 'aplicacion',
    eyebrow: 'Por uso',
    eyebrowEn: 'By use',
    label: 'Aplicacion',
    labelEn: 'Application',
    options: [
      { id: 'tour', label: 'Tour', labelEn: 'Tour' },
      { id: 'teatro', label: 'Teatro', labelEn: 'Theater' },
      { id: 'arquitectural-permanente', label: 'Arquitectural permanente', labelEn: 'Permanent architectural' },
      { id: 'tv-estudio', label: 'TV / Estudio', labelEn: 'TV / Studio' },
      { id: 'eventos', label: 'Eventos corporativos', labelEn: 'Corporate events' },
    ],
  },
  {
    id: 'fuente',
    eyebrow: 'Por tecnologia',
    eyebrowEn: 'By technology',
    label: 'Fuente',
    labelEn: 'Light source',
    options: [
      { id: 'led', label: 'LED', labelEn: 'LED' },
      { id: 'discharge', label: 'Discharge', labelEn: 'Discharge' },
      { id: 'laser', label: 'Laser', labelEn: 'Laser' },
      { id: 'hibrido', label: 'Hibrido', labelEn: 'Hybrid' },
    ],
  },
]

export function categoryMatchesFilters(category, activeFilters) {
  for (const axis of FILTER_AXES) {
    const selected = activeFilters?.[axis.id] ?? []
    if (selected.length === 0) continue
    const tags = category.tags?.[axis.id] ?? []
    const hasMatch = selected.some((sel) => tags.includes(sel))
    if (!hasMatch) return false
  }
  return true
}

export function countActiveFilters(activeFilters) {
  if (!activeFilters) return 0
  return Object.values(activeFilters).reduce((sum, arr) => sum + (arr?.length ?? 0), 0)
}
