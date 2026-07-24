import { useCallback, useEffect, useState } from 'react'

export function useCarousel({ count, autoplay, intervalMs, loop }) {
  const [index, setIndex] = useState(0)
  const go = useCallback((i) => setIndex(() => (count <= 0 ? 0 : ((i % count) + count) % count)), [count])
  const next = useCallback(() => setIndex((i) => (i + 1 >= count ? (loop ? 0 : i) : i + 1)), [count, loop])
  const prev = useCallback(() => setIndex((i) => (i - 1 < 0 ? (loop ? count - 1 : 0) : i - 1)), [count, loop])
  useEffect(() => {
    if (!autoplay || count <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1 >= count ? (loop ? 0 : i) : i + 1)), intervalMs)
    return () => clearInterval(t)
  }, [autoplay, count, intervalMs, loop])
  return { index, go, next, prev }
}
