/**
 * heroTranslate — traducción al vuelo de TODOS los textos de un diseño de
 * Hero Labs (carrusel o scrolltelling).
 *
 * Por qué existe: el diseño se edita en castellano en el admin de Modora y
 * viaja así por la API. Cuando el visitante pone el sitio en inglés, esos
 * textos son los únicos que quedaban sin traducir, porque no pasan por el
 * i18n estático (`translations.js`) — no son strings de código, son datos.
 *
 * Antes esto vivía dentro de `ScrolltellingSection.jsx` con un mapa de dos
 * entradas (`{ text: 'content', button: 'label' }`), así que:
 *   - el widget `message` —el que usan TODOS los pasos del scrolltelling y
 *     todas las escenas del carrusel— no se traducía nunca, y
 *   - el carrusel del Encabezado no se traducía en absoluto, porque
 *     `HeroSection` ni siquiera llamaba a esta lógica.
 *
 * Qué NO se traduce, a propósito:
 *   - `stats.items[].value` — son cifras y unidades ("280 W", "18×10 W",
 *     "IP65"): traducirlas las rompe.
 *   - `countdown.labels` — son iniciales sueltas (d/h/m/s); un traductor
 *     automático las convierte en cualquier cosa.
 *   - cualquier `href`, url o id.
 */

/**
 * Props con texto visible, por tipo de widget.
 * `list` describe props que son arrays de objetos: qué array y qué claves
 * traducir de cada ítem.
 */
const TEXT_PROPS = {
  text: ['content'],
  button: ['label'],
  message: ['title', 'sub', 'eyebrow', 'cta'],
  badge: ['label'],
  countdown: ['expiredText'],
  media: ['alt'],
  logo: ['alt'],
}

const LIST_PROPS = {
  quicklinks: { key: 'items', fields: ['label'] },
  stats: { key: 'items', fields: ['label'] },
}

const isText = (v) => typeof v === 'string' && v.trim().length > 0

const TERMINAL = ['.', '!', '?']

/**
 * Devuelve la traducción conservando el signo final del original.
 *
 * Por qué: los traductores automáticos se comen o cambian la puntuación final
 * ("Mist." → "Mist", "On tour." → "ON TOUR"). Eso no es sólo cosmético — el
 * `accentDot` de MessageView/TextView pinta el ÚLTIMO carácter con el color de
 * acento SÓLO si es `.`, `!` o `?`. Sin el signo, el punto amarillo del look
 * kolortec desaparece en cualquier idioma que no sea el original.
 */
export function keepTerminalPunctuation(source, translated) {
  if (!isText(source) || !isText(translated)) return translated
  const end = source.trim().slice(-1)
  if (!TERMINAL.includes(end)) return translated
  const out = translated.trim()
  return TERMINAL.includes(out.slice(-1)) ? out.slice(0, -1) + end : out + end
}

/** Todos los strings traducibles del diseño, sin repetir. */
export function collectHeroTexts(config) {
  const out = new Set()
  const add = (v) => { if (isText(v)) out.add(v) }

  for (const slide of config?.slides || []) {
    for (const el of slide?.elements || []) {
      const props = el?.props
      if (!props) continue
      for (const key of TEXT_PROPS[el.type] || []) add(props[key])
      const list = LIST_PROPS[el.type]
      if (list && Array.isArray(props[list.key])) {
        for (const item of props[list.key]) {
          for (const f of list.fields) add(item?.[f])
        }
      }
    }
  }
  return [...out]
}

/**
 * Copia del config con cada texto reemplazado por su traducción. Los que no
 * estén en el diccionario quedan como están — así el render nunca espera a
 * que termine la traducción y nunca queda un hueco en blanco.
 */
export function applyHeroTranslations(config, dict) {
  if (!config || !dict || dict.size === 0) return config

  const tr = (v) => (isText(v) && dict.get(v)) || v

  return {
    ...config,
    slides: (config.slides || []).map((slide) => ({
      ...slide,
      elements: (slide.elements || []).map((el) => {
        const props = el?.props
        if (!props) return el
        let next = null
        const set = (k, v) => { if (v !== props[k]) (next ??= { ...props })[k] = v }

        for (const key of TEXT_PROPS[el.type] || []) set(key, tr(props[key]))

        const list = LIST_PROPS[el.type]
        if (list && Array.isArray(props[list.key])) {
          let touched = false
          const items = props[list.key].map((item) => {
            if (!item) return item
            let copy = null
            for (const f of list.fields) {
              const v = tr(item[f])
              if (v !== item[f]) (copy ??= { ...item })[f] = v
            }
            if (copy) touched = true
            return copy || item
          })
          if (touched) (next ??= { ...props })[list.key] = items
        }

        return next ? { ...el, props: next } : el
      }),
    })),
  }
}
