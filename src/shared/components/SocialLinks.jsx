/**
 * FUENTE ÚNICA de los contactos públicos de Kolortec.
 *
 * ⚠ DOS DE ESTOS VALORES NO ESTÁN CONFIRMADOS POR EL CLIENTE — no los inventes
 * de nuevo ni los pises "a ojo", cambialos acá y se actualiza todo el sitio:
 *
 *  - WHATSAPP_NUMBER: `5491155555555` es un número DE RELLENO (55-5555). En
 *    `src/features/warranty/data/maintenanceGuides.js` aparece otro,
 *    `5491168985633`, que sí parece real. Falta que el cliente diga cuál va.
 *  - FACEBOOK_URL: `facebook.com/kolortec` es una empresa POLACA de esmaltado
 *    en polvo, no este Kolortec. Falta la URL real (o sacar la red).
 *
 * Todavía quedan copias sueltas de estos valores en archivos de otros dueños
 * (WhatsAppFab, ProductDetailPage, landingData, jsonLd): la idea es que todos
 * terminen importando de acá.
 */
const WHATSAPP_NUMBER = '5491155555555'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
const INSTAGRAM_URL = 'https://instagram.com/kolortec'
const FACEBOOK_URL = 'https://facebook.com/kolortec'

// Para un link con mensaje prellenado: `${WHATSAPP_URL}?text=${encodeURIComponent(texto)}`.
// (Un helper con nombre en minúscula acá rompe react-refresh: este archivo exporta
// un componente, y la regla sólo tolera constantes en MAYÚSCULAS junto a él.)

const SOCIAL_LINKS = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    href: WHATSAPP_URL,
    path: 'M20.52 3.48A11.83 11.83 0 0012.05 0C5.5 0 .15 5.34.15 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.31-1.65a11.93 11.93 0 005.74 1.46h.01c6.55 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.44-8.43zM12.06 21.6h-.01a9.7 9.7 0 01-4.95-1.36l-.36-.21-3.74.98 1-3.65-.23-.37A9.66 9.66 0 012.4 11.9c0-5.34 4.34-9.68 9.66-9.68 2.58 0 5 .99 6.83 2.82a9.62 9.62 0 012.83 6.86c0 5.34-4.34 9.7-9.66 9.7zm5.3-7.27c-.29-.14-1.72-.85-1.99-.95-.27-.1-.46-.14-.66.14-.19.29-.76.95-.93 1.14-.17.19-.34.21-.63.07-.29-.14-1.22-.45-2.33-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5h-.56c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39s1.02 2.78 1.17 2.97c.14.19 2.02 3.07 4.89 4.31.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.27.17-1.38-.07-.12-.26-.19-.55-.34z',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    href: INSTAGRAM_URL,
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.92 5.92 0 00-2.14 1.39A5.92 5.92 0 00.63 4.16c-.3.76-.5 1.64-.56 2.9C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.14.56 2.91.31.79.73 1.46 1.39 2.12.66.66 1.33 1.07 2.12 1.39.77.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.14-.26 2.91-.56a5.92 5.92 0 002.12-1.39 5.92 5.92 0 001.39-2.12c.3-.77.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.14-.56-2.91a5.92 5.92 0 00-1.39-2.14A5.92 5.92 0 0019.86.63c-.77-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16A4 4 0 1112 8a4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    href: FACEBOOK_URL,
    path: 'M22.68 0H1.32C.59 0 0 .58 0 1.31v21.38C0 23.42.59 24 1.32 24h11.5v-9.29h-3.13v-3.62h3.13V8.41c0-3.1 1.9-4.79 4.66-4.79 1.32 0 2.46.1 2.79.14v3.24h-1.92c-1.5 0-1.79.71-1.79 1.76v2.31h3.59l-.47 3.62h-3.12V24h6.12c.73 0 1.32-.58 1.32-1.31V1.31C24 .58 23.41 0 22.68 0z',
  },
]

function SocialLinks({
  className = '',
  itemClassName = '',
  iconSize = 16,
}) {
  return (
    <div className={className}>
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          title={item.label}
          className={itemClassName}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: iconSize, height: iconSize }}>
            <path fill="currentColor" d={item.path} />
          </svg>
        </a>
      ))}
    </div>
  )
}

export default SocialLinks
export { SOCIAL_LINKS, WHATSAPP_NUMBER, WHATSAPP_URL, INSTAGRAM_URL, FACEBOOK_URL }
