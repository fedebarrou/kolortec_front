import { useCallback, useEffect, useState } from 'react'

/**
 * durationForIndex(i) — opcional: duración en ms del slide `i` (settings.slideDurations
 * por-slide, ver docs/scroll-hero-contract.md). Sin ella, o sin valor propio para ese
 * slide, se usa `intervalMs`. El autoplay reprograma su propio timer en cada cambio de
 * `index` (en vez de un `setInterval` fijo) para que cada slide respete SU duración.
 */
export function useCarousel({ count, autoplay, intervalMs, loop, durationForIndex }) {
  const [index, setIndex] = useState(0)
  const go = useCallback((i) => setIndex(() => (count <= 0 ? 0 : ((i % count) + count) % count)), [count])
  const next = useCallback(() => setIndex((i) => (i + 1 >= count ? (loop ? 0 : i) : i + 1)), [count, loop])
  const prev = useCallback(() => setIndex((i) => (i - 1 < 0 ? (loop ? count - 1 : 0) : i - 1)), [count, loop])
  useEffect(() => {
    if (!autoplay || count <= 1) return
    const dur = Math.max(300, (durationForIndex ? durationForIndex(index) : null) || intervalMs || 4000)
    const t = setTimeout(() => setIndex((i) => (i + 1 >= count ? (loop ? 0 : i) : i + 1)), dur)
    return () => clearTimeout(t)
  }, [autoplay, count, intervalMs, loop, index, durationForIndex])
  return { index, go, next, prev }
}
