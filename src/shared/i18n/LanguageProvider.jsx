import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

const SUPPORTED_LANGS = ['es', 'en']
/* Clave nueva a propósito (13-nov-2026). La anterior, `kolortec-lang`, se escribía en CADA carga con el idioma
   deducido del navegador, así que no distingue «eligió inglés» de «tenía el navegador en inglés». Leerla dejaría en
   inglés a todo el que ya entró una vez. Esta sólo se escribe cuando el visitante toca el selector. */
const STORAGE_KEY = 'kolortec-lang-elegido'

const getByPath = (source, path) => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), source)
}

const getInitialLang = () => {
  if (typeof window === 'undefined') return 'es'

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored
  } catch { /* sin storage (modo privado): español */ }

  /* El sitio es en ESPAÑOL (decisión de Fedev, 13-nov-2026). Antes se elegía por `navigator.language`: quien tenía el
     navegador en inglés —y Googlebot, que rastrea en inglés— veía la misma URL en otro idioma, y eso es lo que se
     indexaba. El inglés sigue disponible, pero sólo si el visitante lo elige con el selector. */
  return 'es'
}

const LanguageContext = createContext({
  lang: 'es',
  setLang: () => {},
  t: (path, fallback = '') => fallback,
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)

  // <html lang> acompaña al idioma que se está mostrando (lo leen buscadores y lectores de pantalla).
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (nextLang) => {
    if (!SUPPORTED_LANGS.includes(nextLang)) return
    // Se guarda SÓLO acá: es la elección explícita del visitante, no una deducción.
    try { window.localStorage.setItem(STORAGE_KEY, nextLang) } catch { /* sin storage: vale sólo esta visita */ }
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

// eslint-disable-next-line react-refresh/only-export-components -- el hook vive junto al Context que lee y lo importan ~40 archivos; moverlo rompería esos imports en cadena. Sólo afecta al Fast Refresh en dev.
export function useLanguage() {
  return useContext(LanguageContext)
}

