// Branding por LÍNEA de producto (tiles del step 1 del scrollytelling).
// En tiendita la línea es solo un NOMBRE (string); acá mapeamos las conocidas a su color/tipografía/marca.
// Líneas sin branding definido → tile neutro (oscuro + acento primary). Editable: agregar/ajustar acá.
const BRANDS = {
  'golden line': { bg: '#efe5cb', bg2: '#ddd0ad', fg: '#3a2f14', accent: '#b8923f', font: "Georgia, 'Times New Roman', serif", mark: 'lines' },
  'beam':        { bg: '#0b2a6b', bg2: '#071d4d', fg: '#dbe8ff', accent: '#5b9bff', font: "'Arial Narrow', Arial, sans-serif", mark: 'beam' },
  'wash':        { bg: '#3a1258', bg2: '#280c3e', fg: '#f0dcff', accent: '#c084fc', font: "'Trebuchet MS', sans-serif", mark: 'wash' },
  'spot':        { bg: '#5a3200', bg2: '#3f2300', fg: '#ffe9c7', accent: '#ffb43d', font: "'Segoe UI', system-ui, sans-serif", mark: 'spot' },
  'pro stage':   { bg: '#3a0d0d', bg2: '#280808', fg: '#ffd9d9', accent: '#ff6b6b', font: "Impact, 'Arial Black', sans-serif", mark: 'stage' },
}

const NEUTRAL = { bg: '#17171c', bg2: '#0e0e11', fg: '#e9ecf2', accent: '#f4df33', font: 'inherit', mark: 'dot' }

export function getLineBrand(name) {
  const key = (name || '').trim().toLowerCase()
  return BRANDS[key] || NEUTRAL
}

// Mini-marca por línea. Usa `currentColor` (= accent del tile).
export function LineMark({ kind }) {
  switch (kind) {
    case 'lines':
      return (
        <span className="flex flex-col gap-[3px]" aria-hidden="true">
          <span className="block h-[2.5px] w-[30px] rounded-sm bg-current" />
          <span className="block h-[2.5px] w-[30px] rounded-sm bg-current" />
          <span className="block h-[2.5px] w-[30px] rounded-sm bg-current" />
        </span>
      )
    case 'beam':
      return <span aria-hidden="true" className="block h-0 w-0 border-x-[7px] border-x-transparent border-b-[15px] border-b-current" />
    case 'spot':
      return <span aria-hidden="true" className="block h-[14px] w-[14px] rounded-full bg-current shadow-[0_0_12px_currentColor]" />
    case 'wash':
      return <span aria-hidden="true" className="block h-[12px] w-[38px] rounded-lg" style={{ background: 'linear-gradient(90deg,currentColor,transparent)' }} />
    case 'stage':
      return (
        <span aria-hidden="true" className="flex h-[15px] items-end gap-[3px]">
          <span className="block w-[4px] rounded-[1px] bg-current" style={{ height: '8px' }} />
          <span className="block w-[4px] rounded-[1px] bg-current" style={{ height: '15px' }} />
          <span className="block w-[4px] rounded-[1px] bg-current" style={{ height: '11px' }} />
        </span>
      )
    default:
      return <span aria-hidden="true" className="block h-[10px] w-[10px] rounded-full bg-current" />
  }
}
