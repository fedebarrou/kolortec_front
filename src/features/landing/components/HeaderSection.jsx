import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { defaultLandingContent } from '../data/landingData'
import { getShopProducts } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { useAuth } from '../../../shared/auth/AuthContext'
import { irASeccion } from '../../../shared/utils/irASeccion'

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
  const { user, logout } = useAuth()
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

  // Entrada del navbar (line-reveal): en la home el navbar arranca oculto (el scrollytelling lo tapa)
  // y ANIMA su entrada cuando terminás el intro. En el resto de páginas aparece normal.
  const isHome = pathname === '/'
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  const animateEntrance = isHome && !prefersReduced
  const [navEntered, setNavEntered] = useState(false)

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
      { label: t('header.nav.home', 'Inicio'), to: '/' },
      { label: t('header.nav.catalog', 'Productos'), to: '/products' },
      { label: t('header.nav.support', 'Soporte'), to: '/', hash: '#shop' },
    ],
    [t],
  )

  const socialLinks = useMemo(
    () => [
      {
        key: 'whatsapp',
        label: t('header.social.whatsapp', 'WhatsApp'),
        href: 'https://wa.me/5491155555555',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[16px] w-[16px]">
            <path
              fill="currentColor"
              d="M20.52 3.48A11.83 11.83 0 0012.05 0C5.5 0 .15 5.34.15 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.31-1.65a11.93 11.93 0 005.74 1.46h.01c6.55 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.44-8.43zM12.06 21.6h-.01a9.7 9.7 0 01-4.95-1.36l-.36-.21-3.74.98 1-3.65-.23-.37A9.66 9.66 0 012.4 11.9c0-5.34 4.34-9.68 9.66-9.68 2.58 0 5 .99 6.83 2.82a9.62 9.62 0 012.83 6.86c0 5.34-4.34 9.7-9.66 9.7zm5.3-7.27c-.29-.14-1.72-.85-1.99-.95-.27-.1-.46-.14-.66.14-.19.29-.76.95-.93 1.14-.17.19-.34.21-.63.07-.29-.14-1.22-.45-2.33-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5h-.56c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39s1.02 2.78 1.17 2.97c.14.19 2.02 3.07 4.89 4.31.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.27.17-1.38-.07-.12-.26-.19-.55-.34z"
            />
          </svg>
        ),
      },
      {
        key: 'instagram',
        label: t('header.social.instagram', 'Instagram'),
        href: 'https://instagram.com/kolortec',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[16px] w-[16px]">
            <path
              fill="currentColor"
              d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.92 5.92 0 00-2.14 1.39A5.92 5.92 0 00.63 4.16c-.3.76-.5 1.64-.56 2.9C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.14.56 2.91.31.79.73 1.46 1.39 2.12.66.66 1.33 1.07 2.12 1.39.77.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.14-.26 2.91-.56a5.92 5.92 0 002.12-1.39 5.92 5.92 0 001.39-2.12c.3-.77.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.14-.56-2.91a5.92 5.92 0 00-1.39-2.14A5.92 5.92 0 0019.86.63c-.77-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16A4 4 0 1112 8a4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"
            />
          </svg>
        ),
      },
      {
        key: 'facebook',
        label: t('header.social.facebook', 'Facebook'),
        href: 'https://facebook.com/kolortec',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[16px] w-[16px]">
            <path
              fill="currentColor"
              d="M22.68 0H1.32C.59 0 0 .58 0 1.31v21.38C0 23.42.59 24 1.32 24h11.5v-9.29h-3.13v-3.62h3.13V8.41c0-3.1 1.9-4.79 4.66-4.79 1.32 0 2.46.1 2.79.14v3.24h-1.92c-1.5 0-1.79.71-1.79 1.76v2.31h3.59l-.47 3.62h-3.12V24h6.12c.73 0 1.32-.58 1.32-1.31V1.31C24 .58 23.41 0 22.68 0z"
            />
          </svg>
        ),
      },
    ],
    [t],
  )

  useEffect(() => {
    if (!animateEntrance) {
      setNavEntered(false)
      return undefined
    }
    let raf = 0
    let storySeen = false
    const check = () => {
      raf = 0
      // El scrolltelling lo maneja el ScrollRenderer, que avisa su estado por
      // clases en <body>. Mientras la historia tiene el control, el navbar NO
      // entra; entra recién cuando el renderer la libera. Si la home no tiene
      // historia configurada, ninguna clase aparece nunca y cae al heurístico
      // de scroll de siempre.
      const body = document.body
      if (body.classList.contains('scrolly-takeover') || body.classList.contains('scrolly-nav-hidden')) {
        storySeen = true
        // ⚠ Volver a entrar a la historia tiene que RETIRAR la entrada del navbar.
        // Antes esto era un trinquete (`done = true` y no volvía nunca), así que
        // .kt-nav-enter quedaba pegada al <header> para siempre — y esa clase lleva
        // una `animation` con fill-mode:both, que en la cascada le GANA a las
        // declaraciones de body.scrolly-takeover / .scrolly-nav-hidden. Resultado:
        // el usuario subía de nuevo al scrolltelling, el body decía "ocultá" y el
        // header se quedaba a la vista igual, encima de la historia.
        setNavEntered(false)
        return
      }
      // Fuera de la historia el comportamiento sigue siendo de una sola vía: una
      // vez que entró, no se va sola al volver al tope (eso es lo que se espera
      // en una home SIN scrolltelling).
      if (storySeen || window.scrollY > window.innerHeight * 0.5) setNavEntered(true)
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(check)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    check()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [animateEntrance])

  useEffect(() => {
    if (hash !== '#shop') return
    irASeccion('shop')
  }, [hash, pathname])

  const handleSupportNav = (event) => {
    event.preventDefault()
    setIsMobileOpen(false)
    setIsSearchFocused(false)
    setActiveSuggestionIndex(-1)

    if (pathname === '/') {
      irASeccion('shop')
      return
    }

    navigate('/#shop')
  }

  const handleCatalogNav = (event) => {
    event.preventDefault()
    setIsMobileOpen(false)
    setIsSearchFocused(false)
    setActiveSuggestionIndex(-1)

    if (pathname === '/products' && !window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    navigate('/products')
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
      navigate('/products')
      setIsSearchFocused(false)
      setActiveSuggestionIndex(-1)
      return
    }

    setIsSearchFocused(false)
    setActiveSuggestionIndex(-1)
    navigate(`/products?q=${encodeURIComponent(term)}`)
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
  const navClass = !animateEntrance
    ? ''
    : navEntered
      ? 'kt-nav-enter'
      : 'opacity-0 -translate-y-2 pointer-events-none'
  const loginDialog = isLoginDialogOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-label={t('header.loginDialogTitle', 'Iniciar sesion')}
          onClick={() => setIsLoginDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#101012] p-6 shadow-[0_22px_54px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="title-font text-[1.35rem] leading-none text-white">{t('header.loginDialogTitle', 'Iniciar sesion')}</h3>
                <p className="mt-2 text-[0.84rem] text-[#aeb4bf]">{t('header.loginDialogSubtitle', 'Accede con tu cuenta de Google.')}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] text-[#c8ced8] transition hover:border-primary hover:text-primary"
                onClick={() => setIsLoginDialogOpen(false)}
                aria-label={t('header.closeDialog', 'Cerrar dialogo')}
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
                {t('header.loginContinueGoogle', 'Continuar con Google')}
              </button>
              <button
                type="button"
                className="text-center text-[0.73rem] font-semibold uppercase tracking-[0.1em] text-[#9ea6b3] transition hover:text-white"
                onClick={() => setIsLoginDialogOpen(false)}
              >
                {t('header.loginCancel', 'Cancelar')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    /* site-header: hook que usa el ScrollRenderer del admin para retirar/devolver
       el menú durante la historia (body.scrolly-*, ver index.css). Mismo nombre
       de clase que en tiendita-store para que el CSS sea el mismo. */
    <header className={`site-header sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-[6px] supports-[backdrop-filter]:bg-[#050505]/84 shadow-[0_8px_24px_rgba(0,0,0,0.28)] px-6 lg:px-10 xl:px-20 2xl:px-40 py-4 ${navClass}`}>
      <span aria-hidden="true" className="kt-nav-line pointer-events-none absolute left-0 top-0 h-[2px] w-full bg-primary" />
      <div className="w-full flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">
        <div className="flex items-center md:justify-self-start">
          <Link
            to="/"
            aria-label={t('a11y.home', 'Ir al inicio')}
            className="flex items-center gap-2 text-primary transition hover:opacity-80"
            onClick={() => {
              setIsMobileOpen(false)
              setIsSearchFocused(false)
              setActiveSuggestionIndex(-1)
              if (pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          >
            <img alt={t('a11y.logo', 'Logo de Kolortec')} className="h-5 md:h-6 w-auto object-contain" src="/assets/Grupo-Kolortec-1024x150.jpeg" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-3 lg:gap-4 xl:gap-7 md:justify-self-center md:px-3">
          {navItems.map((item) => (
            item.hash ? (
              <a
                key={`${item.to}${item.hash}`}
                className="text-center text-slate-100 hover:text-primary text-[0.72rem] xl:text-sm font-bold uppercase tracking-wide whitespace-nowrap"
                href={`${item.to}${item.hash}`}
                onClick={handleSupportNav}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                className="text-center text-slate-100 hover:text-primary text-[0.72rem] xl:text-sm font-bold uppercase tracking-wide whitespace-nowrap"
                to={item.to}
                onClick={item.to === '/products' ? handleCatalogNav : undefined}
              >
                {item.label}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3 md:justify-self-end">
          <div className="inline-flex items-center rounded-md border border-white/15 bg-white/5 p-0.5">
            <button
              type="button"
              className={`h-7 px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${lang === 'es' ? 'bg-primary text-[#050505]' : 'text-[#d9dde5] hover:text-white'}`}
              onClick={() => setLang('es')}
              aria-label={t('a11y.toSpanish', 'Cambiar a español')}
            >
              ES
            </button>
            <button
              type="button"
              className={`h-7 px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${lang === 'en' ? 'bg-primary text-[#050505]' : 'text-[#d9dde5] hover:text-white'}`}
              onClick={() => setLang('en')}
              aria-label={t('a11y.toEnglish', 'Cambiar a inglés')}
            >
              EN
            </button>
          </div>

          <div className="inline-flex items-center gap-1 lg:gap-1.5">
            {socialLinks.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                title={item.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#e5e7eb] transition hover:border-primary hover:text-primary"
              >
                {item.icon}
              </a>
            ))}
          </div>

          <form
            ref={searchWrapRef}
            className="relative hidden lg:flex h-9 items-center bg-slate-800/50 rounded-lg px-2.5 border border-slate-700 xl:min-w-[230px]"
            onSubmit={handleSearchSubmit}
          >
            <span className="material-symbols-outlined inline-flex items-center text-slate-400 text-base leading-none">search</span>
            <input
              className="h-full bg-transparent border-none focus:ring-0 text-xs text-slate-100 placeholder:text-slate-500 w-24 rounded-lg pl-2 xl:w-36"
              placeholder={t('header.searchPlaceholder', 'Buscar producto...')}
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
              aria-label={t('header.searchAria', 'Buscar producto')}
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
                  <p className="m-0 px-[10px] py-[11px] text-[0.68rem] leading-[1.35] text-[#b6bec9]">{t('header.searchEmpty', 'Sin coincidencias directas. Probá en productos completos.')}</p>
                )}
                <button
                  type="button"
                  className="w-full border-0 bg-[rgba(244,223,51,0.14)] px-[10px] py-2 text-[0.63rem] font-extrabold uppercase tracking-[0.1em] text-[#f7f7f8] transition hover:bg-[rgba(244,223,51,0.24)]"
                  onClick={() => {
                    const term = searchTerm.trim()
                    setIsSearchFocused(false)
                    setActiveSuggestionIndex(-1)
                    navigate(term ? `/products?q=${encodeURIComponent(term)}` : '/products')
                  }}
                >
                  {t('header.searchAll', 'Ver todos en Productos')}
                </button>
              </div>
            ) : null}
          </form>

          {user ? (
            <button
              aria-label={t('a11y.logout', 'Cerrar sesión')}
              title={t('a11y.logout', 'Cerrar sesión')}
              className="h-9 w-9 bg-primary text-background-dark hover:bg-white transition-all inline-flex items-center justify-center rounded-lg"
              type="button"
              onClick={() => logout()}
            >
              <span className="material-symbols-outlined text-[18px] leading-none">logout</span>
            </button>
          ) : (
            <button
              aria-label={t('header.loginAria', 'Iniciar sesión')}
              title={t('header.loginAria', 'Iniciar sesión')}
              className="h-9 w-9 bg-primary text-background-dark hover:bg-white transition-all inline-flex items-center justify-center rounded-lg"
              type="button"
              onClick={() => setIsLoginDialogOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px] leading-none">person</span>
            </button>
          )}

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
            aria-label={t('a11y.toSpanish', 'Cambiar a español')}
          >
            ES
          </button>
          <button
            type="button"
            className={`h-7 px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${lang === 'en' ? 'bg-primary text-[#050505]' : 'text-[#d9dde5] hover:text-white'}`}
            onClick={() => setLang('en')}
            aria-label={t('a11y.toEnglish', 'Cambiar a inglés')}
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
              onClick={item.to === '/products' ? handleCatalogNav : () => setIsMobileOpen(false)}
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
