import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductReviews, submitProductReview } from '../../../shared/services/contentService'
import { useAuth } from '../../../shared/auth/AuthContext'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * ProductReviews — comentarios de un producto.
 *
 * Reglas del negocio (definidas por el cliente):
 *  - COMENTAR es sólo para clientes registrados. Sin sesión no se muestra el
 *    formulario sino la invitación a entrar; el back además lo exige (auth.public
 *    en POST /public/resenas), así que no es una barrera cosmética.
 *  - Un comentario NO se ve en la web hasta que lo aprueban desde el admin de
 *    tiendita. El autor SÍ ve el suyo mientras espera, marcado como pendiente
 *    (el back lo devuelve en `mine` cuando hay sesión) — sin eso, el que comenta
 *    cree que se perdió y lo vuelve a mandar.
 */

const STAR_PATH = 'M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.74L6.8 19.6l1-5.8-4.2-4.1 5.8-.85z'

function Stars({ value = 0, size = 'md' }) {
  const full = Math.round(Number(value) || 0)
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'
  return (
    <span className="inline-flex gap-[2px]" aria-label={`${full} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`${cls} stroke-current [stroke-width:1.6] ${n <= full ? 'fill-primary text-primary' : 'fill-none text-[#4a4a4a]'}`}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  )
}

/** Selector de estrellas del formulario: radios REALES, para que ande con teclado. */
function RatingInput({ value, onChange, disabled }) {
  return (
    <fieldset className="m-0 border-0 p-0" disabled={disabled}>
      <legend className="sr-only">Puntuación</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name="kt-review-rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={`h-7 w-7 stroke-current transition [stroke-width:1.5] ${n <= value ? 'fill-primary text-primary' : 'fill-none text-[#4a4a4a] hover:text-[#7a7a7a]'}`}
            >
              <path d={STAR_PATH} />
            </svg>
            <span className="sr-only">{n} de 5</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ReviewItem({ review, pending = false, pendingLabel }) {
  return (
    <li className="kt-reveal-item border-b border-[#2a2a2a] py-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <strong className="text-[0.95rem] text-[#f2f2f2]">{review.nombre || 'Anónimo'}</strong>
        <Stars value={review.rating} size="sm" />
        {review.fecha ? <span className="text-[0.72rem] text-[#8b919b]">{review.fecha}</span> : null}
        {pending ? (
          <span className="border border-[rgba(244,223,51,0.45)] px-2 py-[2px] text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary">
            {pendingLabel}
          </span>
        ) : null}
      </div>
      {review.comentario ? (
        <p className="mt-2 max-w-[78ch] text-[0.9rem] leading-[1.55] text-[#b8bec7]">{review.comentario}</p>
      ) : null}
    </li>
  )
}

function ProductReviews({ productId }) {
  const { t } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState({ avgRating: 0, count: 0, reviews: [], mine: null })
  const [rating, setRating] = useState(5)
  const [comentario, setComentario] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  const load = useCallback(() => {
    if (!productId) return
    getProductReviews(productId).then(setData)
  }, [productId])

  // Se recarga también cuando cambia la sesión: `mine` (el comentario propio
  // pendiente) sólo viene si el back reconoce la cookie.
  useEffect(() => {
    load()
  }, [load, user?.email])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    if (rating < 1 || rating > 5) {
      setError(t('productDetail.reviews.errorRating', 'Elegí una puntuación de 1 a 5 estrellas.'))
      return
    }
    setSending(true)
    try {
      await submitProductReview({ productId, rating, comentario: comentario.trim() })
      setSent(true)
      setComentario('')
      load()
    } catch (err) {
      if (err.status === 401) {
        setError(t('productDetail.reviews.errorAuth', 'Tenés que iniciar sesión para comentar.'))
      } else if (err.status === 429) {
        setError(t('productDetail.reviews.errorRate', 'Mandaste varios comentarios seguidos. Probá de nuevo en un rato.'))
      } else {
        setError(err.message || t('productDetail.reviews.errorGeneric', 'No pudimos enviar tu comentario. Intentá de nuevo.'))
      }
    } finally {
      setSending(false)
    }
  }

  if (!productId) return null

  const { avgRating, count, reviews, mine } = data
  // El comentario propio pendiente no está en `reviews` (esa lista es sólo lo
  // aprobado): se muestra aparte, arriba, con su cartel.
  const minePending = mine && !mine.aprobado ? mine : null
  const pendingLabel = t('productDetail.reviews.pendingBadge', 'Pendiente de aprobación')

  return (
    <section className="kt-detail-tech-shell kt-detail-shell-short kt-detail-anim" id="reviews">
      <h3 className="kt-detail-tech-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
        {t('productDetail.reviews.title', 'Comentarios')}
        <span className="kt-title-dot">.</span>
      </h3>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Stars value={avgRating} />
        <span className="text-[0.9rem] text-[#9aa0aa]">
          {count > 0
            ? `${avgRating.toFixed(1)} · ${count} ${count === 1 ? t('productDetail.reviews.one', 'comentario') : t('productDetail.reviews.many', 'comentarios')}`
            : t('productDetail.reviews.empty', 'Todavía no hay comentarios sobre este equipo.')}
        </span>
      </div>

      {/* Formulario: sólo con sesión iniciada. */}
      <div className="mx-auto mt-8 max-w-[720px]">
        {authLoading ? null : user ? (
          sent ? (
            <p className="border border-[rgba(244,223,51,0.4)] bg-[rgba(244,223,51,0.06)] px-4 py-3.5 text-[0.88rem] text-[#e8e8e8]">
              {t('productDetail.reviews.thanks', 'Gracias. Tu comentario se publica una vez aprobado por el equipo de Kolortec.')}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 border border-[#2a2a2a] p-5">
              <div className="grid gap-2">
                <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-[#9aa0aa]">
                  {t('productDetail.reviews.ratingLabel', 'Tu puntuación')}
                </span>
                <RatingInput value={rating} onChange={setRating} disabled={sending} />
              </div>

              <label className="grid gap-2">
                <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-[#9aa0aa]">
                  {t('productDetail.reviews.commentLabel', 'Tu comentario')}
                </span>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  disabled={sending}
                  placeholder={t('productDetail.reviews.placeholder', 'Contanos cómo te fue con el equipo.')}
                  className="w-full resize-y border border-[#2f2f2f] bg-transparent px-3 py-2.5 text-[0.92rem] text-[#f2f2f2] outline-none transition focus:border-primary"
                />
              </label>

              {error ? <p className="m-0 text-[0.82rem] text-[#ff8f8f]">{error}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-[0.72rem] text-[#8b919b]">
                  {t('productDetail.reviews.moderationNote', 'Se publica después de ser aprobado.')}
                </span>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-[8px] bg-primary px-5 py-3 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {sending ? t('productDetail.reviews.sending', 'Enviando…') : t('productDetail.reviews.submit', 'Publicar comentario')}
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 border border-[#2a2a2a] px-5 py-6 text-center">
            <p className="m-0 max-w-[52ch] text-[0.9rem] text-[#b8bec7]">
              {t('productDetail.reviews.loginPrompt', 'Los comentarios son de clientes registrados. Iniciá sesión para dejar el tuyo.')}
            </p>
            <Link
              to="/login"
              className="rounded-[8px] border-2 border-white px-5 py-3 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[#090909]"
            >
              {t('productDetail.reviews.loginCta', 'Iniciar sesión')}
            </Link>
          </div>
        )}
      </div>

      {minePending || reviews.length > 0 ? (
        <ul className="mx-auto mt-8 max-w-[900px] list-none border-t border-[#2a2a2a] p-0">
          {minePending ? <ReviewItem review={minePending} pending pendingLabel={pendingLabel} /> : null}
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default ProductReviews
