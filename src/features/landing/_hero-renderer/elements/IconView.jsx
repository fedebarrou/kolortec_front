import { cqw } from '../responsive'
import { CONTENT_ICONS } from './contentIcons'
import { cssColor } from '../cssSafe'

export function IconView({ p }) {
  const Cmp = CONTENT_ICONS[p.name] ?? CONTENT_ICONS.Star
  return (
    <span data-fit style={{ display: 'inline-flex', color: cssColor(p.color), fontSize: cqw(p.size), lineHeight: 0 }}>
      <Cmp size="1em" strokeWidth={p.strokeWidth} />
    </span>
  )
}
