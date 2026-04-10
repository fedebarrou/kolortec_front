import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

const SUPPORTED_LANGS = ['es', 'en']
const STORAGE_KEY = 'kolortec-lang'

const getByPath = (source, path) => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), source)
}

const getInitialLang = () => {
  if (typeof window === 'undefined') return 'es'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored

  const browserLang = (window.navigator.language || '').toLowerCase()
  return browserLang.startsWith('es') ? 'es' : 'en'
}

const LanguageContext = createContext({
  lang: 'es',
  setLang: () => {},
  t: (path, fallback = '') => fallback,
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const setLang = (nextLang) => {
    if (!SUPPORTED_LANGS.includes(nextLang)) return
    setLangState(nextLang)
  }

  const value = useMemo(() => {
    const t = (path, fallback = '') => {
      const valueByPath = getByPath(translations[lang], path)
      if (valueByPath == null) return fallback
      return valueByPath
    }

    return { lang, setLang, t }
  }, [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}

