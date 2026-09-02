# Inscripción de la base de datos ante la AAIP — borrador de respuestas

Guía para completar el trámite **"Inscripción de Bases de Datos Privadas"** en
[Trámites a Distancia (TAD)](https://tramitesadistancia.gob.ar/), del Registro Nacional de Bases de
Datos Personales de la **AAIP**.

> Esto es un borrador para agilizar la carga, no asesoramiento legal. Las respuestas describen lo
> que el sitio hace hoy, verificado en el código. **Que lo valide el abogado antes de confirmar**,
> sobre todo el nombre y la finalidad, que después no se pueden cambiar.

## Lo primero: NO se pide nada técnico

El formulario **no pide** el esquema de la base, ni las tablas, ni los campos, ni el motor, ni
credenciales, ni un export. Es una **declaración jurada descriptiva**: qué datos hay, para qué, de
dónde salen, a quién se le pasan, cuánto se guardan y cómo se los protege.

- **Costo:** gratuito.
- **Vencimiento:** no tiene. Pero si cambia algo de lo declarado, hay que modificarlo.
- **Requisito:** Clave Fiscal nivel 2 o superior de AFIP.
- **Son dos trámites, en orden:** primero se inscribe el **responsable** (y el sistema devuelve un
  **Registro N°**), y recién después **cada base**.

## ⚠️ Dos campos que NO se pueden modificar nunca más

Una vez confirmado el trámite, **el nombre de la base y la finalidad quedan fijos**. Todo lo demás
se edita después desde "Modificación de datos del Registro de Bases de Datos Privadas". Pensalos
antes de confirmar.

## Borrador de respuestas

### Identificación

| Campo | Qué poner |
|---|---|
| CUIT / CUIL del responsable | El CUIT de Kolortec |
| Registro N° | El número que devolvió la inscripción del **responsable** (está en TAD → solapa "Notificaciones") |
| Nombre de fantasía | `Kolortec` — si coincide con la razón social, va la razón social |

### Nombre de la base

**En MAYÚSCULAS, sin abreviaciones, sin acentos y sin puntos** (lo pide el instructivo).

```
CONTACTOS Y USUARIOS DEL SITIO WEB
```

> Si el abogado prefiere separar en dos bases (una de consultas comerciales y otra de cuentas de
> usuario), se hacen dos trámites. Una sola base alcanza si la finalidad declarada las cubre a las
> dos, que es el caso.

### Finalidad

Se elige de una lista y se pueden sumar varias con el botón `+`. Las que aplican:

- **Comercialización / marketing** — para las consultas de `/sumate` y el contacto comercial.
- **Servicio al cliente / soporte técnico** — para las cuentas de descarga de material técnico.

### Naturaleza de los datos

> **¿Contiene datos sensibles?** → **NO**
> **¿Contiene antecedentes penales o contravencionales?** → **NO**

El sitio no pide origen racial o étnico, opiniones políticas, convicciones religiosas, afiliación
sindical, salud ni vida sexual, y la política de privacidad pide expresamente que no se carguen en
los campos de texto libre.

### Tipo de datos personales contenidos

- **Datos identificativos** — nombre y apellido.
- **Datos de contacto** (o "Otros" si no figura como opción propia) — correo electrónico y teléfono.

Si hace falta usar **"Otros"**, detallar:

```
Nombre y apellido, correo electronico y telefono aportados voluntariamente en el
formulario de contacto; nombre, correo electronico e imagen de perfil recibidos del
proveedor de identidad al iniciar sesion; nombre y texto de las resenias publicadas.
```

### Forma de recolección

- **Directamente del titular** ✔

Es la única que corresponde: todo lo carga la propia persona en un formulario o al iniciar sesión.
No hay cesión de origen privado ni público — no compramos ni recibimos bases de nadie.

### Destino de los datos (cesiones)

```
No se ceden datos a terceros con fines comerciales. Los datos son tratados por el
proveedor de la plataforma web contratada, que actua como encargado del tratamiento
por cuenta y orden del responsable en los terminos del art. 25 de la Ley 25.326.
Al iniciar sesion con un proveedor de identidad externo interviene dicho proveedor
en la autenticacion, lo que puede implicar una transferencia internacional en los
terminos del art. 12. Se entregan datos a autoridad judicial o administrativa
competente cuando lo requiera en el marco de sus facultades.
```

### Forma y periodicidad de actualización

- **Forma:** a pedido del titular / por el propio titular.
- **Periodicidad:** eventual (o "Otros" → `Cuando el titular lo solicita o actualiza sus datos`).

### Conservación de los datos

⚠️ **No poner "tiempo indeterminado"** — el instructivo dice expresamente que es un error, porque el
art. 4 inc. 7 obliga a destruir los datos cuando dejan de ser necesarios. Tiene que ser determinado
o al menos **determinable**:

```
Mientras subsista la finalidad para la que fueron recolectados y, cumplida esta,
durante el plazo de prescripcion de las acciones que pudieran derivarse de la
relacion. Cumplido ese plazo, se suprimen o anonimizan.
```

### Seguridad / accesibilidad

```
El sitio se sirve integramente sobre conexion cifrada (HTTPS). El acceso a la base
esta restringido a personal autorizado mediante credenciales individuales. Las
contrasenias de las cuentas de usuario no se almacenan en el sitio: la autenticacion
se delega en un proveedor de identidad externo. Se realizan copias de resguardo
periodicas.
```

### Forma habilitada para ejercer los derechos

- **Correo electrónico** ✔

### Domicilio y datos de contacto para ejercer los derechos

El domicilio de Kolortec y el correo publicado en la política de privacidad. **Tiene que coincidir
con el que muestra `/privacidad`** — ese correo sale de la cuenta y se edita desde el admin de
Modora, así que si se cambia allá, hay que modificar también este trámite.

### Requisitos y procedimiento

Primer campo (cómo acredita identidad y cómo se dirige):

```
El titular debe enviar su solicitud por correo electronico a la direccion publicada,
desde la misma casilla con la que se contacto, acompaniando copia de su DNI cuando
resulte necesario para acreditar su identidad.
```

Segundo campo (procedimiento):

```
Recibido el pedido por el medio establecido y acreditada la identidad, se informa lo
solicitado dentro de los diez dias corridos (art. 14 de la Ley 25.326) y, en caso de
corresponder, se realiza la rectificacion, actualizacion o supresion dentro de los
cinco dias habiles (art. 16 de la Ley 25.326).
```

### Cierre

Tildar **"leído"** para confirmar la declaración jurada, guardar y confirmar el trámite.

## Después de inscribir

1. **Si cambia algo de lo declarado, hay que modificarlo** en TAD ("Modificación de datos del
   Registro de Bases de Datos Privadas"). En particular: si se agrega un formulario nuevo, si se
   empieza a vender online, si cambia el correo de contacto o si aparece una cesión nueva.
2. **Lo declarado acá y lo que dice `/privacidad` tienen que decir lo mismo.** Si se tocan los
   textos legales, revisar si corresponde modificar el trámite.

## Por qué corresponde inscribirla

El **art. 21** de la Ley 25.326 obliga a inscribir las bases "destinadas a dar informes", y el
**art. 24** extiende la obligación a los archivos, registros o bancos de datos privados **que no
sean para un uso exclusivamente personal**. Una base con consultas comerciales, cuentas de usuario
y reseñas no es de uso exclusivamente personal.

Dudas del trámite: `registrobasesdedatos@aaip.gob.ar`

---

Fuentes: [Registrar bases de datos personales privadas (AAIP)](https://www.argentina.gob.ar/registrar-bases-de-datos-personales-privadas)
· [Instructivo oficial TAD — bases privadas](https://www.argentina.gob.ar/sites/default/files/instructivo_tad_inscripcionymodificacion_basesprivadas_2.pdf)
· [Ley 25.326](https://servicios.infoleg.gob.ar/infolegInternet/anexos/70000-74999/70368/texact.htm)
