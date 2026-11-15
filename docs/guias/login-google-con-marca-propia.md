# Login con Google mostrando tu marca

Guía para que, cuando un cliente toca «Entrar con Google» en tu sitio, la pantalla de Google muestre
el nombre y el logo de tu marca (por ejemplo «Kolortec») y no los de la plataforma.

Sirve para cualquier cuenta de tiendita, tenga la tienda estándar o un sitio a medida como kolortec.

## Qué necesitás

- Una cuenta de Google de la empresa (no una personal: el proyecto queda a nombre de quien lo crea).
- Entrar al administrador de tiendita con un usuario que pueda ver **Integraciones**.
- El logo de la marca en PNG cuadrado (120×120 px alcanza) y los links a tu página de inicio,
  tu política de privacidad y tus términos. En kolortec son `/privacidad` y `/terminos`.
- Unos 20 minutos. La verificación de marca de Google (paso 6) tarda días y no depende de vos.

## Paso 1 — Copiar la dirección de retorno desde tiendita

1. En el administrador: **Integraciones → Login con marca propia → Google**.
2. Copiá el campo **Redirect URI** con el botón «Copiar». Tiene esta forma:
   `https://api.soytiendita.store/public/auth/callback/google`

Usá siempre la que muestra la pantalla, no la escribas a mano.

## Paso 2 — Crear el proyecto en Google

1. Entrá a <https://console.cloud.google.com/> con la cuenta de Google de la empresa.
2. Arriba, en el selector de proyectos, elegí **Proyecto nuevo**. Ponele el nombre de la marca.
3. Con ese proyecto seleccionado, abrí **Google Auth Platform** (buscalo en la barra de arriba;
   en consolas viejas se llama «Pantalla de consentimiento de OAuth»).

## Paso 3 — Cargar la marca

En **Branding** (Información de la marca):

- **Nombre de la aplicación:** el nombre que va a leer tu cliente. Ej.: `Kolortec`.
- **Correo de asistencia:** un mail de la empresa.
- **Logo:** el PNG cuadrado.
- **Página principal:** `https://tu-dominio/`
- **Política de privacidad:** `https://tu-dominio/privacidad`
- **Condiciones del servicio:** `https://tu-dominio/terminos`
- **Dominios autorizados:** tu dominio (ej. `kolortec.com.ar`) y el dominio de la Redirect URI
  del paso 1 (ej. `soytiendita.store`).

En **Público** (Audience): tipo **Externo**. Después tocá **Publicar aplicación** para pasarla a
«En producción». Si queda «En prueba», sólo pueden entrar las personas que cargues a mano como
usuarios de prueba, y el resto ve un error.

En **Acceso a los datos** no hace falta agregar nada: el login sólo usa nombre, correo y foto
(`openid`, `email`, `profile`), que no requieren revisión de seguridad.

## Paso 4 — Crear las credenciales

1. En **Clientes** → **Crear cliente**.
2. Tipo de aplicación: **Aplicación web**. Nombre: el que quieras (no lo ve el cliente).
3. En **URI de redireccionamiento autorizados** pegá la Redirect URI del paso 1, exacta.
4. Guardá. Google muestra el **ID de cliente** y el **Secreto del cliente**. Copiá los dos ahora:
   el secreto no siempre se puede volver a ver.

## Paso 5 — Cargarlas en tiendita y probar

1. Volvé a **Integraciones → Login con marca propia → Google**.
2. Pegá **Client ID** y **Client Secret**, prendé **Habilitado** y tocá **Guardar**.
3. Abrí tu sitio en una ventana de incógnito y entrá con Google.

Qué tenés que ver: la pantalla de Google ya no usa la marca de la plataforma, y al volver al sitio
quedás con la sesión iniciada (aparece el ícono de «Mis datos» arriba).

Si algo falla:

| Lo que ves | Causa habitual |
|---|---|
| `Error 400: redirect_uri_mismatch` | La Redirect URI del paso 4 no es idéntica a la del paso 1 |
| «Acceso bloqueado» / «la app no completó la verificación» | La app quedó «En prueba» (paso 3) |
| Entrás con Google pero el sitio sigue sin sesión | No es de esta guía: ver «Límite conocido» abajo |
| Sigue apareciendo la marca de la plataforma | Falta prender «Habilitado» o no se guardó el secreto |

Para volver atrás: apagá «Habilitado» o tocá «Quitar». El login vuelve a usar las credenciales
generales de la plataforma y sigue funcionando.

## Paso 6 — Que Google muestre nombre y logo (verificación de marca)

Con los pasos 1 a 5 el login ya corre con tu proyecto, pero **hasta que Google verifique la marca
la pantalla no muestra tu nombre ni tu logo: muestra el dominio de la Redirect URI**
(«Continuar a soytiendita.store»).

Para la verificación, en **Branding** tocá **Verificar marca** / **Enviar para verificación**.
Google pide demostrar en Search Console que los dominios autorizados son tuyos.

### Límite conocido (noviembre 2026)

La Redirect URI vive en el dominio de la plataforma, no en el tuyo. Eso trae dos consecuencias:

1. **Verificación de marca:** vos podés demostrar que `tu-dominio` es tuyo, pero no el dominio de
   la plataforma. Para ese dominio la verificación la tiene que acompañar tiendita. Avisanos antes
   de enviar el pedido a Google. *(A confirmar con un caso real: todavía no se completó ninguna.)*
2. **Sesión en iPhone / Safari:** en un sitio a medida con dominio propio, la sesión queda guardada
   en el dominio de la plataforma. Safari bloquea por defecto las cookies de otro dominio, así que
   el cliente puede entrar con Google y volver al sitio sin sesión. *(Riesgo detectado leyendo el
   código; falta probarlo en un iPhone.)*

Las dos cosas se resuelven del lado de la plataforma, sirviendo la API bajo el dominio del propio
sitio. No es algo que el dueño de la cuenta pueda arreglar desde esta pantalla.

## Dónde está cada cosa en el código

- Pantalla del administrador: `tiendita-front/app/(admin)/admin/integraciones/_components/OAuthProvidersManagerMono.jsx`
- Credenciales por cuenta: `tiendita-back/app/Http/Controllers/OAuthProviderController.php`
- Uso en el login público: `tiendita-back/app/Http/Controllers/Auth/OAuthController.php` (`socialitePublic`)
- Botón del sitio: `kolortec/src/shared/services/contentService.js` (`getGoogleAuthUrl`)
