/**
 * forma(page) — la «forma» de una página de catálogo sin contenido («no encontrada» / «catálogo caído»), medida en el navegador: título,
 * tipografía, guía izquierda, posición, enlace «Volver», colores y tokens. La comparten check-filtros (caso 29) y check-volver-categoria
 * (casos 18 y 19), para que «Producto no encontrado» se mida con la MISMA regla que «Categoría no encontrada».
 */
export const forma = (p) => p.evaluate(() => {
  const h1 = document.querySelector('h1')
  const cs = h1 && getComputedStyle(h1)
  const color = (v, prop) => { const i = document.createElement('i'); i.style[prop] = v; document.body.appendChild(i); const c = getComputedStyle(i)[prop]; i.remove(); return c }
  const volver = [...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/products' && /Volver/i.test(a.textContent))
  const cuerpo = h1?.nextElementSibling
  const sec = [...document.querySelectorAll('section')].find((x) => x.querySelector('h1'))
  const rv = volver?.getBoundingClientRect()
  const rh = h1?.getBoundingClientRect()
  return {
    hay: !!h1, h1s: document.querySelectorAll('h1').length, titulo: h1?.textContent ?? '',
    fuente: cs?.fontSize, familia: cs?.fontFamily, interlineado: cs?.lineHeight, izq: rh ? Math.round(rh.left) : null, top: rh ? Math.round(rh.top + scrollY) : null,
    caja: !!document.querySelector('div.border-dashed'), reintentar: [...document.querySelectorAll('button')].some((b) => /Reintentar/i.test(b.textContent)),
    cuerpoColor: cuerpo ? getComputedStyle(cuerpo).color : '', muted: color('var(--muted)', 'color'),
    fondo: sec ? getComputedStyle(sec).backgroundColor : '', fondoToken: color('var(--bg)', 'color'),
    volverAlto: Math.round(rv?.height ?? 0), volverIzq: rv ? Math.round(rv.left + 12) : null,
    volverColor: volver ? getComputedStyle(volver).color : '', volverPeso: volver ? Number(getComputedStyle(volver).fontWeight) : 0, volverCls: volver?.className ?? '',
    primary: color('var(--primary)', 'color'), tintaEstado: color('var(--state-ink)', 'color'),
  }
})
