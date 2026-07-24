import { cqw } from '../responsive'

export function ShapeView({ p }) {
  if (p.shape === 'line') {
    return <div data-fit style={{ width: '100%', height: cqw(Math.max(2, p.radius || 4)), background: p.color, borderRadius: cqw(99) }} />
  }
  return <div data-fit style={{ width: '100%', height: '100%', background: p.color, borderRadius: p.shape === 'circle' ? '50%' : cqw(p.radius) }} />
}
