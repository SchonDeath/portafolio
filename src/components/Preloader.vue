<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/composables/useEditorial'
import { OPENING_WIDTH } from '@/composables/useIntroBand'

const emit = defineEmits<{
  /**
   * El negro va a desaparecer en el frame siguiente: hay que montar ya lo
   * que queda detrás, para que el corte descubra el portal y no un hueco.
   */
  reveal: []
  /** La animación terminó y el preloader puede desmontarse. */
  done: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const barEl = ref<HTMLElement | null>(null)
const cursorEl = ref<HTMLElement | null>(null)
const labelEl = ref<HTMLElement | null>(null)

/**
 * Preloader de terminal: negro completo, un testigo que parpadea arriba y
 * una barra blanca sólida anclada al borde izquierdo, con el rótulo en
 * negro recortado sobre ella. La barra es la medida literal de la carga —
 * cuando toca el borde derecho, el sitio está listo de verdad.
 *
 * Es la única superficie del sitio que ignora el tema claro/oscuro a
 * propósito — antes de que empiece nada, la pantalla está a oscuras.
 */
/** Piso de visibilidad: sin él, con todo en caché la barra sería un parpadeo. */
const MIN_VISIBLE_MS = 1400

/**
 * Reparto del progreso. El vídeo pesa más que todo lo demás junto y domina
 * la espera, así que se lleva la mayor parte de la barra; el resto son
 * tramos cortos que sólo evitan que arranque en seco.
 */
const WEIGHTS = { fonts: 0.1, poster: 0.15, video: 0.75 }

/**
 * Parte del tramo del vídeo que cubre la descarga. Lo que queda hasta 1 es la
 * decodificación del primer fotograma, que ocurre después de la red y antes
 * de que haya nada que mostrar.
 *
 * La barra no debe tocar el 100 mientras siga faltando un paso: un tope lleno
 * seguido de espera se lee como algo colgado, no como algo trabajando.
 */
const DOWNLOAD_SHARE = 0.92

/** Progreso real por asset, 0..1 cada uno. */
const parts = { fonts: 0, poster: 0, video: 0 }

/** Progreso mostrado. Persigue al real para que nunca retroceda ni salte. */
const shown = ref(0)
let raf = 0

const raw = () =>
  (parts.fonts * WEIGHTS.fonts + parts.poster * WEIGHTS.poster + parts.video * WEIGHTS.video) * 100

/**
 * Ritmo de la barra. El progreso real avanza a la velocidad de la red, que es
 * plana y aburrida; lo que se muestra pasa antes por esta curva, que le da la
 * cadencia de algo que trabaja: arranque normal, un plantón hacia la mitad,
 * un tramo lento después y una recta final rápida.
 *
 * Es una reasignación del valor, no un retraso: sigue siendo monótona y
 * siempre por debajo del real, así que la barra nunca miente al alza ni
 * retrocede — solo reparte de otro modo el camino que ya se ha recorrido.
 *
 * Los tramos, en progreso real → mostrado:
 *   0–45 → 0–38    empuje inicial
 *   45–52 → 38–40   el plantón: siete puntos reales valen dos en pantalla
 *   52–80 → 40–60   la cuesta lenta
 *   80–100 → 60–100  la recta final, el doble de rápido que el resto
 *
 * Los vértices están por debajo de la diagonal a propósito: así la curva
 * queda siempre por debajo del progreso real y la barra no promete de más.
 */
const PACE: [number, number][] = [
  [0, 0],
  [45, 38],
  [52, 40],
  [80, 60],
  [100, 100],
]

const paced = (v: number) => {
  for (let i = 1; i < PACE.length; i++) {
    const [x1, y1] = PACE[i]
    if (v > x1 && i < PACE.length - 1) continue
    const [x0, y0] = PACE[i - 1]
    // `smoothstep` dentro de cada tramo: con interpolación recta se notaría
    // el cambio de pendiente en cada vértice como un tirón.
    const t = Math.min(1, Math.max(0, (v - x0) / (x1 - x0)))
    return y0 + (y1 - y0) * t * t * (3 - 2 * t)
  }
  return v
}

const target = () => paced(raw())

const paint = () => {
  if (barEl.value) barEl.value.style.width = `${shown.value}%`
}

/**
 * La barra persigue el progreso ya recadenciado con un seguimiento suave en
 * vez de pegarse a él. Una descarga con streaming llega a tirones — cada
 * chunk es un salto — y copiarlos tal cual se ve como una barra epiléptica.
 */
const tick = () => {
  const t = target()
  shown.value += (t - shown.value) * 0.08
  paint()
  raf = requestAnimationFrame(tick)
}

/** Fuentes listas. Tramo corto pero temprano: la barra nace moviéndose. */
const loadFonts = async () => {
  try {
    await document.fonts?.ready
  } catch {
    /* Sin API de fuentes el tramo se da por cumplido: es decorativo. */
  }
  parts.fonts = 1
}

/** El poster del portal, lo primero que se ve detrás del negro. */
const loadPoster = () =>
  new Promise<void>((resolve) => {
    const img = new Image()
    const finish = () => {
      parts.poster = 1
      resolve()
    }
    img.onload = finish
    img.onerror = finish
    img.src = '/media/create-poster.jpg'
  })

/**
 * El video, con progreso por bytes. Se descarga aquí y se entrega al portal
 * como blob para que no vuelva a pedirlo: si dejáramos que la etiqueta
 * `<video>` lo cargara por su cuenta, la barra mediría una descarga y el
 * visitante esperaría otra.
 *
 * Si el servidor no manda `Content-Length` no hay porcentaje que calcular,
 * así que ese caso cae a un avance estimado por bytes recibidos — mejor una
 * barra que avanza sin saber el final que una congelada.
 *
 * La descarga no llena el tramo entera: se detiene en `DOWNLOAD_SHARE` y el
 * resto lo cierra `decodeVideo`. Tener los bytes en memoria no es tener
 * imagen que pintar —falta que el navegador decodifique el primer
 * fotograma— y esa espera caía fuera de la barra: se llenaba al terminar la
 * red y el pase todavía tardaba. El último tramo es ahora ese trabajo.
 */
const loadVideo = async (): Promise<string | null> => {
  try {
    const res = await fetch('/media/create.mp4')
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const total = Number(res.headers.get('content-length')) || 0
    const reader = res.body.getReader()
    // `ArrayBuffer` explícito: el tipo por defecto admite `SharedArrayBuffer`,
    // que `Blob` no acepta. Los chunks de una respuesta de red nunca lo son.
    const chunks: Uint8Array<ArrayBuffer>[] = []
    let received = 0

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      chunks.push(value)
      received += value.length
      const ratio = total
        ? received / total
        : // Sin tamaño conocido: asíntota hacia 0.9 por bytes recibidos.
          1 - Math.exp(-received / 4_000_000) * 0.9
      parts.video = ratio * DOWNLOAD_SHARE
    }

    parts.video = DOWNLOAD_SHARE
    return URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }))
  } catch {
    // Red caída o fetch bloqueado: no bloqueamos la entrada por el fondo.
    // El portal usará su `src` normal y el poster cubre el hueco.
    parts.video = 1
    return null
  }
}

/**
 * Cierra el tramo que la descarga dejó abierto: espera a que el blob sea
 * *reproducible*, no sólo recibido.
 *
 * Se hace sobre un `<video>` suelto, fuera del DOM. El del portal todavía no
 * existe cuando esto corre —el portal se monta después— y lo que se mide aquí
 * es el trabajo de decodificar, que el navegador reaprovecha luego para el
 * elemento real porque la fuente es el mismo blob.
 *
 * `readyState >= 3` es HAVE_FUTURE_DATA: hay fotograma actual y algo más por
 * delante, que es la condición para que arranque sin tirones.
 *
 * El tope existe porque esto puede no completarse nunca —códec rechazado,
 * memoria justa en un móvil—. Sin él, un fallo de decodificación dejaría la
 * barra clavada y el sitio sin entrada posible.
 */
const DECODE_TIMEOUT_MS = 4000

const decodeVideo = (url: string | null): Promise<void> =>
  new Promise((resolve) => {
    if (!url) {
      parts.video = 1
      return resolve()
    }

    const el = document.createElement('video')
    el.muted = true
    el.playsInline = true
    el.preload = 'auto'

    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      el.removeEventListener('canplay', finish)
      el.removeEventListener('error', finish)
      // Sin `src` el elemento suelto queda reteniendo el blob decodificado.
      el.removeAttribute('src')
      parts.video = 1
      resolve()
    }

    const timer = window.setTimeout(finish, DECODE_TIMEOUT_MS)
    el.addEventListener('canplay', finish, { once: true })
    el.addEventListener('error', finish, { once: true })

    el.src = url
    el.load()

    if (el.readyState >= 3) finish()
  })

/* ── Cursor ───────────────────────────────────────────────── */

/**
 * El testigo sigue al puntero: es el cursor de esta pantalla, no un adorno
 * en una esquina. Mientras la carga avanza sin que haya nada que tocar, dar
 * al visitante algo que responda a su mano es lo único que separa una
 * espera de una pantalla muerta.
 *
 * Va con `quickTo` —el mismo seguimiento amortiguado que usa el paralaje
 * del portal— en vez de pegarse a las coordenadas: el retraso es lo que lo
 * hace sentir un objeto arrastrado y no un puntero del sistema repintado.
 */
let quickX: gsap.QuickToFunc | null = null
let quickY: gsap.QuickToFunc | null = null

/** Sin puntero todavía: el testigo espera en el centro en vez de la esquina. */
const cursorSeen = ref(false)

const onPointerMove = (e: PointerEvent) => {
  if (!quickX) return
  if (!cursorSeen.value) {
    // El primer movimiento coloca el testigo de golpe. Animando desde el
    // centro, el visitante vería un objeto cruzando la pantalla hacia su
    // cursor, que se lee como un fallo y no como una respuesta.
    gsap.set(cursorEl.value, { x: e.clientX, y: e.clientY })
    cursorSeen.value = true
    return
  }
  quickX(e.clientX)
  quickY?.(e.clientY)
}

/**
 * Salida por corte, sin fundido.
 *
 * La barra, el rótulo y el testigo se apagan juntos, y el negro no se
 * desvanece: desaparece de un frame al siguiente y deja debajo el portal ya
 * montado, con su recuadro de vídeo listo para abrirse.
 *
 * Es un corte a propósito y no un fundido encadenado: el único gesto de
 * entrada tiene que ser la expansión del recuadro. Fundiendo el negro, esa
 * apertura arrancaba vista a través de un velo y el primer tramo —el que
 * más se mueve— se perdía.
 */
const playExit = () => {
  const tl = gsap.timeline({ onComplete: () => emit('done') })

  // El portal se monta lo primero, antes incluso de que la barra se apague:
  // así usa el apagado como margen para armarse —Three.js crea la escena y
  // compila shaders, y el vídeo todavía tiene que decodificar— en vez de
  // pedir un hueco propio después. Detrás del negro no se ve nada de esto.
  tl.add(() => emit('reveal'))
    // Una pausa corta con la barra llena: sin ella la salida pisa al final
    // justo cuando el ojo va a leerlo.
    .to({}, { duration: 0.15 })
    // El negro se retira aquí, con la barra todavía encendida y en su sitio.
    //
    // Debajo está el recuadro del vídeo, que nace con el alto y el nivel
    // exactos de la barra: al descubrirlo, las dos formas se superponen y lo
    // que queda en pantalla sigue siendo una sola banda blanca centrada. El
    // corte es invisible.
    .set(rootEl.value, { backgroundColor: 'transparent' })
    // Antes de apagarse, la barra se recoge al ancho exacto del recuadro que
    // tiene debajo y se centra sobre él. Es lo que cierra el truco: la barra
    // cruza la pantalla entera y el recuadro nace corto, así que sin esto el
    // blanco sobraría por los lados y el ojo vería dos formas distintas
    // superpuestas en vez de una sola que cambia de contenido.
    //
    // Se anima el ancho —no una escala— porque es la misma propiedad que la
    // barra ha estado usando para medir la carga: seguir con ella hace que
    // este último tramo se lea como el final del mismo gesto y no como algo
    // nuevo que le pasa encima.
    .to(
      barEl.value,
      {
        width: `${OPENING_WIDTH * 100}%`,
        marginLeft: `${((1 - OPENING_WIDTH) / 2) * 100}%`,
        duration: 0.34,
        ease: 'power2.inOut',
      },
      '<',
    )
    // El rótulo se va antes que la barra: al recogerse esta, el texto queda
    // recortado a media palabra y eso sí se lee como un fallo.
    .to([labelEl.value, cursorEl.value], { opacity: 0, duration: 0.18, ease: 'power2.in' }, '<')
    // Y el blanco se retira ya sobre el recuadro, con las dos formas
    // encajadas y el vídeo abriéndose debajo. Los dos gestos corren
    // solapados a propósito: encadenados —primero se apaga la barra, luego
    // crece el vídeo— se leen como dos pasos, y el paso entre pantallas
    // vuelve a notarse por mucho que se recorten los tiempos. Así la barra
    // no se apaga y luego pasa algo: se convierte en lo que pasa.
    .to(barEl.value, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '-=0.12')
    .set(rootEl.value, { opacity: 0 })
}

onMounted(() => {
  if (prefersReducedMotion()) {
    emit('done')
    return
  }

  raf = requestAnimationFrame(tick)

  // Arranca centrado, para que la pantalla no quede vacía antes del primer
  // movimiento del puntero. El -50% va aquí y no en el markup porque GSAP
  // se adueña de `transform` en cuanto anima `x`/`y`.
  gsap.set(cursorEl.value, {
    xPercent: -50,
    yPercent: -50,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  })
  quickX = gsap.quickTo(cursorEl.value, 'x', { duration: 0.5, ease: 'power3.out' })
  quickY = gsap.quickTo(cursorEl.value, 'y', { duration: 0.5, ease: 'power3.out' })
  window.addEventListener('pointermove', onPointerMove)

  const floor = new Promise<void>((resolve) => setTimeout(resolve, MIN_VISIBLE_MS))

  Promise.all([loadFonts(), loadPoster(), loadVideo(), floor]).then(async ([, , videoUrl]) => {
    if (videoUrl) {
      // El portal lo lee al montarse y se ahorra la segunda descarga.
      window.__portalVideoUrl = videoUrl
    }

    // Los bytes ya están; falta que sean imagen. Esto cierra el tramo final
    // de la barra, de modo que el 100 signifique «hay fotograma que pintar»
    // y el portal pueda abrir el plano con el clip ya corriendo.
    await decodeVideo(videoUrl)

    // El seguimiento suave nunca alcanza el 100 por sí solo — se acerca
    // asintóticamente. Este último tramo lo cierra de golpe y con `steps`,
    // para que el final se lea como un tope y no como un frenado.
    cancelAnimationFrame(raf)
    gsap.to(shown, {
      value: 100,
      duration: 0.45,
      ease: 'steps(6)',
      onUpdate: paint,
      onComplete: playExit,
    })
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('pointermove', onPointerMove)
})
</script>

<template>
  <div ref="rootEl" class="fixed inset-0 z-[60] overflow-hidden bg-black">
    <div class="pointer-events-none absolute inset-0">
      <!-- Cursor de la pantalla de carga: el círculo sigue al puntero y el
           punto verde late dentro mientras algo se está descargando. Es el
           único color aquí, y por eso se lee como «hay señal» sin rótulo.

           `left-0 top-0` y el resto por transform: GSAP escribe `x`/`y`
           como translate, así que el elemento tiene que partir del origen
           para que esas coordenadas sean las del puntero tal cual. El
           centrado sobre la punta del cursor va en `xPercent`/`yPercent`
           desde el script, no en clases de Tailwind: son la misma
           propiedad `transform` y GSAP sobrescribiría las clases. -->
      <div
        ref="cursorEl"
        class="absolute top-0 left-0 flex h-11 w-11 items-center justify-center rounded-full border border-white/35 will-change-transform"
      >
        <span class="preloader-pulse h-2 w-2 rounded-full bg-[#34d399]"></span>
      </div>

      <!-- La barra. Blanca sólida, pegada al borde izquierdo y sin ancho
           máximo: su ancho ES el progreso, así que al 100% cruza la pantalla
           entera. El rótulo va dentro, recortado en negro. -->
      <div class="absolute top-1/2 left-0 w-full -translate-y-1/2">
        <div
          ref="barEl"
          class="h-9 w-0 overflow-hidden bg-white will-change-[width]"
        >
          <!-- El texto se ancla al viewport, no a la barra: así no se estira
               ni se desplaza mientras el blanco lo descubre. -->
          <span
            ref="labelEl"
            class="block w-screen pl-2 font-mono text-base leading-9 whitespace-nowrap text-black"
          >
            LOADING...
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Late despacio: es un testigo de actividad, no una alarma. */
.preloader-pulse {
  animation: preloader-pulse 1.1s ease-in-out infinite;
}

@keyframes preloader-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}

@media (prefers-reduced-motion: reduce) {
  .preloader-pulse {
    animation: none;
  }
}
</style>
