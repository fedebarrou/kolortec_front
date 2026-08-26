/**
 * SnapChrome — chrome kolortec del scrolltelling modo 'snap': indicador de
 * pasos (segmentos con fill CONTINUO), hint "Scrolleá", mini top-bar (logo +
 * Saltar), y flechas laterales.
 *
 * ⚠ COPIA SINCRONIZADA — editar en AMBOS repos (mismo contenido). Solo React,
 * SIN imports de la app (se monta tal cual en admin y store):
 *   tiendita-front/app/(admin)/admin/hero-lab/_renderer/SnapChrome.jsx
 *   tiendita-store/components/hero-renderer/SnapChrome.jsx
 * Contrato: tiendita-front/docs/scroll-hero-contract.md
 *
 * Requiere, cargado por el host (hero-anim.css/hero-lab.css en el admin,
 * app/globals.css en el store):
 *  - el keyframe `scrolly-bounce` (chevron del hint).
 *  - las clases `.scrolly-progress[-seg|-fill]`, `.scrolly-hint`, `.scrolly-topbar`,
 *    `.scrolly-skip`, `.scrolly-logo-btn` (bloque "Hero Labs: SnapChrome").
 *    Los breakpoints de esas clases son CONTAINER QUERIES contra el container
 *    con nombre `hc-stage` (containerType:'inline-size' en el wrapper sticky
 *    del hero) — NO viewport media queries — para que el preview del admin
 *    (que a veces anida/escala el canvas) muestre los mismos cortes que el
 *    store real, en vez de depender de un booleano `isMobile` calculado aparte.
 *
 * Props:
 *  - snap: settings.snap normalizado (SNAP_DEFAULTS + overrides del design).
 *  - count: cantidad de steps (slides visibles).
 *  - index: step actual (0-based) — solo habilita/deshabilita las flechas.
 *  - position: fracción 0..1 CONTINUA del recorrido completo (kolortec "p");
 *    el fill de cada segmento i es clamp(position*count - i, 0, 1). En reposo
 *    sobre el step s equivale a s/(count-1) (idéntico al look kolortec).
 *  - started: true tras el primer gesto real. Se acepta por compat de API
 *    (algunos callers ya lo pasan) pero YA NO decide la opacidad del hint —
 *    kolortec solo la corta por `position > 0.03`.
 *  - breakpoint: 'mobile' | 'tablet' | 'desktop' — sin efecto en la geometría
 *    (ver container queries arriba); se conserva para el resto de props.
 *  - accent: color de fill del indicador / hover de "Saltar" / logo.
 *  - logoUrl: url del logo (o null) — solo se pinta si `snap.logoBar` Y
 *    `navHidden` (si el header real sigue visible, el logo propio sobra).
 *  - brandLabel: nombre de marca para el aria-label del logo ("{marca} — ir
 *    al inicio", como kolortec). Sin marca disponible cae a "Ir al inicio".
 *  - onGesture(dir): dispara un paso (+1/-1) — flechas laterales.
 *  - onSkip(): salta al final — botón "Saltar".
 *  - onLogoClick(): click en el logo — kolortec: scrollea a wrapTop (inicio
 *    de la historia). Si no se pasa, el logo no es clickeable (solo imagen).
 *  - navHidden: si el header del sitio está oculto mientras la historia está
 *    pinned (snap.hideNav) — decide si el logo propio hace falta.
 *
 * Con count < 2 solo se muestra "Saltar" (sin segmentos/hint/flechas/logo).
 * "Saltar" SIEMPRE vive en la mini top-bar (kolortec no tiene variante
 * bottom-left: el layer del intro tapa el header real por completo).
 */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function SkipButton({ onSkip }) {
  return (
    <button type="button" onClick={onSkip} className="scrolly-skip">
      Saltar
    </button>
  );
}

export function SnapChrome({
  snap,
  count = 0,
  index = 0,
  position = 0,
  started = false,
  breakpoint = "desktop",
  accent = "#fff",
  logoUrl = null,
  brandLabel = null,
  onGesture,
  onSkip,
  onLogoClick,
  navHidden = false,
}) {
  const isMobile = breakpoint === "mobile";
  const showChrome = count > 1;
  const showSkip = !!snap?.skipButton;
  const showLogo = showChrome && !!snap?.logoBar && !!logoUrl && navHidden;
  const logoAria = `${brandLabel ? `${brandLabel} — ` : ""}Ir al inicio`;

  return (
    // data-bp: fallback SIN especificidad real (:where() en CSS) para hosts sin
    // container `hc-stage` en su árbol (hoy: Canvas.jsx del editor, estático,
    // sin gestos) — ahí no hay container que responda a @container, así que se
    // usan los valores de escritorio "a mano" según el breakpoint elegido. En
    // los hosts CON container (store, "Probar con scroll", preview de Mi web)
    // la container query manda siempre (misma especificidad, pero declarada
    // después → gana en cascada) — ver bloque "Hero Labs: SnapChrome" del CSS.
    <div data-bp={breakpoint} style={{ "--scrolly-accent": accent, display: "contents" }}>
      {/* Indicador de pasos (kolortec): segmentos con fill CONTINUO. */}
      {showChrome && snap?.progress !== false ? (
        <div aria-hidden="true" className="scrolly-progress">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="scrolly-progress-seg">
              <div className="scrolly-progress-fill" style={{ width: `${(clamp(position * count - i, 0, 1) * 100).toFixed(1)}%` }} />
            </div>
          ))}
        </div>
      ) : null}

      {/* Hint "Scrolleá": se desvanece apenas avanza el recorrido (kolortec: solo por position, no por `started`). */}
      {showChrome && snap?.hint !== false ? (
        <div aria-hidden="true" className="scrolly-hint" style={{ opacity: position > 0.03 ? 0 : 1 }}>
          <span>Scrolleá</span>
          <svg viewBox="0 0 24 24" width="20" height="20" style={{ stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, animation: "scrolly-bounce 1s infinite" }}><path d="M6 9l6 6 6-6" /></svg>
        </div>
      ) : null}

      {/* Mini top-bar: logo (si el header real está oculto) + Saltar (única variante kolortec). */}
      {showLogo || showSkip ? (
        <div className="scrolly-topbar">
          {showLogo ? (
            <button type="button" onClick={onLogoClick} aria-label={logoAria} className="scrolly-logo-btn">
              <img src={logoUrl} alt="" style={{ height: 24, width: "auto", objectFit: "contain" }} />
            </button>
          ) : <span aria-hidden="true" />}
          {showSkip ? <SkipButton onSkip={onSkip} /> : null}
        </div>
      ) : null}

      {/* Flechas laterales anterior/siguiente. */}
      {showChrome && snap?.stepArrows ? (
        <div style={{ position: "absolute", right: isMobile ? 12 : 26, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 10, zIndex: 5 }}>
          {[["prev", -1, "M6 15l6-6 6 6"], ["next", 1, "M6 9l6 6 6-6"]].map(([key, dir, path]) => {
            const disabled = dir < 0 ? index <= 0 : index >= count - 1;
            return (
              <button key={key} type="button" aria-label={dir < 0 ? "Paso anterior" : "Paso siguiente"} disabled={disabled}
                onClick={() => onGesture?.(dir)}
                style={{ width: 40, height: 40, borderRadius: 999, border: "1px solid rgba(255,255,255,.3)", background: "rgba(0,0,0,.35)", color: "#fff", display: "grid", placeItems: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.3 : 1, backdropFilter: "blur(6px)", transition: "opacity .25s ease" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" style={{ stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}><path d={path} /></svg>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
