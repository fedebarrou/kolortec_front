import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * HotspotViewer — la HOT SPOT CMY en 3D (modelada en Blender, docs/3d/hotspot-cmy)
 * sobre el amarillo de la sección.
 *
 * Lo que pidió el cliente:
 *  - Apoyar el mouse sobre una pieza unos segundos → la cámara se acerca (zoom
 *    normal, sin efectos) y aparece su nombre (y su descripción, cuando
 *    Kolortec la mande). Salir del modelo → vuelve. En táctil: tocar una
 *    pieza / tocar afuera.
 *  - Fondo: el amarillo de la sección. Se probaron escenario negro, foco y
 *    degradé; el cliente eligió el amarillo (2026-10-03).
 *  - Girarlo arrastrando (mouse apretado, o el dedo en horizontal).
 *  - Despiece en LOOP: se desarma, al final vuelve a armarse, y así siempre
 *    (las piezas se separan en secuencia; la base queda quieta). Con el mouse
 *    encima se PAUSA, para poder recorrer las piezas. Tamaño fijo: el encuadre
 *    es el del despiece completo, así nada se sale ni la cámara bombea.
 *
 * Las piezas se reconocen por nombre: cada objeto del GLB lleva `extras.pieza`
 * (→ userData.pieza) y three parte las mallas multi-material en hijos con sufijo
 * (base_1, base_2), así que se sube por los padres hasta encontrar el nombre.
 * Centro y radio de cada pieza se miden sobre el modelo cargado y se guardan en
 * el espacio LOCAL de su nodo: así el zoom cae bien aunque el equipo esté
 * girado o desarmado.
 *
 * Se carga diferido (React.lazy en ShopSection): three no entra en el bundle
 * inicial. El render loop sólo corre mientras el visor está en pantalla.
 */

const GLB_URL = '/assets/3d/hotspot-cmy.glb'
const PIEZAS_URL = '/assets/3d/hotspot-cmy.piezas.json'
const DRACO_PATH = '/assets/3d/draco/'

// Tiempo que el mouse tiene que quedarse sobre una pieza antes del zoom. El
// cliente lo pidió en "unos segundos": el zoom tiene que ser una decisión del
// que mira, no algo que salta al pasar el mouse por encima.
const DWELL_MS = 1500
// Al salir del modelo se espera un poco antes de volver al plano general, para
// que pasar por un hueco entre dos piezas no reinicie la cámara.
const LEAVE_MS = 700
const SIN_DESCRIPCION = /^A CONFIRMAR/i
// Después de cada movimiento de cámara, lo que queda debajo del mouse QUIETO es
// otra cosa (otra pieza, o nada). Sin esta traba el visor se encadenaba solo:
// zoom → otra pieza bajo el cursor → otro zoom, en loop. Hasta que el mouse no
// se mueva esto, no se reacciona.
const MOVIMIENTO_MIN_PX = 24
// Más de esto entre apretar y soltar es un arrastre (girar), no un toque/click.
const ARRASTRE_MIN_PX = 6

// Tres cuartos desde la derecha y algo de arriba: así se ven el disipador y los
// heat-pipes, que es lo que el cliente quiere mostrar.
const DIR_GENERAL = new THREE.Vector3(0.55, 0.32, 1).normalize()
const FOV_BASE = 30

// Orden del despiece: primero lo de afuera del cabezal, al final el yugo. La
// base no se mueve (es el piso del equipo).
const ORDEN_DESPIECE = [
  'lente_frontal', 'ventilador_2', 'ventilador_motor_led', 'disipador_heatpipes',
  'placa_control', 'cableado', 'modulo_cmy', 'rueda_gobos', 'motores_paso_a_paso',
  'correa_tilt', 'encoder', 'cabezal_chasis', 'panel_lcd', 'yugo',
]
const FIJAS = new Set(['base'])

const facil = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

function piezaDe(obj, conocidas) {
  for (let o = obj; o; o = o.parent) {
    const nombre = o.userData?.pieza || o.name
    if (nombre && conocidas.has(nombre)) return nombre
  }
  return null
}

function HotspotViewer() {
  const { t } = useLanguage()
  const wrapRef = useRef(null)
  const apiRef = useRef(null)
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [pieza, setPieza] = useState(null) // { etiqueta, descripcion }
  const [lista, setLista] = useState([]) // [{ nombre, etiqueta }] para teclado
  // En táctil no hay "pasar el mouse": la indicación cambia de verbo.
  const sinHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let cancelado = false

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap // PCFSoft ya no existe en three 0.186
    renderer.setClearColor(0x000000, 0)
    wrap.appendChild(renderer.domElement)

    // ── Escena ───────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    // Ambiente medio: sobre el amarillo el equipo necesita relleno para que los
    // negros no se empasten.
    scene.environmentIntensity = 0.55

    const camera = new THREE.PerspectiveCamera(FOV_BASE, 1, 0.01, 60)
    scene.add(camera)

    // Luz principal: un spot cenital. Sus sombras caen entre las piezas (el
    // disipador sobre el yugo, el cabezal sobre la base); piso no hay.
    const principal = new THREE.SpotLight(0xffffff, 26, 8, Math.PI / 7, 0.55, 1.4)
    principal.castShadow = true
    principal.shadow.mapSize.set(2048, 2048)
    principal.shadow.bias = -0.0004
    principal.shadow.radius = 4
    scene.add(principal, principal.target)
    // Relleno frío desde el frente-izquierda y contraluz blanca que recorta la
    // silueta (una amarilla se perdería contra el fondo de la sección).
    const relleno = new THREE.DirectionalLight(0xcfd8ff, 0.55)
    const contra = new THREE.SpotLight(0xffffff, 18, 8, Math.PI / 9, 0.6, 1.4)
    scene.add(relleno, contra, contra.target)


    const raycaster = new THREE.Raycaster()
    const puntero = new THREE.Vector2()

    // Cámara: posición y objetivo actuales, y a dónde van.
    const camPos = new THREE.Vector3()
    const camTarget = new THREE.Vector3()
    const goPos = new THREE.Vector3()
    const goTarget = new THREE.Vector3()
    const general = { pos: new THREE.Vector3(), target: new THREE.Vector3() }

    let modelo = null
    let esfera = null // esfera del equipo armado, en reposo
    let esferaDesarmado = null // la del despiece completo (se mide una vez)
    let piezas = new Map() // nombre → datos del JSON
    const nodos = new Map() // nombre → { nodo, centroLocal, radio, base, offset, orden }
    let activa = null
    let candidata = null
    let candidataDesde = 0
    let fueraDesde = 0
    let visible = false
    let raf = 0
    let punteroDentro = false
    let ultimo = performance.now()
    let t0 = ultimo

    // Giro del usuario (yaw) y su inercia; inclinación chica (pitch).
    let giro = 0
    let giroVel = 0
    let incl = 0
    let tocoGiro = false
    let arrastre = null // { id, x, y, movio }

    // Despiece en loop: 0 armado → 1 desarmado → 0… con una pausa en cada punta.
    let despiece = 0
    let sentido = 1
    let quietoHasta = 0
    const DURACION_DESPIECE = 3.2 // s de armado a desarmado
    const PAUSA_PUNTA = 1400 // ms quieto armado / desarmado
    let tecladoDentro = false


    let trabaX = null
    let trabaY = null
    let ultimoX = 0
    let ultimoY = 0
    const trabar = () => { trabaX = ultimoX; trabaY = ultimoY; candidata = null; fueraDesde = 0 }

    // Dónde va el centro del equipo en el ancho del canvas. En escritorio el
    // canvas es ancho y pasa por DETRÁS del texto (para que el modelo pueda ser
    // grande): el equipo se corre a la derecha con un corrimiento de lente
    // (filmOffset), no moviendo la cámara. En < 1024 va centrado.
    let zonaX = 0.5
    const resize = () => {
      const w = wrap.clientWidth || 1
      const h = wrap.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      zonaX = window.innerWidth >= 1024 ? 0.7 : 0.46
      // three corre el frustum en `near · filmOffset / anchoDePelícula`; para
      // correr el cuadro una fracción s de su ancho hay que escalar por
      // 2·tan(fov/2)·aspect (con sólo el ancho de película salía al doble).
      const s = zonaX - 0.5
      camera.filmOffset = -s * 2 * Math.tan(THREE.MathUtils.degToRad(FOV_BASE) / 2) * camera.aspect * camera.getFilmWidth()
      camera.updateProjectionMatrix()
      if (modelo) encuadrarGeneral()
    }

    // Distancia a la que una esfera de radio r entra entera en el cuadro. El
    // ancho útil es el lado más corto alrededor de zonaX (a la derecha del
    // equipo queda menos lugar que a la izquierda).
    const distanciaPara = (r) => {
      const vfov = THREE.MathUtils.degToRad(FOV_BASE)
      const anchoUtil = camera.aspect * 2 * Math.min(zonaX, 1 - zonaX)
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * anchoUtil)
      return r / Math.sin(Math.min(vfov, hfov) / 2)
    }

    const encuadrarGeneral = () => {
      // Desarmado ocupa más: se encuadra la esfera del despiece real.
      // Tamaño FIJO: siempre el encuadre del despiece completo, armado o no.
      const e = esferaDesarmado || esfera
      // La cámara mira un poco por ENCIMA del centro: el equipo baja en el cuadro
      // y deja libre la franja de arriba, donde se apoya el cartel global de
      // login (ra VIS-108).
      general.target.copy(e.center).add(new THREE.Vector3(0, zonaX === 0.5 || window.innerWidth < 1024 ? 0 : e.radius * 0.14, 0))
      // En el celular el canvas es bajo: se acerca más para que el equipo
      // llene la franja (con 0.76 quedaban ~110px de amarillo vacío arriba; con
      // 0.62 se cortaba la base).
      const factor = window.innerWidth < 1024 ? 0.68 : 0.76
      general.pos.copy(general.target).addScaledVector(DIR_GENERAL, distanciaPara(e.radius) * factor)
      if (!activa) {
        goPos.copy(general.pos)
        goTarget.copy(general.target)
      }
    }

    const montarEscenario = () => {
      const c = esfera.center
      const r = esfera.radius
      principal.position.set(c.x + r * 0.5, c.y + r * 3.2, c.z + r * 1.4)
      principal.target.position.copy(c)
      principal.shadow.camera.near = r * 0.5
      principal.shadow.camera.far = r * 8
      relleno.position.set(c.x - r * 2, c.y + r, c.z + r * 2)
      // Contraluz desde atrás y abajo hacia el CABEZAL: recorta la silueta en
      // amarillo sin hacer un charco en el piso.
      contra.position.set(c.x - r * 0.4, c.y + r * 0.2, c.z - r * 2.6)
      contra.target.position.set(c.x, c.y + r * 0.55, c.z)
    }

    // Mide cada pieza con el equipo en reposo y prepara su vector de despiece.
    const medirPiezas = () => {
      modelo.updateMatrixWorld(true)
      const cajas = new Map()
      modelo.traverse((o) => {
        if (!o.isMesh) return
        o.castShadow = true
        o.receiveShadow = true
        const nombre = piezaDe(o, piezas)
        if (!nombre) return
        const caja = new THREE.Box3().setFromObject(o)
        cajas.set(nombre, cajas.has(nombre) ? cajas.get(nombre).union(caja) : caja)
      })
      // El nodo de cada pieza: el antepasado más alto que lleva su nombre.
      modelo.traverse((o) => {
        const nombre = o.userData?.pieza || o.name
        if (!nombre || !piezas.has(nombre) || nodos.has(nombre)) return
        if (!cajas.has(nombre)) return
        const s = cajas.get(nombre).getBoundingSphere(new THREE.Sphere())
        nodos.set(nombre, { nodo: o, centroLocal: o.worldToLocal(s.center.clone()), centroMundo: s.center.clone(), radio: s.radius, base: o.position.clone() })
      })
      esfera = new THREE.Box3().setFromObject(modelo).getBoundingSphere(new THREE.Sphere())
      // Vector de despiece (en mundo, con el equipo armado): desde el centro del
      // equipo hacia la pieza, con un empuje hacia arriba para el cabezal.
      const lista = ORDEN_DESPIECE.filter((n) => nodos.has(n))
      nodos.forEach((d, nombre) => {
        if (FIJAS.has(nombre)) { d.offset = null; return }
        const dir = d.centroMundo.clone().sub(esfera.center)
        dir.y = Math.max(dir.y, 0) * 0.6 + 0.12
        if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0)
        dir.normalize()
        // Separación moderada: el encuadre es FIJO y abarca el despiece completo,
        // así que cuanto más se separan las piezas, más chico se ve el equipo
        // armado. Con esto el despiece ocupa ~1,5 veces el equipo.
        const empuje = esfera.radius * (0.28 + 0.42 * Math.min(1, d.centroMundo.distanceTo(esfera.center) / esfera.radius))
        d.offsetMundo = dir.multiplyScalar(empuje)
        const i = lista.indexOf(nombre)
        d.orden = (i < 0 ? lista.length : i) / Math.max(1, lista.length)
      })
    }

    // Aplica el despiece: cada pieza arranca un poco después que la anterior.
    const qModelo = new THREE.Quaternion()
    const qPadre = new THREE.Quaternion()
    const aplicarDespiece = () => {
      modelo.updateMatrixWorld(true)
      qModelo.setFromRotationMatrix(modelo.matrixWorld)
      nodos.forEach((d) => {
        if (!d.offsetMundo) return
        const ventana = 0.45
        const local = THREE.MathUtils.clamp((despiece - d.orden * (1 - ventana)) / ventana, 0, 1)
        const k = facil(local)
        // El offset se midió con el equipo en reposo, o sea en el espacio del
        // modelo. Se lleva al espacio del PADRE del nodo (las piezas del cabezal
        // cuelgan de cabezal_pivot, que está inclinado): padre⁻¹ · modelo.
        qPadre.setFromRotationMatrix(d.nodo.parent.matrixWorld).invert().multiply(qModelo)
        const enPadre = d.offsetMundo.clone().applyQuaternion(qPadre)
        d.nodo.position.copy(d.base).addScaledVector(enPadre, k)
      })
    }

    const enfocar = (nombre) => {
      const p = piezas.get(nombre)
      const d = nodos.get(nombre)
      if (!p || !d) return
      activa = nombre
      const centro = d.centroLocal.clone().applyMatrix4(d.nodo.matrixWorld)
      // Se acerca desde donde está mirando ahora (el usuario puede haberlo
      // girado): el zoom se lee como acercarse, no como dar la vuelta.
      const dir = camPos.clone().sub(centro).normalize()
      // Piso de distancia: una pieza chica (el encoder) no puede meter la cámara
      // adentro del equipo.
      // Zoom moderado: la pieza ocupa el cuadro con aire alrededor (a 1,35 llenaba
      // todo y se iba contra el borde).
      const dist = Math.max(distanciaPara(d.radio) * 2.1, 0.36)
      goTarget.copy(centro)
      goPos.copy(centro).addScaledVector(dir, dist)
      setPieza({ etiqueta: p.etiqueta, descripcion: SIN_DESCRIPCION.test(p.descripcion || '') ? '' : p.descripcion })
      trabar()
    }

    const soltar = () => {
      if (!activa) return
      activa = null
      goPos.copy(general.pos)
      goTarget.copy(general.target)
      setPieza(null)
      trabar()
    }

    const piezaBajoPuntero = (clientX, clientY) => {
      if (!modelo) return null
      const r = renderer.domElement.getBoundingClientRect()
      puntero.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(puntero, camera)
      const hit = raycaster.intersectObject(modelo, true)[0]
      return hit ? piezaDe(hit.object, piezas) : null
    }

    // ── Puntero: hover (zoom), arrastre (girar) y toque ──────────────────────
    const onDown = (e) => {
      arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, movio: false, tipo: e.pointerType }
    }
    const onMove = (e) => {
      ultimoX = e.clientX
      ultimoY = e.clientY
      if (arrastre && arrastre.id === e.pointerId) {
        const dx = e.clientX - arrastre.x
        const dy = e.clientY - arrastre.y
        if (!arrastre.movio && Math.hypot(dx, dy) > ARRASTRE_MIN_PX) {
          arrastre.movio = true
          tocoGiro = true
          if (e.pointerType !== 'touch') renderer.domElement.setPointerCapture?.(e.pointerId)
          soltar()
          // El hover que venía de ANTES del arrastre no cuenta: si quedaba vivo,
          // al soltar se cumplía su 1,5 s con el reloj viejo y hacía zoom a la
          // pieza donde empezó el giro (joan REG-001).
          candidata = null
          candidataDesde = 0
          fueraDesde = 0
        }
        if (arrastre.movio) {
          const ancho = renderer.domElement.clientWidth || 1
          const dGiro = (dx / ancho) * Math.PI * 1.6
          giro += dGiro
          giroVel = dGiro
          if (e.pointerType !== 'touch') incl = THREE.MathUtils.clamp(incl + (dy / ancho) * 1.2, -0.35, 0.45)
          arrastre.x = e.clientX
          arrastre.y = e.clientY
          return
        }
      }
      if (e.pointerType === 'touch') return
      punteroDentro = true
      if (trabaX !== null) {
        if (Math.hypot(e.clientX - trabaX, e.clientY - trabaY) < MOVIMIENTO_MIN_PX) return
        trabaX = null
        trabaY = null
      }
      const nombre = piezaBajoPuntero(e.clientX, e.clientY)
      const ahora = performance.now()
      if (nombre) {
        fueraDesde = 0
        if (nombre !== candidata) { candidata = nombre; candidataDesde = ahora }
      } else {
        candidata = null
        if (!fueraDesde) fueraDesde = ahora
      }
    }
    const onUp = (e) => {
      const fue = arrastre
      arrastre = null
      // Después de girar, el puntero queda donde se soltó: hasta que no se mueva
      // de ahí, no arranca un hover nuevo.
      if (fue?.movio) { ultimoX = e.clientX; ultimoY = e.clientY; trabar(); return }
      if (!fue) return
      if (e.pointerType !== 'touch') return
      // Toque sin arrastre: elegir pieza / volver.
      const nombre = piezaBajoPuntero(e.clientX, e.clientY)
      if (nombre && nombre !== activa) enfocar(nombre)
      else soltar()
    }
    // En táctil el navegador dispara `pointerleave` apenas se levanta el dedo:
    // contarlo como "salió del modelo" deshacía el zoom del toque a los 700 ms.
    const onLeave = (e) => {
      if (e.pointerType === 'touch') return
      if (arrastre) return
      punteroDentro = false
      candidata = null
      fueraDesde = performance.now()
    }

    const canvas = renderer.domElement
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    // pointercancel = el navegador se quedó con el gesto (scroll vertical en
    // táctil): se suelta el arrastre, pero NO cuenta como toque.
    const onCancel = () => { arrastre = null }
    canvas.addEventListener('pointercancel', onCancel)
    canvas.addEventListener('pointerleave', onLeave)

    // ── Loop ─────────────────────────────────────────────────────────────────
    const loop = (ahora) => {
      raf = 0
      if (!visible || cancelado) return
      const dt = Math.min(0.05, (ahora - ultimo) / 1000)
      ultimo = ahora

      if (!arrastre?.movio) {
        if (candidata && candidata !== activa && ahora - candidataDesde > DWELL_MS) enfocar(candidata)
        if (!candidata && activa && fueraDesde && ahora - fueraDesde > LEAVE_MS) soltar()
      }

      if (modelo) {
        // Inercia del giro al soltar; vaivén leve hasta que el usuario lo toque.
        if (!arrastre?.movio) { giro += giroVel; giroVel *= 0.92 }
        const vaiven = !tocoGiro && !activa && !reduceMotion && !punteroDentro ? Math.sin((ahora - t0) / 2600) * 0.12 : 0
        modelo.rotation.y = giro + vaiven
        modelo.rotation.x = THREE.MathUtils.lerp(modelo.rotation.x, incl * 0.5, 0.15)
        modelo.updateMatrixWorld(true)

        // Loop del despiece. Se pausa con el mouse encima, mientras se arrastra,
        // con una pieza enfocada o con el teclado en la lista. Con "reducir
        // movimiento" no hay loop: queda armado.
        const pausado = reduceMotion || punteroDentro || !!arrastre || !!activa || tecladoDentro
        // Expuesto en el DOM (data-loop) para poder verificarlo desde afuera.
        const estadoLoop = pausado ? 'pausado' : 'corriendo'
        if (wrap.parentElement && wrap.parentElement.dataset.loop !== estadoLoop) wrap.parentElement.dataset.loop = estadoLoop
        if (!pausado && ahora >= quietoHasta) {
          despiece += sentido * (dt / DURACION_DESPIECE)
          if (despiece >= 1 || despiece <= 0) {
            despiece = THREE.MathUtils.clamp(despiece, 0, 1)
            sentido *= -1
            quietoHasta = ahora + PAUSA_PUNTA
          }
          aplicarDespiece()
        }
        // Si hay una pieza enfocada y se mueve (giro, despiece), la cámara la sigue.
        if (activa) {
          const d = nodos.get(activa)
          goTarget.copy(d.centroLocal).applyMatrix4(d.nodo.matrixWorld)
        }
      }

      const k = reduceMotion ? 1 : 1 - Math.pow(0.002, dt) // ~7.5% por frame a 60 fps
      camPos.lerp(goPos, k)
      camTarget.lerp(goTarget, k)
      camera.position.copy(camPos)
      camera.lookAt(camTarget)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    const arrancar = () => { if (!raf && visible) { ultimo = performance.now(); raf = requestAnimationFrame(loop) } }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!visible) return
      t0 = performance.now()
      arrancar()
    }, { threshold: 0.25 })
    io.observe(wrap)
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    apiRef.current = {
      // Teclado / lector de pantalla: la misma acción que el hover.
      enfocar: (nombre) => { if (modelo) { if (nombre) enfocar(nombre); else soltar() } },
      // Con foco de teclado se dibuja aunque el visor esté apenas en pantalla
      // (el navegador sólo baja hasta mostrar el chip enfocado): si no, el
      // render queda frenado y el zoom no se ve.
      teclado: (dentro) => {
        tecladoDentro = dentro
        if (dentro) { visible = true; arrancar() }
      },
    }

    const draco = new DRACOLoader().setDecoderPath(DRACO_PATH)
    const loader = new GLTFLoader().setDRACOLoader(draco)
    Promise.all([
      loader.loadAsync(GLB_URL),
      fetch(PIEZAS_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`piezas ${r.status}`)))),
    ])
      .then(([gltf, lista]) => {
        if (cancelado) return
        piezas = new Map(lista.map((p) => [p.nombre_objeto, p]))
        modelo = gltf.scene
        scene.add(modelo)
        medirPiezas()
        // Se mide el despiece completo una vez (sin dibujar) para encuadrarlo.
        despiece = 1
        aplicarDespiece()
        esferaDesarmado = new THREE.Box3().setFromObject(modelo).getBoundingSphere(new THREE.Sphere())
        despiece = 0
        aplicarDespiece()
        montarEscenario()
        encuadrarGeneral()
        camPos.copy(general.pos)
        camTarget.copy(general.target)
        setLista(lista.filter((p) => nodos.has(p.nombre_objeto)).map((p) => ({ nombre: p.nombre_objeto, etiqueta: p.etiqueta })))
        setEstado('listo')
        arrancar()
      })
      .catch(() => { if (!cancelado) setEstado('error') })

    return () => {
      cancelado = true
      apiRef.current = null
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('pointerleave', onLeave)
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        mats.forEach((m) => {
          Object.values(m).forEach((v) => { if (v && v.isTexture) v.dispose() })
          m.dispose()
        })
      })
      scene.environment?.dispose()
      pmrem.dispose()
      draco.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [])

  return (
    <div className="kt-hotspot" data-estado={estado}>
      <div
        ref={wrapRef}
        className="kt-hotspot-canvas"
        role="img"
        aria-label={t('landing.shop.hotspotAria', 'Cabeza móvil Kolortec HOT SPOT CMY en 3D, sin tapas, con sus piezas internas a la vista')}
      />
      {estado === 'error' ? (
        <p className="kt-hotspot-error">{t('landing.shop.hotspotError', 'No pudimos cargar el modelo 3D.')}</p>
      ) : null}
      {/* Las piezas, para teclado y lector de pantalla: el zoom por hover no se
          alcanza con Tab. Ocultas hasta que reciben foco (WCAG 2.1.1). */}
      {lista.length > 0 ? (
        <nav
          className="kt-hotspot-teclado"
          aria-label={t('landing.shop.hotspotPiezas', 'Piezas del equipo')}
          onFocus={() => apiRef.current?.teclado(true)}
          onBlur={(e) => {
            if (e.currentTarget.contains(e.relatedTarget)) return
            apiRef.current?.teclado(false)
            apiRef.current?.enfocar(null)
          }}
        >
          <ul>
            {lista.map((p) => (
              <li key={p.nombre}>
                <button
                  type="button"
                  onFocus={(e) => {
                    // La fila tiene scroll horizontal: el chip enfocado se trae
                    // entero a la vista (si no, quedaba cortado contra el borde).
                    e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest' })
                    apiRef.current?.enfocar(p.nombre)
                  }}
                  onClick={() => apiRef.current?.enfocar(p.nombre)}
                >
                  {p.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className={`kt-hotspot-ficha ${pieza ? 'is-on' : ''}`} aria-live="polite">
        {pieza ? (
          <>
            <strong>{pieza.etiqueta}</strong>
            {pieza.descripcion ? <p>{pieza.descripcion}</p> : null}
          </>
        ) : estado === 'listo' ? (
          <span className="kt-hotspot-hint">
            {sinHover
              ? t('landing.shop.hotspotHintTouch', 'Tocá una pieza · arrastrá para girar')
              : t('landing.shop.hotspotHint', 'Pasá el mouse por una pieza · arrastrá para girar')}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default HotspotViewer
