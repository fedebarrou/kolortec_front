import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { defaultLandingContent } from '../data/landingData'
import { getShopProducts } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

const normalizeText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const scoreProductMatch = (product, query) => {
  if (!query) return 0

  const name = normalizeText(product.name || '')
  const description = normalizeText(product.description || '')
  const badge = normalizeText(product.badge || '')
  const words = name.split(/\s+/).filter(Boolean)

  let score = 0

  if (name === query) score += 1200
  if (name.startsWith(query)) score += 900
  if (words.some((word) => word.startsWith(query))) score += 650
  if (name.includes(query)) score += 520
  if (description.includes(query)) score += 280
  if (badge && badge.includes(query)) score += 260

  // Fuzzy proximity: rewards in-order character matches for short/partial queries.
  let pointer = 0
  for (const char of query) {
    const foundIndex = name.indexOf(char, pointer)
    if (foundIndex === -1) break
    pointer = foundIndex + 1
  }
  const fuzzyRatio = query.length ? pointer / Math.max(query.length, 1) : 0
  if (fuzzyRatio > 0.65) score += Math.round(fuzzyRatio * 220)

  return score
}

function HeaderSection() {
  const { lang, setLang, t } = useLanguage()
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [products, setProducts] = useState(defaultLandingContent.products.items)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const mobileMenuRef = useRef(null)
  const mobileMenuBtnRef = useRef(null)
  const searchWrapRef = useRef(null)

  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const suggestions = useMemo(() => {
    const query = normalizeText(searchTerm)
    if (!query) return []

    return products
      .map((item) => ({ item, score: scoreProductMatch(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .slice(0, 6)
      .map((entry) => entry.item)
  }, [products, searchTerm])

  const navItems = useMemo(
    () => [
      { label: t('header.nav.home', 'Home'), to: '/' },
      { label: t('header.nav.catalog', 'Catalogo'), to: '/tienda' },
      { label: t('header.nav.support', 'Support'), to: '/', hash: '#support' },
    ],
    [t],
  )

  useEffect(() => {
    if (hash !== '#support') return
    const target = document.getElementById('support')
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, pathname])

  const handleSupportNav = (event) => {
    event.preventDefault()
    setIsMobileOpen(false)
    setIsSearchFocused(false)
    setActiveSuggestionIndex(-1)

    if (pathname === '/') {
      const target = document.getElementById('support')
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }

    navigate('/#support')
  }

  const handleCatalogNav = (event) => {
    event.preventDefault()
    setIsMobileOpen(false)
    setIsSearchFocused(false)
    setActiveSuggestionIndex(-1)

    if (pathname === '/tienda' && !window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    navigate('/tienda')
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      const suggested = suggestions[activeSuggestionIndex]
      setSearchTerm(suggested.name)
      setIsSearchFocused(false)
      setActiveSuggestionIndex(-1)
      navigate(`/producto/${slugify(suggested.name)}`)
      return
    }

    const term = searchTerm.trim()
    if (!term) {
      navigate('/tienda')
      setIsSearchFocused(false)
      setActiveSuggestionIndex(-1)
      return
    }

    setIsSearchFocused(false)
    setActiveSuggestionIndex(-1)
    navigate(`/tienda?q=${encodeURIComponent(term)}`)
  }

  const openPredict = () => {
    const hasQuery = searchTerm.trim().length > 0
    setIsSearchFocused(hasQuery)
    setActiveSuggestionIndex(hasQuery && suggestions.length ? 0 : -1)
  }

  const selectSuggestion = (item) => {
    setSearchTerm(item.name)
    setIsSearchFocused(false)
    setActiveSuggestionIndex(-1)
    navigate(`/producto/${slugify(item.name)}`)
  }

  const handleSearchKeyDown = (event) => {
    if (!isSearchFocused || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveSuggestionIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveSuggestionIndex((prev) => (prev - 1 < 0 ? suggestions.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Escape') {
      setIsSearchFocused(false)
      setActiveSuggestionIndex(-1)
    }
  }

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!isMobileOpen) return
      if (mobileMenuRef.current?.contains(event.target)) return
      if (mobileMenuBtnRef.current?.contains(event.target)) return
      setIsMobileOpen(false)
    }

    document.addEventListener('click', onClickOutside)
    return () => {
      document.removeEventListener('click', onClickOutside)
    }
  }, [isMobileOpen])

  useEffect(() => {
    let mounted = true
    getShopProducts().then((response) => {
      if (mounted) {
        setProducts(response)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!searchWrapRef.current?.contains(event.target)) {
        setIsSearchFocused(false)
        setActiveSuggestionIndex(-1)
      }
    }
    document.addEventListener('click', onClickOutside)
    return () => {
      document.removeEventListener('click', onClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!isLoginDialogOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsLoginDialogOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isLoginDialogOpen])

  useEffect(() => {
    const hasQuery = searchTerm.trim().length > 0
    if (!hasQuery) {
      setActiveSuggestionIndex(-1)
      return
    }
    if (suggestions.length === 0) {
      setActiveSuggestionIndex(-1)
      return
    }
    setActiveSuggestionIndex((prev) => (prev >= 0 && prev < suggestions.length ? prev : 0))
  }, [searchTerm, suggestions.length])

  const isPredictOpen = isSearchFocused && searchTerm.trim().length > 0
  const loginDialog = isLoginDialogOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-label="Opciones de inicio de sesion"
          onClick={() => setIsLoginDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#101012] p-6 shadow-[0_22px_54px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="title-font text-[1.35rem] leading-none text-white">Iniciar sesion</h3>
                <p className="mt-2 text-[0.84rem] text-[#aeb4bf]">Accede con tu cuenta de Google.</p>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] text-[#c8ced8] transition hover:border-primary hover:text-primary"
                onClick={() => setIsLoginDialogOpen(false)}
                aria-label="Cerrar dialogo"
              >
                <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-black uppercase tracking-[0.08em] text-[#0b0b0b] transition hover:brightness-105"
                onClick={() => {
                  setIsLoginDialogOpen(false)
                  navigate('/login')
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[17px] w-[17px] text-black">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1H12v2.92h5.35c-.23 1.5-1.74 4.4-5.35 4.4-3.22 0-5.84-2.67-5.84-5.96s2.62-5.96 5.84-5.96c1.84 0 3.07.78 3.77 1.46l2.57-2.48C16.69 3.89 14.57 3 12 3 6.92 3 2.8 7.16 2.8 12.25S6.92 21.5 12 21.5c6.93 0 9.2-4.86 9.2-7.37 0-.5-.05-.86-.12-1.23z"
                  />
                </svg>
                Continuar con Google
              </button>
              <button
                type="button"
                className="text-center text-[0.73rem] font-semibold uppercase tracking-[0.1em] text-[#9ea6b3] transition hover:text-white"
                onClick={() => setIsLoginDialogOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-[6px] supports-[backdrop-filter]:bg-[#050505]/84 shadow-[0_8px_24px_rgba(0,0,0,0.28)] px-6 lg:px-40 py-4">
      <div className="w-full flex items-center justify-between relative">
        <div className="flex items-center">
          <div className="flex items-center gap-2 text-primary">
            <img alt="Kolortec Logo" className="h-5 md:h-6 w-auto object-contain" src="/assets/Grupo-Kolortec-1024x150.jpeg" />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            item.hash ? (
              <a
                key={`${item.to}${item.hash}`}
                className="text-center text-slate-100 hover:text-primary text-sm font-bold uppercase tracking-wider"
                href={`${item.to}${item.hash}`}
                onClick={handleSupportNav}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                className="text-center text-slate-100 hover:text-primary text-sm font-bold uppercase tracking-wider"
                to={item.to}
                onClick={item.to === '/tienda' ? handleCatalogNav : undefined}
              >
                {item.label}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:inline-flex items-center rounded-md border border-white/15 bg-white/5 p-0.5">
            <button
              type="button"
              className={`h-7 px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${lang === 'es' ? 'bg-primary text-[#050505]' : 'text-[#d9dde5] hover:text-white'}`}
              onClick={() => setLang('es')}
              aria-label="Cambiar a español"
            >
              ES
            </button>
            <button
              type="button"
              className={`h-7 px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${lang === 'en' ? 'bg-primary text-[#050505]' : 'text-[#d9dde5] hover:text-white'}`}
              onClick={() => setLang('en')}
              aria-label="Switch to English"
            >
              EN
            </button>
          </div>

          <form
            ref={searchWrapRef}
            className="relative hidden lg:flex h-9 min-w-[230px] items-center bg-slate-800/50 rounded-lg px-2.5 border border-slate-700"
            onSubmit={handleSearchSubmit}
          >
            <span className="material-symbols-outlined text-slate-400 text-base">search</span>
            <input
              className="h-full bg-transparent border-none focus:ring-0 text-xs text-slate-100 placeholder:text-slate-500 w-36 rounded-lg pl-2"
              placeholder="Buscar producto..."
              value={searchTerm}
              onFocus={openPredict}
              onChange={(event) => {
                const value = event.target.value
                setSearchTerm(value)
                const hasQuery = value.trim().length > 0
                setIsSearchFocused(hasQuery)
                setActiveSuggestionIndex(hasQuery ? 0 : -1)
              }}
              onKeyDown={handleSearchKeyDown}
              aria-label="Buscar producto"
              role="combobox"
              aria-expanded={isPredictOpen ? 'true' : 'false'}
              aria-controls="navPredictiveResults"
              aria-autocomplete="list"
            />

            {isPredictOpen ? (
              <div className="absolute top-[calc(100%+0.45rem)] left-0 right-0 z-[80] overflow-hidden rounded-[10px] border border-[rgba(244,223,51,0.3)] bg-[rgba(8,8,8,0.95)] shadow-[0_16px_32px_rgba(0,0,0,0.42)] backdrop-blur-[12px]" id="navPredictiveResults" role="listbox">
                {suggestions.length > 0 ? (
                  suggestions.map((item, index) => (
                    <button
                      key={item.name}
                      type="button"
                      className={`grid w-full cursor-pointer grid-cols-[40px_1fr_auto] items-center gap-[10px] border-0 border-b border-[rgba(255,255,255,0.08)] bg-transparent px-[10px] py-[9px] text-left text-[#eceff4] transition ${activeSuggestionIndex === index ? 'bg-[rgba(244,223,51,0.1)]' : 'hover:bg-[rgba(244,223,51,0.1)]'}`}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onClick={() => selectSuggestion(item)}
                      role="option"
                      aria-selected={activeSuggestionIndex === index ? 'true' : 'false'}
                    >
                      <img src={item.image} alt="" loading="lazy" className="h-10 w-10 rounded-md border border-[rgba(255,255,255,0.12)] object-cover" />
                      <span className="grid gap-0.5">
                        <strong className="text-[0.72rem] uppercase tracking-[0.04em]">{item.name}</strong>
                        <small className="text-[0.64rem] leading-[1.25] text-[#a9b1bd]">{item.description}</small>
                      </span>
                      {item.badge ? <em className="rounded-full bg-primary px-2 py-[3px] text-[0.58rem] font-black uppercase tracking-[0.09em] not-italic text-[#0b0b0b]">{item.badge}</em> : null}
                    </button>
                  ))
                ) : (
                  <p className="m-0 px-[10px] py-[11px] text-[0.68rem] leading-[1.35] text-[#b6bec9]">Sin coincidencias directas. Probá en catálogo completo.</p>
                )}
                <button
                  type="button"
                  className="w-full border-0 bg-[rgba(244,223,51,0.14)] px-[10px] py-2 text-[0.63rem] font-extrabold uppercase tracking-[0.1em] text-[#f7f7f8] transition hover:bg-[rgba(244,223,51,0.24)]"
                  onClick={() => {
                    const term = searchTerm.trim()
                    setIsSearchFocused(false)
                    setActiveSuggestionIndex(-1)
                    navigate(term ? `/tienda?q=${encodeURIComponent(term)}` : '/tienda')
                  }}
                >
                  Ver todos en Catalogo
                </button>
              </div>
            ) : null}
          </form>

          <button
            aria-label="Iniciar sesión"
            title="Iniciar sesión"
            className="h-9 w-9 bg-primary text-background-dark hover:bg-white transition-all inline-flex items-center justify-center rounded-lg"
            type="button"
            onClick={() => setIsLoginDialogOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px] leading-none">person</span>
          </button>

          <button
            ref={mobileMenuBtnRef}
            aria-controls="mobileMenuPanel"
            aria-expanded={isMobileOpen ? 'true' : 'false'}
            className="md:hidden h-9 w-9 border border-white/20 bg-white/5 text-white inline-flex items-center justify-center rounded-lg"
            id="mobileMenuBtn"
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined text-lg">menu</span>
          </button>
        </div>
      </div>

      <div
        ref={mobileMenuRef}
        className={`absolute top-[calc(100%+0.45rem)] left-6 right-6 z-[70] overflow-hidden rounded-[10px] border border-white/12 bg-[rgba(5,5,5,0.92)] p-[0.65rem] shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-[12px] transition md:hidden ${isMobileOpen ? 'pointer-events-auto translate-y-0 opacity-100 scale-100' : 'pointer-events-none -translate-y-1.5 opacity-0 scale-[0.985]'}`}
        id="mobileMenuPanel"
      >
        <img
          src="/assets/logo_minimal.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 h-28 w-28 -translate-y-1/2 opacity-[0.1]"
        />

        <div className="relative z-10 mb-2 inline-flex items-center rounded-md border border-white/15 bg-white/5 p-0.5 md:hidden">
          <button
            type="button"
            className={`h-7 px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${lang === 'es' ? 'bg-primary text-[#050505]' : 'text-[#d9dde5] hover:text-white'}`}
            onClick={() => setLang('es')}
            aria-label="Cambiar a español"
          >
            ES
          </button>
          <button
            type="button"
            className={`h-7 px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${lang === 'en' ? 'bg-primary text-[#050505]' : 'text-[#d9dde5] hover:text-white'}`}
            onClick={() => setLang('en')}
            aria-label="Switch to English"
          >
            EN
          </button>
        </div>

        {navItems.map((item) => (
          item.hash ? (
            <a key={`${item.to}${item.hash}`} href={`${item.to}${item.hash}`} onClick={handleSupportNav} className="relative z-10 block rounded-lg px-[0.55rem] py-[0.65rem] text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#e5e7eb] hover:bg-[rgba(244,223,51,0.96)] hover:text-[#050505]">
              {item.label}
            </a>
          ) : (
            <Link
              key={item.to}
              to={item.to}
              onClick={item.to === '/tienda' ? handleCatalogNav : () => setIsMobileOpen(false)}
              className="relative z-10 block rounded-lg px-[0.55rem] py-[0.65rem] text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#e5e7eb] hover:bg-[rgba(244,223,51,0.96)] hover:text-[#050505]"
            >
              {item.label}
            </Link>
          )
        ))}
      </div>

      {loginDialog}
    </header>
  )
}

export default HeaderSection
