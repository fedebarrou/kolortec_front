export const DESIGN_W = 1440
export const cqw = (px) => `${(px / DESIGN_W * 100).toFixed(4)}cqw`
export const cqwType = (px, minFactor = 0.62, maxFactor = 1.2) =>
  `clamp(${(px * minFactor).toFixed(2)}px, ${(px / DESIGN_W * 100).toFixed(4)}cqw, ${(px * maxFactor).toFixed(2)}px)`
export const MOBILE_BELOW = 768
// VIS-015 · los cortes de breakpoint, UNA vez por repo (este archivo es copia sincronizada y check-hero-paridad exige el mismo valor en los tres): <768 celular, 768–1023 tablet,
// desde 1024 escritorio. Los usan las secciones y los HeroSection de la tienda y Kolortec, y los previews del Lab.
export const TABLET_BELOW = 1024
export const breakpointDeAncho = (w) => (w < MOBILE_BELOW ? 'mobile' : w < TABLET_BELOW ? 'tablet' : 'desktop')
export const MQ_MOVIL = `(max-width: ${MOBILE_BELOW - 1}px)`
export const MQ_TABLET = `(max-width: ${TABLET_BELOW - 1}px)`
// VIS-020 · los cortes de los container queries del hero (`@container hc-stage (min-width: …)` en hero-anim.css / globals.css / hero-lab.css): CSS no puede importar estas constantes,
// así que se NOMBRAN acá y check-hero-paridad exige que todo corte de container query de las hojas de las tres sedes sea uno de ellos.
export const CQ_COMPACTO = 640
export const CQ_MEDIO = MOBILE_BELOW
export const CQ_AMPLIO = TABLET_BELOW
export const CQ_ANCHO = 1280
export const CQ_CORTES = [CQ_COMPACTO, CQ_MEDIO, CQ_AMPLIO, CQ_ANCHO]
