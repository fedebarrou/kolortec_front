import { useEffect } from 'react'

const BRAND = 'KOLORTEC'

export function usePageTitle(section) {
  useEffect(() => {
    const trimmed = (section ?? '').toString().trim()
    document.title = trimmed ? `${trimmed} | ${BRAND}` : BRAND
    return () => {
      document.title = BRAND
    }
  }, [section])
}

export default usePageTitle
