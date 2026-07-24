import { Star, StarHalf } from 'lucide-react'
import { cqw } from '../responsive'

export function RatingView({ p }) {
  const max = Math.max(1, Math.min(10, Math.round(p.max)))
  return (
    <div data-fit style={{ display: 'inline-flex', alignItems: 'center', gap: cqw(2), color: p.color, fontSize: cqw(p.size) }}>
      {Array.from({ length: max }).map((_, i) => {
        const full = i + 1 <= p.value
        const half = !full && i + 0.5 <= p.value
        if (half) return <StarHalf key={i} size="1em" fill="currentColor" strokeWidth={0} />
        return <Star key={i} size="1em" fill={full ? 'currentColor' : 'none'} strokeWidth={full ? 0 : 1.5} />
      })}
    </div>
  )
}
