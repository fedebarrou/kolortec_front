import { cqw } from '../responsive'
import { CONTENT_ICONS } from './contentIcons'

export function IconView({ p }) {
  const Cmp = CONTENT_ICONS[p.name] ?? CONTENT_ICONS.Star
  return (
    <span data-fit style={{ display: 'inline-flex', color: p.color, fontSize: cqw(p.size), lineHeight: 0 }}>
      <Cmp size="1em" strokeWidth={p.strokeWidth} />
    </span>
  )
}
